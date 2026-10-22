import type { DetectionResult, BoundingBox } from '../types';

export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';

export interface HealthCheckResult {
  online: boolean;
  latencyMs: number;
  info?: {
    model?: string;
    version?: string;
    device?: string;
    status?: string;
    classNames?: Record<string, string>;
  };
  error?: string;
}

interface BackendHealthResponse {
  status?: string;
  model?: string;
  model_name?: string;
  version?: string;
  device?: string;
  model_loaded?: boolean;
  model_path?: string;
  class_names?: Record<string, string>;
  error?: string | null;
}

interface BackendDetectionItem {
  class_id?: number;
  label?: string;
  confidence: number;
  bbox?: [number, number, number, number];
  normalized_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  area_pixels?: number;
}

interface BackendDetectResponse {
  success?: boolean;
  filename?: string;
  model?: string;
  inference_time_ms?: number;
  image_width?: number;
  image_height?: number;
  count?: number;
  detections?: BackendDetectionItem[];
  preliminary_severity?: {
    level: 'nominal' | 'low' | 'moderate' | 'high' | 'critical';
    score: number;
    label: string;
    is_preliminary_estimate: boolean;
    evidence: {
      fire_coverage_pct: number;
      smoke_coverage_pct: number;
      fire_cluster_count: number;
      smoke_cluster_count: number;
      co_occurrence: boolean;
      peak_detector_confidence: number;
      contributing_factors: string[];
    };
    disclaimer: string;
  };
  message?: string;
  detail?: string;
  error?: string;
}

export class ApiService {
  private static instance: ApiService;
  private baseUrl: string = DEFAULT_API_BASE_URL;

