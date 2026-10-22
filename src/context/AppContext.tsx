import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  ViewType, 
  Incident, 
  DetectionResult, 
  SystemSettings, 
  IncidentStatus,
  ZoneId,
  CameraId,
  ZoneRuntimeState,
  SimulationControlsState,
  SimulationEventLogEntry
} from '../types';
import { apiService, DEFAULT_API_BASE_URL } from '../services/api';
import { DEMO_INCIDENTS } from '../data/demoIncidents';
import { INITIAL_DIGITAL_TWIN_STATES, DIGITAL_TWIN_ZONES_GEOMETRY } from '../data/digitalTwinData';

export interface ActiveDetectionSession {
  selectedFile: File | null;
  filePreviewUrl: string | null;
  detectionResult: DetectionResult | null;
  targetCameraId: CameraId;
  targetZoneId: ZoneId;
  isLoading: boolean;
  error: string | null;
}

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  backendStatus: 'checking' | 'online' | 'offline';
  backendLatency: number;
  backendInfo: any;
  backendError: string | null;
  pingBackend: (customUrl?: string) => Promise<boolean>;
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  incidents: Incident[];
  addIncident: (incident: Incident) => void;
  updateIncidentStatus: (id: string, status: IncidentStatus) => void;
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;
  activeDetection: DetectionResult | null;
  setActiveDetection: (result: DetectionResult | null) => void;
  detectionHistory: DetectionResult[];
  addDetectionToHistory: (result: DetectionResult) => void;
  clearDetectionHistory: () => void;
  showDemoRecordsInHistory: boolean;
  setShowDemoRecordsInHistory: (show: boolean) => void;
  threatLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  triggerAlarmSound: () => void;
  // Shared Active Detection Lab Session
  activeDetectionSession: ActiveDetectionSession;
  setActiveDetectionSession: React.Dispatch<React.SetStateAction<ActiveDetectionSession>>;
  updateActiveDetectionSession: (partial: Partial<ActiveDetectionSession>) => void;
  clearActiveDetectionSession: () => void;
  // Shared Digital Twin Zone & Simulation State
  digitalTwinZones: Record<ZoneId, ZoneRuntimeState>;
  setDigitalTwinZones: React.Dispatch<React.SetStateAction<Record<ZoneId, ZoneRuntimeState>>>;
  updateDigitalTwinZone: (zoneId: ZoneId, update: Partial<ZoneRuntimeState>) => void;
  applyDetectionToZone: (zoneId: ZoneId, result: DetectionResult, file?: File | null, previewUrl?: string | null) => void;
  simControls: SimulationControlsState;
  setSimControls: React.Dispatch<React.SetStateAction<SimulationControlsState>>;
  updateSimControls: (partial: Partial<SimulationControlsState>) => void;
  simEventLogs: SimulationEventLogEntry[];
  addSimEventLog: (
    category: SimulationEventLogEntry['category'],
    message: string,
    severity?: SimulationEventLogEntry['severity'],
    zoneId?: ZoneId,
    zoneName?: string
  ) => void;
  clearSimEventLogs: () => void;
  resetSimulation: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'firetwin_settings_v1';
