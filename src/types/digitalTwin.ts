import { DetectionResult, PreliminarySeverityAssessment } from './index';

export type ZoneId = 'zone-1' | 'zone-2' | 'zone-3' | 'zone-4' | 'zone-5' | 'zone-6';

export type CameraId = 'CAM-01' | 'CAM-02' | 'CAM-03' | 'CAM-04' | 'CAM-05' | 'CAM-06';

export type ZoneStatus = 
  | 'untested'          // No image tested yet
  | 'normal'            // Tested with backend, 0 fire/smoke
  | 'detected_fire'     // Genuine backend YOLO detection of fire
  | 'detected_smoke'    // Genuine backend YOLO detection of smoke only
  | 'simulated_fire'    // Projected fire via hypothetical spread simulation
  | 'simulated_smoke'   // Projected smoke via hypothetical spread simulation
  | 'suppressed';       // Extinguished via simulated water/CO2 suppression

export interface ZoneGeometry {
  id: ZoneId;
  name: string;
  cameraId: CameraId;
  // Percentage coordinates relative to floor plan (0..100)
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  accentColor: string;
  borderColor: string;
  bgTint: string;
  suppressionType: 'water' | 'co2';
  sprinklerX: number;
  sprinklerY: number;
  cameraMarkerX: number;
  cameraMarkerY: number;
}

export interface ZoneRuntimeState {
  zoneId: ZoneId;
  name: string;
  cameraId: CameraId;
  status: ZoneStatus;
  isOriginDetection: boolean; // true if this zone triggered the outbreak from real YOLO inference
  imageFile: File | null;
  imagePreviewUrl: string | null;
  samplePath: string;
  detectionResult: DetectionResult | null;
  preliminarySeverity: PreliminarySeverityAssessment | null;
  lastTestedTimestamp: string | null;
  suppressionActive: boolean;
  suppressionType: 'water' | 'co2';
  temperatureEstC?: number;
}

export interface SimulationControlsState {
  isRunning: boolean;
  timeStepMinutes: number; // 0 to 45 min
  speedMultiplier: number; // 1x, 2x, 5x
  waterSprinklerActive: boolean;
  co2FloodActive: boolean;
  originZoneId: ZoneId | null;
}

export interface ZoneAdjacency {
  zoneId: ZoneId;
  neighbors: ZoneId[];
  // Minutes until smoke infiltrates through corridor doors
  smokeSpreadDelayMin: number;
  // Minutes until flame propagates through corridor doors
  fireSpreadDelayMin: number;
}

export interface SimulationEventLogEntry {
  id: string;
  timestamp: string;
  simTimeMin: number;
  category: 'MODEL_DETECTION' | 'SIMULATED_SPREAD' | 'SIMULATED_SUPPRESSION' | 'SYSTEM';
  zoneId?: ZoneId;
  zoneName?: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
}

