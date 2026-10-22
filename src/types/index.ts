export type ViewType = 
  | 'command-center'
  | 'ai-detection-lab'
  | 'incidents'
  | 'fire-spread'
  | 'containment'
  | 'detection-history'
  | 'settings';

export type DetectionClass = 'fire' | 'smoke';
export type IncidentSeverity = 'critical' | 'high' | 'moderate' | 'low';
export type IncidentStatus = 'active' | 'investigating' | 'contained' | 'resolved';

export type PreliminarySeverityTier = 'nominal' | 'low' | 'moderate' | 'high' | 'critical';

export interface SeverityEvidence {
  fire_coverage_pct: number;
  smoke_coverage_pct: number;
  fire_cluster_count: number;
  smoke_cluster_count: number;
  co_occurrence: boolean;
  peak_detector_confidence: number;
  contributing_factors: string[];
}

export interface PreliminarySeverityAssessment {
  level: PreliminarySeverityTier;
  score: number;
  label: string;
  is_preliminary_estimate: boolean;
  evidence: SeverityEvidence;
  disclaimer: string;
}

export interface BoundingBox {
  id: string;
  class: DetectionClass;
  confidence: number;
  // Normalized 0..1 or pixel coordinates
  x: number; // top-left x %
  y: number; // top-left y %
  width: number; // width %
  height: number; // height %
  areaPixels?: number;
}

export interface DetectionResult {
  id: string;
  timestamp: string;
  fileName: string;
  fileType: 'image' | 'video';
  fileSize: number;
  dimensions?: { width: number; height: number };
  mediaUrl: string;
  isDemo: boolean;
  inferenceTimeMs: number;
  modelUsed: string;
  boxes: BoundingBox[];
  counts: {
    fire: number;
    smoke: number;
    total: number;
  };
  highestConfidence: number;
  preliminarySeverity?: PreliminarySeverityAssessment;
}

export interface Incident {
  id: string;
  title: string;
  type: 'fire' | 'smoke' | 'combined';
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  zone: string;
  sector: string;
  timestamp: string;
  confidence: number;
  cameraFeedId: string;
  evidenceImageUrl: string;
  isDemo: boolean;
  description: string;
  spreadRateEstimate?: string;
  temperaturePeak?: number;
  actionsTaken: string[];
}

export interface SystemSettings {
  apiBaseUrl: string;
  confidenceThreshold: number; // 0.1 to 1.0
  iouThreshold: number; // 0.1 to 1.0
  soundAlerts: boolean;
  scanlineEffect: boolean;
  autoRefreshIntervalSec: number;
}

export interface TelemetryPoint {
  time: string;
  fireCount: number;
  smokeCount: number;
  totalAlerts: number;
}

export * from './digitalTwin';