const HISTORY_STORAGE_KEY = 'firetwin_detection_history_v1';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('command-center');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendLatency, setBackendLatency] = useState<number>(0);
  const [backendInfo, setBackendInfo] = useState<any>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      apiBaseUrl: apiService.getBaseUrl() || DEFAULT_API_BASE_URL,
      confidenceThreshold: 0.45,
      iouThreshold: 0.45,
      soundAlerts: true,
      scanlineEffect: false,
      autoRefreshIntervalSec: 10,
    };
  });

  const [incidents, setIncidents] = useState<Incident[]>(DEMO_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeDetection, setActiveDetection] = useState<DetectionResult | null>(null);

  const [detectionHistory, setDetectionHistory] = useState<DetectionResult[]>(() => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [showDemoRecordsInHistory, setShowDemoRecordsInHistory] = useState<boolean>(false);

  // Shared Active Detection Lab Session (Preserved across view switches)
  const [activeDetectionSession, setActiveDetectionSession] = useState<ActiveDetectionSession>({
    selectedFile: null,
    filePreviewUrl: null,
    detectionResult: null,
    targetCameraId: 'CAM-01',
    targetZoneId: 'zone-1',
    isLoading: false,
    error: null,
  });

  const updateActiveDetectionSession = useCallback((partial: Partial<ActiveDetectionSession>) => {
    setActiveDetectionSession(prev => ({ ...prev, ...partial }));
  }, []);

  const clearActiveDetectionSession = useCallback(() => {
    setActiveDetectionSession(prev => {
      if (prev.filePreviewUrl && !prev.filePreviewUrl.startsWith('http')) {
        URL.revokeObjectURL(prev.filePreviewUrl);
      }
      return {
        selectedFile: null,
        filePreviewUrl: null,
        detectionResult: null,
        targetCameraId: prev.targetCameraId,
        targetZoneId: prev.targetZoneId,
        isLoading: false,
        error: null,
      };
    });
    setActiveDetection(null);
  }, []);

  // Shared Digital Twin Zone Runtime States (Preserved across view switches)
  const [digitalTwinZones, setDigitalTwinZones] = useState<Record<ZoneId, ZoneRuntimeState>>(INITIAL_DIGITAL_TWIN_STATES);

  const updateDigitalTwinZone = useCallback((zoneId: ZoneId, update: Partial<ZoneRuntimeState>) => {
    setDigitalTwinZones(prev => {
      if (!prev[zoneId]) return prev;
      return {
        ...prev,
        [zoneId]: { ...prev[zoneId], ...update },
      };
    });
  }, []);

  // Simulation Controls State (Preserved across view switches)
  const [simControls, setSimControls] = useState<SimulationControlsState>({
    isRunning: false,
    timeStepMinutes: 0,
    speedMultiplier: 1,
    waterSprinklerActive: false,
    co2FloodActive: false,
    originZoneId: null,
  });

  const updateSimControls = useCallback((partial: Partial<SimulationControlsState>) => {
    setSimControls(prev => ({ ...prev, ...partial }));
  }, []);

  // Simulation Event Logs (Preserved across view switches)
  const [simEventLogs, setSimEventLogs] = useState<SimulationEventLogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      simTimeMin: 0,
      category: 'SYSTEM',
      message: 'FireTwin Building Digital Twin initialized in 3D Cutaway mode. All 6 zones in UNTESTED state.',
      severity: 'info',
    }
  ]);

  const addSimEventLog = useCallback((
    category: SimulationEventLogEntry['category'],
    message: string,
    severity: SimulationEventLogEntry['severity'] = 'info',
    zoneId?: ZoneId,
    zoneName?: string
  ) => {
    const entry: SimulationEventLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      simTimeMin: simControls.timeStepMinutes,
      category,
      zoneId,
      zoneName,
      message,
      severity,
    };
    setSimEventLogs(prev => [entry, ...prev.slice(0, 99)]);
  }, [simControls.timeStepMinutes]);

  const clearSimEventLogs = useCallback(() => {
    setSimEventLogs([]);
  }, []);

  // Ping backend check
  const pingBackend = useCallback(async (customUrl?: string): Promise<boolean> => {
    setBackendStatus('checking');
    const result = await apiService.checkHealth(customUrl);
    setBackendLatency(result.latencyMs);
    if (result.online) {
      setBackendStatus('online');
      setBackendInfo(result.info);
      setBackendError(null);
      return true;
    } else {
      setBackendStatus('offline');
      setBackendInfo(null);
      setBackendError(result.error || 'Server unreachable');
      return false;
    }
  }, []);

  // Initial backend health check
  useEffect(() => {
    pingBackend();
    const interval = setInterval(() => {
      pingBackend();
    }, (settings.autoRefreshIntervalSec || 15) * 1000);
    return () => clearInterval(interval);
  }, [pingBackend, settings.autoRefreshIntervalSec]);

  // Persist settings
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.apiBaseUrl) {
        apiService.setBaseUrl(newSettings.apiBaseUrl);
      }
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const addIncident = (incident: Incident) => {
    setIncidents(prev => [incident, ...prev]);
  };

  const updateIncidentStatus = (id: string, status: IncidentStatus) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status } : inc));
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident(prev => prev ? { ...prev, status } : null);
    }
  };

  const addDetectionToHistory = (result: DetectionResult) => {
    setDetectionHistory(prev => {
      const updated = [result, ...prev];
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
      return updated;
    });
  };

  const clearDetectionHistory = () => {
    setDetectionHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  // Sound generator using Web Audio API for industrial alert pings
  const triggerAlarmSound = useCallback(() => {
    if (!settings.soundAlerts) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio autoplay policy might restrict without user gesture
    }
  }, [settings.soundAlerts]);

  // Apply genuine YOLO11s detection to a target Digital Twin zone
  const applyDetectionToZone = useCallback((
    zoneId: ZoneId,
    result: DetectionResult,
    file?: File | null,
    previewUrl?: string | null
  ) => {
    const hasFire = result.counts.fire > 0;
    const hasSmoke = result.counts.smoke > 0;
    const newStatus: ZoneRuntimeState['status'] = hasFire 
      ? 'detected_fire' 
      : hasSmoke 
      ? 'detected_smoke' 
      : 'normal';

    const geom = DIGITAL_TWIN_ZONES_GEOMETRY.find(z => z.id === zoneId);
    const zoneName = geom?.name || zoneId;
    const camId = geom?.cameraId || '';

    setDigitalTwinZones(prev => {
      const current = prev[zoneId];
      if (!current) return prev;
      return {
        ...prev,
        [zoneId]: {
          ...current,
          imageFile: file !== undefined ? file : current.imageFile,
          imagePreviewUrl: previewUrl !== undefined ? previewUrl : current.imagePreviewUrl,
          status: newStatus,
          isOriginDetection: hasFire, // strictly true ONLY if counts.fire > 0
          detectionResult: result,
          preliminarySeverity: result.preliminarySeverity || null,
          lastTestedTimestamp: new Date().toLocaleTimeString(),
        }
      };
    });

    if (hasFire) {
      setSimControls(prev => ({
        ...prev,
        originZoneId: zoneId,
      }));
      triggerAlarmSound();
      addSimEventLog(
        'MODEL_DETECTION',
        `YOLO11s optical detection confirmed FIRE in ${zoneName} (${camId}) with ${(result.highestConfidence * 100).toFixed(1)}% confidence. Verified outbreak origin established.`,
        'danger',
        zoneId,
        zoneName
      );
    } else if (hasSmoke) {
      addSimEventLog(
        'MODEL_DETECTION',
        `YOLO11s optical detection confirmed SMOKE in ${zoneName} (${camId}) with ${(result.highestConfidence * 100).toFixed(1)}% confidence. Smoke hazard detected (smoke alone cannot initiate fire spread).`,
        'warning',
        zoneId,
        zoneName
      );
    } else {
      addSimEventLog(
        'MODEL_DETECTION',
        `YOLO11s optical inference completed on ${zoneName} (${camId}): 0 fire/smoke detections. Baseline confirmed nominal.`,
        'success',
        zoneId,
        zoneName
      );
    }

    setActiveDetection(result);
    addDetectionToHistory(result);
  }, [addSimEventLog, triggerAlarmSound, addDetectionToHistory]);

  // Reset Simulation to T+0 without losing genuine YOLO11s detections
  const resetSimulation = useCallback(() => {
    setSimControls({
      isRunning: false,
      timeStepMinutes: 0,
      speedMultiplier: 1,
      waterSprinklerActive: false,
      co2FloodActive: false,
      originZoneId: null,
    });
    setDigitalTwinZones(prev => {
      const next = { ...prev };
      (Object.keys(next) as ZoneId[]).forEach(zid => {
        const z = next[zid];
        let baseline: ZoneRuntimeState['status'] = 'untested';
        if (z.detectionResult) {
          if (z.detectionResult.counts.fire > 0) {
            baseline = 'detected_fire';
          } else if (z.detectionResult.counts.smoke > 0) {
            baseline = 'detected_smoke';
          } else {
            baseline = 'normal';
          }
        }
        next[zid] = {
          ...z,
          status: baseline,
          suppressionActive: false,
        };
      });
      return next;
    });
    addSimEventLog('SYSTEM', 'Simulation reset to T+0m baseline. Hypothetical spread cleared; verified detections preserved.', 'info');
  }, [addSimEventLog]);

  // Derived threat level based on active incidents
  const threatLevel = React.useMemo(() => {
    const activeCritical = incidents.filter(i => i.status === 'active' && i.severity === 'critical').length;
    const activeHigh = incidents.filter(i => i.status === 'active' && i.severity === 'high').length;
    if (activeCritical > 0) return 'CRITICAL';
    if (activeHigh > 0) return 'HIGH';
    if (incidents.some(i => i.status === 'active')) return 'ELEVATED';
    return 'LOW';
  }, [incidents]);

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        backendStatus,
        backendLatency,
        backendInfo,
        backendError,
        pingBackend,
        settings,
        updateSettings,
        incidents,
        addIncident,
        updateIncidentStatus,
        selectedIncident,
        setSelectedIncident,
        activeDetection,
        setActiveDetection,
        detectionHistory,
        addDetectionToHistory,
        clearDetectionHistory,
        showDemoRecordsInHistory,
        setShowDemoRecordsInHistory,
        threatLevel,
        triggerAlarmSound,
        activeDetectionSession,
        setActiveDetectionSession,
        updateActiveDetectionSession,
        clearActiveDetectionSession,
        digitalTwinZones,
        setDigitalTwinZones,
        updateDigitalTwinZone,
        applyDetectionToZone,
        simControls,
        setSimControls,
        updateSimControls,
        simEventLogs,
        addSimEventLog,
        clearSimEventLogs,
        resetSimulation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