  private constructor() {
    try {
      const saved = localStorage.getItem('firetwin_api_url');
      if (saved) {
        this.baseUrl = this.cleanBaseUrl(saved);
      }
    } catch {
      // Use default URL if localStorage is unavailable
    }
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private cleanBaseUrl(url: string): string {
    return url.trim().replace(/\/+$/, '');
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return (
        (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
        parsed.hostname.length > 0
      );
    } catch {
      return false;
    }
  }

  public setBaseUrl(url: string): void {
    const cleaned = this.cleanBaseUrl(url);
    if (!this.isValidUrl(cleaned)) {
      throw new Error('Enter a valid backend URL, e.g. http://127.0.0.1:8000');
    }
    this.baseUrl = cleaned;
    try {
      localStorage.setItem('firetwin_api_url', cleaned);
    } catch {
      // Keep URL for session
    }
  }

  /**
   * Pings the FastAPI health endpoint to check backend status and loaded YOLO model.
   */
  public async checkHealth(customUrl?: string): Promise<HealthCheckResult> {
    const baseUrl = this.cleanBaseUrl(customUrl ?? this.baseUrl);

    if (!this.isValidUrl(baseUrl)) {
      return {
        online: false,
        latencyMs: 0,
        error: 'Invalid backend URL format.',
      };
    }

    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }).catch(async () => {
        // Fallback to /api/v1/health
        return await fetch(`${baseUrl}/api/v1/health`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        return {
          online: false,
          latencyMs,
          error: `Health check failed: HTTP ${response.status}`,
        };
      }

      const data = (await response.json()) as BackendHealthResponse;

      const info = {
        model: data.model_name ?? data.model ?? 'FireTwin_YOLO11s',
        version: data.version,
        device: data.device ?? 'cpu',
        status: data.status,
        classNames: data.class_names,
      };

      if (data.model_loaded === false) {
        return {
          online: false,
          latencyMs,
          info,
          error: data.error ?? 'YOLO model file could not be loaded into memory.',
        };
      }

      return {
        online: true,
        latencyMs,
        info: {
          ...info,
          status: data.status ?? 'online',
        },
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.name === 'AbortError'
            ? 'Health check timed out (4s). Ensure FastAPI server is running.'
            : `Connection refused: ${error.message}`
          : 'Unable to connect to the FastAPI backend.';

      return {
        online: false,
        latencyMs: Math.round(performance.now() - startTime),
        error: message,
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  /**
   * Run real YOLO11s AI inference on an uploaded image.
   * Calls POST /detect on the FastAPI backend.
   */
  public async detect(
    file: File,
    options: { confidence: number; iou: number }
  ): Promise<DetectionResult> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file (.jpg, .png, .webp).');
    }

    if (file.size > 25 * 1024 * 1024) {
      throw new Error('Image size must be 25 MB or smaller.');
    }

    // Verify backend is reachable
    const health = await this.checkHealth();
    if (!health.online) {
      throw new Error(
        `FastAPI backend is offline at ${this.baseUrl}. ` +
        `Error: ${health.error ?? 'Server unreachable'}. ` +
        `Please ensure the backend is running at ${this.baseUrl} and try again.`
      );
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('confidence', options.confidence.toString());
    formData.append('iou', options.iou.toString());

    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${this.baseUrl}/detect`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      }).catch(async () => {
        return await fetch(`${this.baseUrl}/api/v1/detect`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const responseText = await response.text();

      let data: BackendDetectResponse;
      try {
        data = responseText ? (JSON.parse(responseText) as BackendDetectResponse) : {};
      } catch {
        throw new Error(`Backend returned invalid response (HTTP ${response.status}).`);
      }

      if (!response.ok) {
        throw new Error(data.detail ?? data.error ?? `Inference failed: HTTP ${response.status}`);
      }

      if (data.success !== true) {
        throw new Error(data.error ?? 'The backend did not confirm successful detection.');
      }

      const imgW = data.image_width ?? 1;
      const imgH = data.image_height ?? 1;

      // Transform real YOLO detections into normalized BoundingBox objects for canvas/UI overlay
      const boxes: BoundingBox[] = (data.detections ?? []).map((det, idx) => {
        const label = (det.label ?? '').toLowerCase();
        const isFire = label.includes('fire');
        const isSmoke = label.includes('smoke');
        const detClass = isFire ? 'fire' : isSmoke ? 'smoke' : 'fire';

        let x = 0;
        let y = 0;
        let w = 0;
        let h = 0;
        let areaPixels = det.area_pixels;

        if (det.normalized_box) {
          x = det.normalized_box.x;
          y = det.normalized_box.y;
          w = det.normalized_box.width;
          h = det.normalized_box.height;
        } else if (det.bbox && det.bbox.length === 4) {
          const [x1, y1, x2, y2] = det.bbox;
          x = x1 / imgW;
          y = y1 / imgH;
          w = Math.max(0, x2 - x1) / imgW;
          h = Math.max(0, y2 - y1) / imgH;
          if (!areaPixels) {
            areaPixels = Math.round((x2 - x1) * (y2 - y1));
          }
        }

        return {
          id: `det-${idx + 1}`,
          class: detClass,
          confidence: det.confidence,
          x,
          y,
          width: w,
          height: h,
          areaPixels,
        };
      });

      const fireCount = boxes.filter(b => b.class === 'fire').length;
      const smokeCount = boxes.filter(b => b.class === 'smoke').length;
      const highestConfidence = boxes.reduce((max, b) => Math.max(max, b.confidence), 0);
      const mediaUrl = URL.createObjectURL(file);

      return {
        id: `det-${Date.now()}`,
        timestamp: new Date().toISOString(),
        fileName: file.name,
        fileType: 'image',
        fileSize: file.size,
        dimensions: { width: imgW, height: imgH },
        mediaUrl,
        isDemo: false,
        inferenceTimeMs: data.inference_time_ms ?? latencyMs,
        modelUsed: data.model ?? 'FireTwin_YOLO11s (Trained)',
        boxes,
        counts: {
          fire: fireCount,
          smoke: smokeCount,
          total: boxes.length,
        },
        highestConfidence,
        preliminarySeverity: data.preliminary_severity,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Detection request timed out (60s). Please try again or use a smaller image.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}

export const apiService = ApiService.getInstance();
