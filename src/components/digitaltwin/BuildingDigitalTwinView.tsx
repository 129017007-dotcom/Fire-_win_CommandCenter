import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { 
  ZoneId, 
  CameraId, 
  ZoneRuntimeState, 
  SimulationControlsState,
  SimulationEventLogEntry
} from '../../types/digitalTwin';
import { 
  DIGITAL_TWIN_ZONES_GEOMETRY, 
  INITIAL_DIGITAL_TWIN_STATES, 
  ZONE_ADJACENCY_GRAPH 
} from '../../data/digitalTwinData';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { 
  Flame, 
  CloudRain, 
  Video, 
  UploadCloud, 
  RefreshCw, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Info,
  Droplets,
  Wind,
  Layers,
  ChevronRight,
  Maximize2,
  Cpu,
  Sparkles,
  HelpCircle,
  Eye,
  Box as BoxIcon,
  Building2,
  SkipForward,
  FastForward,
  History,
  Trash2
} from 'lucide-react';
import { BuildingDigitalTwin3D } from './BuildingDigitalTwin3D';

export const BuildingDigitalTwinView: React.FC = () => {
  const { 
    settings, 
    triggerAlarmSound,
    digitalTwinZones: zonesState,
    setDigitalTwinZones: setZonesState,
    simControls: simState,
    setSimControls: setSimState,
    simEventLogs: eventLogs,
    addSimEventLog: addEventLog,
    clearSimEventLogs: handleClearEventLogs,
    resetSimulation: handleResetSimulation,
    applyDetectionToZone,
    setCurrentView,
    updateActiveDetectionSession,
  } = useApp();

  // 3D vs 2D View Switcher state (default '3d' foundation)
  const [digitalTwinViewMode, setDigitalTwinViewMode] = useState<'3d' | '2d'>('3d');

  const [selectedZoneId, setSelectedZoneId] = useState<ZoneId | null>(null);
  const [inspectingZoneId, setInspectingZoneId] = useState<ZoneId | null>(null);

  const [logFilter, setLogFilter] = useState<'ALL' | 'MODEL_DETECTION' | 'SIMULATED_SPREAD' | 'SIMULATED_SUPPRESSION'>('ALL');
  const loggedSpreadKeysRef = useRef<Set<string>>(new Set());

  // Inference execution tracking
  const [analyzingZoneId, setAnalyzingZoneId] = useState<ZoneId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hidden file inputs for camera cards
  const fileInputRefs = useRef<Record<CameraId, HTMLInputElement | null>>({
    'CAM-01': null,
    'CAM-02': null,
    'CAM-03': null,
    'CAM-04': null,
    'CAM-05': null,
    'CAM-06': null,
  });

  // Check if at least one zone has confirmed YOLO11s fire detection
  const hasActiveFireDetection = Object.values(zonesState).some(
    z => z.isOriginDetection
  );

  // Simulation Timer Loop with race-condition prevention
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (simState.isRunning) {
      interval = setInterval(() => {
        setSimState(prev => {
          if (prev.timeStepMinutes >= 45) {
            return { ...prev, isRunning: false, timeStepMinutes: 45 };
          }
          return { ...prev, timeStepMinutes: prev.timeStepMinutes + 1 };
        });
      }, 1000 / simState.speedMultiplier);
    }
    return () => clearInterval(interval);
  }, [simState.isRunning, simState.speedMultiplier, setSimState]);

  // Deterministic multi-hop spread simulation based on timeStepMinutes, verified origin, and suppression
  useEffect(() => {
    // 1. Identify verified fire outbreak origins (strictly requires genuine YOLO11s fire detection)
    const originZoneIds = (Object.keys(zonesState) as ZoneId[]).filter(
      zid => zonesState[zid].isOriginDetection
    );

    // If at T+0 or no verified fire origin exists, enforce baseline detection state
    if (originZoneIds.length === 0 || simState.timeStepMinutes === 0) {
      loggedSpreadKeysRef.current.clear();
      setZonesState(prev => {
        let changed = false;
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
          if (z.status !== baseline || z.suppressionActive) {
            changed = true;
            next[zid] = { ...z, status: baseline, suppressionActive: false };
          }
        });
        return changed ? next : prev;
      });
      return;
    }

    // 2. Multi-hop shortest propagation time calculation across ZONE_ADJACENCY_GRAPH
    const fireArrivalTimes: Record<ZoneId, number> = {
      'zone-1': Infinity, 'zone-2': Infinity, 'zone-3': Infinity,
      'zone-4': Infinity, 'zone-5': Infinity, 'zone-6': Infinity,
    };
    const smokeArrivalTimes: Record<ZoneId, number> = {
      'zone-1': Infinity, 'zone-2': Infinity, 'zone-3': Infinity,
      'zone-4': Infinity, 'zone-5': Infinity, 'zone-6': Infinity,
    };

    originZoneIds.forEach(originId => {
      fireArrivalTimes[originId] = 0;
      smokeArrivalTimes[originId] = 0;
    });

    // Graph relaxation for corridor connections
    for (let iter = 0; iter < 6; iter++) {
      (Object.keys(ZONE_ADJACENCY_GRAPH) as ZoneId[]).forEach(u => {
        const adj = ZONE_ADJACENCY_GRAPH[u];
        if (fireArrivalTimes[u] < Infinity) {
          adj.neighbors.forEach(v => {
            const sTime = fireArrivalTimes[u] + adj.smokeSpreadDelayMin;
            if (sTime < smokeArrivalTimes[v]) {
              smokeArrivalTimes[v] = sTime;
            }
            const fTime = fireArrivalTimes[u] + adj.fireSpreadDelayMin;
            if (fTime < fireArrivalTimes[v]) {
              fireArrivalTimes[v] = fTime;
            }
          });
        }
      });
    }

    // 3. Apply deterministic states to each zone
    setZonesState(prev => {
      let changed = false;
      const next = { ...prev };

      (Object.keys(next) as ZoneId[]).forEach(zid => {
        const z = next[zid];

        // Determine baseline detection state
        let baselineStatus: ZoneRuntimeState['status'] = 'untested';
        if (z.detectionResult) {
          if (z.detectionResult.counts.fire > 0) {
            baselineStatus = 'detected_fire';
          } else if (z.detectionResult.counts.smoke > 0) {
            baselineStatus = 'detected_smoke';
          } else {
            baselineStatus = 'normal';
          }
        }

        const isSuppressedType = (z.suppressionType === 'water' && simState.waterSprinklerActive) ||
                                 (z.suppressionType === 'co2' && simState.co2FloodActive);

        let targetStatus: ZoneRuntimeState['status'] = baselineStatus;
        let targetSuppressionActive = false;

        if (z.isOriginDetection) {
          // Genuine YOLO11s fire origin
          if (isSuppressedType) {
            targetStatus = 'suppressed';
            targetSuppressionActive = true;
          } else {
            targetStatus = 'detected_fire';
            targetSuppressionActive = false;
          }
        } else {
          // Non-origin zone: check if simulated spread has reached this room
          if (simState.timeStepMinutes >= fireArrivalTimes[zid]) {
            if (isSuppressedType) {
              targetStatus = 'suppressed';
              targetSuppressionActive = true;
            } else {
              targetStatus = 'simulated_fire';
              targetSuppressionActive = false;
              const eventKey = `${zid}-fire`;
              if (!loggedSpreadKeysRef.current.has(eventKey)) {
                loggedSpreadKeysRef.current.add(eventKey);
                addEventLog(
                  'SIMULATED_SPREAD',
                  `Thermal corridor flashover: Simulated fire engulfed ${z.name} (${z.cameraId}) at T+${simState.timeStepMinutes}m.`,
                  'danger',
                  zid,
                  z.name
                );
              }
            }
          } else if (simState.timeStepMinutes >= smokeArrivalTimes[zid]) {
            if (isSuppressedType) {
              targetStatus = 'suppressed';
              targetSuppressionActive = true;
            } else {
              targetStatus = 'simulated_smoke';
              targetSuppressionActive = false;
              const eventKey = `${zid}-smoke`;
              if (!loggedSpreadKeysRef.current.has(eventKey)) {
                loggedSpreadKeysRef.current.add(eventKey);
                addEventLog(
                  'SIMULATED_SPREAD',
                  `Hypothetical corridor smoke penetrated ${z.name} (${z.cameraId}) at T+${simState.timeStepMinutes}m.`,
                  'warning',
                  zid,
                  z.name
                );
              }
            }
          } else {
            // Room is untouched by spread at this timestamp
            targetStatus = baselineStatus;
            targetSuppressionActive = false;
          }
        }

        if (z.status !== targetStatus || z.suppressionActive !== targetSuppressionActive) {
          changed = true;
          next[zid] = {
            ...z,
            status: targetStatus,
            suppressionActive: targetSuppressionActive,
          };
        }
      });

      return changed ? next : prev;
    });
  }, [simState.timeStepMinutes, simState.waterSprinklerActive, simState.co2FloodActive, setZonesState, addEventLog]);

  // Handle Loading Pre-Packaged Sample Image into a Camera
  const handleLoadSample = async (zoneId: ZoneId) => {
    setErrorMessage(null);
    const zone = zonesState[zoneId];
    try {
      const response = await fetch(zone.samplePath);
      const blob = await response.blob();
      const file = new File([blob], `${zone.cameraId}_sample.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);

      setZonesState(prev => ({
        ...prev,
        [zoneId]: {
          ...prev[zoneId],
          imageFile: file,
          imagePreviewUrl: previewUrl,
        }
      }));
    } catch (err: any) {
      setErrorMessage(`Failed to load sample image for ${zone.name}: ${err.message}`);
    }
  };

  // Handle User File Upload
  const handleFileUpload = (zoneId: ZoneId, file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (.jpg, .png, .webp).');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setZonesState(prev => ({
      ...prev,
      [zoneId]: {
        ...prev[zoneId],
        imageFile: file,
        imagePreviewUrl: previewUrl,
      }
    }));
  };

  // Run Real YOLO11s Detection on a Zone's Camera Image
  const handleRunInference = async (zoneId: ZoneId) => {
    const currentZone = zonesState[zoneId];
    let fileToTest = currentZone.imageFile;
    let previewUrl = currentZone.imagePreviewUrl;

    if (!fileToTest) {
      try {
        const response = await fetch(currentZone.samplePath);
        const blob = await response.blob();
        fileToTest = new File([blob], `${currentZone.cameraId}_sample.jpg`, { type: 'image/jpeg' });
        previewUrl = URL.createObjectURL(blob);
      } catch (err: any) {
        setErrorMessage(`Could not prepare image file: ${err.message}`);
        return;
      }
    }

    setAnalyzingZoneId(zoneId);
    setErrorMessage(null);

    try {
      const result = await apiService.detect(fileToTest, {
        confidence: settings.confidenceThreshold || 0.25,
        iou: settings.iouThreshold || 0.45,
      });

      applyDetectionToZone(zoneId, result, fileToTest, previewUrl);
    } catch (err: any) {
      setErrorMessage(`YOLO11s Inference failed on ${currentZone.cameraId}: ${err.message}`);
      addEventLog('SYSTEM', `YOLO11s inference failed on ${currentZone.cameraId}: ${err.message}`, 'danger', zoneId, currentZone.name);
    } finally {
      setAnalyzingZoneId(null);
    }
  };

  // Toggle Water Sprinklers (Simulation Only)
  const handleToggleWaterSprinklers = () => {
    setSimState(prev => {
      const nextActive = !prev.waterSprinklerActive;
      if (nextActive) {
        addEventLog('SIMULATED_SUPPRESSION', 'Automatic Water Sprinkler Network activated across Zones 1–5. Cooling and flame knockdown initiated in active fire/smoke zones.', 'success');
      } else {
        addEventLog('SIMULATED_SUPPRESSION', 'Water Sprinkler Network shut down. Systems returned to ARMED baseline.', 'info');
      }
      return { ...prev, waterSprinklerActive: nextActive };
    });
  };

  // Toggle CO2 Gas Flood (Simulation Only)
  const handleToggleCO2Flood = () => {
    setSimState(prev => {
      const nextActive = !prev.co2FloodActive;
      if (nextActive) {
        addEventLog('SIMULATED_SUPPRESSION', 'CO₂ Total Flooding System discharged in Zone 6 (Electrical Room). Oxygen depletion containment initiated.', 'success', 'zone-6', 'Electrical Room');
      } else {
        addEventLog('SIMULATED_SUPPRESSION', 'CO₂ Gas Discharged cleared. Zone 6 returned to ARMED baseline.', 'info', 'zone-6', 'Electrical Room');
      }
      return { ...prev, co2FloodActive: nextActive };
    });
  };

  // Advance Simulation by +1 minute
  const handleAdvanceOneStep = () => {
    if (!hasActiveFireDetection) {
      setErrorMessage('Cannot advance simulation: No active fire outbreak detected by YOLO11s. Run detection on CAM-02 or CAM-06 first to establish a genuine outbreak origin.');
      return;
    }
    setErrorMessage(null);
    setSimState(prev => {
      const nextTime = Math.min(45, prev.timeStepMinutes + 1);
      return { ...prev, isRunning: false, timeStepMinutes: nextTime };
    });
  };

  // Toggle Simulation Play/Pause with verification check
  const handleToggleSimulation = () => {
    if (!hasActiveFireDetection && !simState.isRunning) {
      setErrorMessage('Cannot start fire spread simulation: No active fire outbreak detected by YOLO11s. Run detection on CAM-02 or CAM-06 first to establish a genuine outbreak origin.');
      return;
    }
    setErrorMessage(null);
    setSimState(prev => {
      const nextRunning = !prev.isRunning;
      if (nextRunning) {
        addEventLog('SYSTEM', `Discrete corridor spread simulation started at T+${prev.timeStepMinutes}m (${prev.speedMultiplier}x speed).`, 'info');
      } else {
        addEventLog('SYSTEM', `Discrete corridor spread simulation paused at T+${prev.timeStepMinutes}m.`, 'info');
      }
      return { ...prev, isRunning: nextRunning };
    });
  };

  // Set Simulation Speed Multiplier
  const handleSetSpeed = (multiplier: number) => {
    setSimState(prev => ({ ...prev, speedMultiplier: multiplier }));
    addEventLog('SYSTEM', `Simulation speed set to ${multiplier}x.`, 'info');
  };

  const selectedZone = selectedZoneId ? zonesState[selectedZoneId] : null;
  const inspectingZone = inspectingZoneId ? zonesState[inspectingZoneId] : null;

  const filteredLogs = eventLogs.filter(log => {
    if (logFilter === 'ALL') return true;
    return log.category === logFilter;
  });

  return (
    <div className="space-y-6">
      {/* View Header Banner */}
      <div className="rounded-2xl bg-panel-card border border-panel-border p-5 lg:p-6 shadow-command-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/40 text-orange-300">
              BUILDING DIGITAL TWIN
            </span>
            <span className="text-xs font-mono text-slate-400">
              Ground-Floor Six-Zone Topology & Corridor Network
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
            Ground-Floor Digital Twin & Zone Spread Analysis
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl font-sans">
            Interactive structural layout with dedicated cameras (<strong className="text-cyan-400">CAM-01 to CAM-06</strong>). Upload real optical frames, execute live YOLO11s inference, and model hypothetical corridor smoke/fire propagation.
          </p>
        </div>

        {/* Global Simulation Indicators */}
        <div className="bg-[#090e18] p-3 rounded-xl border border-panel-border flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Simulated Elapsed Time</div>
            <div className="text-lg font-bold font-mono text-orange-400">
              T + {simState.timeStepMinutes} <span className="text-xs text-slate-400">min</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSimulation}
              className={`p-2.5 rounded-xl border transition-all ${
                simState.isRunning 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              }`}
              title={simState.isRunning ? 'Pause Spread Simulation' : 'Start Spread Simulation'}
            >
              {simState.isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={handleAdvanceOneStep}
              className="p-2.5 rounded-xl bg-panel-dark border border-panel-border hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
              title="Advance Simulation +1 Minute"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetSimulation}
              className="p-2.5 rounded-xl bg-panel-dark border border-panel-border hover:border-slate-600 text-slate-400 hover:text-white transition-colors"
              title="Reset Simulation to T+0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert Notice */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-xs font-mono text-red-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Floor Plan & Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Interactive Ground-Floor Architectural Plan */}
        <div className="lg:col-span-8 space-y-4">
          {/* View Mode Switcher Header */}
          <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-panel-card border border-panel-border shadow-command-card">
            <div className="flex items-center gap-2 px-3 text-xs font-mono font-bold text-white">
              <Building2 className="w-4 h-4 text-orange-400" />
              <span>ARCHITECTURAL DIGITAL TWIN: GROUND FLOOR</span>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#090e18] border border-panel-border text-xs font-mono">
              <button
                onClick={() => setDigitalTwinViewMode('3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  digitalTwinViewMode === '3d'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-glow-fire'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <BoxIcon className="w-3.5 h-3.5" />
                <span>3D Cutaway</span>
              </button>
              <button
                onClick={() => setDigitalTwinViewMode('2d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  digitalTwinViewMode === '2d'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-glow-fire'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2D Blueprint</span>
              </button>
            </div>
          </div>

          {digitalTwinViewMode === '3d' ? (
            <BuildingDigitalTwin3D
              zonesState={zonesState}
              selectedZoneId={selectedZoneId}
              onSelectZone={(zid) => setSelectedZoneId(zid)}
              onInspectZone={(zid) => {
                setSelectedZoneId(zid);
                setInspectingZoneId(zid);
              }}
              onInspectCameraInLab={(camId, zid) => {
                updateActiveDetectionSession({
                  targetCameraId: camId,
                  targetZoneId: zid,
                });
                setCurrentView('ai-detection-lab');
              }}
              simState={simState}
            />
          ) : (
            <div className="rounded-2xl bg-panel-card border border-panel-border overflow-hidden shadow-command-card flex flex-col">
              {/* Floor Plan Header */}
              <div className="px-5 py-3 border-b border-panel-border flex flex-wrap items-center justify-between gap-2 bg-[#090e18]">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span>2D BLUEPRINT VIEW: GROUND FLOOR (SIX ZONES)</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                  <span>Click any zone to inspect live camera & telemetry</span>
                </div>
              </div>

            {/* Architectural Visual Container */}
            <div className="relative w-full aspect-[1024/498] bg-[#090d16] overflow-hidden select-none">
              {/* Floor Plan Reference Imagery */}
              <img
                src="/assets/digital_twin/floorplan_reference.jpg"
                alt="Floor Plan Reference"
                className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none"
              />

              {/* Dynamic Interactive SVG Overlay */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1024 498"
                preserveAspectRatio="none"
              >
                {/* Sprinkler Blue Water Pipelines (Water Pump -> Zones 1..5) */}
                <path
                  d="M 690 145 L 670 145 L 670 248 L 205 248 M 389 248 L 389 160 M 563 248 L 563 160 M 205 248 L 205 160 M 205 248 L 205 340 M 389 248 L 389 340 M 563 248 L 563 340"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={simState.waterSprinklerActive ? 'animate-pulse' : ''}
                />

                {/* CO2 Red Pipeline (CO2 Cylinders -> Zone 6 Electrical Room) */}
                <path
                  d="M 700 375 L 650 375 L 650 300 L 565 300"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={simState.co2FloodActive ? 'animate-pulse' : ''}
                />

                {/* ESP32 Dashed Green Control Lines */}
                <path
                  d="M 685 220 L 660 220 L 660 270 M 685 240 L 665 240"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Interactive Zone Overlays */}
              {DIGITAL_TWIN_ZONES_GEOMETRY.map((geom) => {
                const zState = zonesState[geom.id];
                const isSelected = selectedZoneId === geom.id;

                // Color configuration according to active state
                let stateClass = 'border-2 ' + geom.borderColor;
                let bgOverlay = geom.bgTint;
                let statusLabel = 'UNTESTED';
                let badgeClass = 'bg-slate-900/90 text-slate-300 border-slate-700';

                if (zState.status === 'detected_fire') {
                  stateClass = 'border-2 border-red-500 shadow-glow-fire animate-pulse';
                  bgOverlay = 'rgba(239, 68, 68, 0.35)';
                  statusLabel = 'DETECTED FIRE';
                  badgeClass = 'bg-red-950/90 text-red-300 border-red-500 font-bold';
                } else if (zState.status === 'detected_smoke') {
                  stateClass = 'border-2 border-cyan-400 shadow-glow-cyan animate-pulse';
                  bgOverlay = 'rgba(6, 182, 212, 0.3)';
                  statusLabel = 'DETECTED SMOKE';
                  badgeClass = 'bg-cyan-950/90 text-cyan-300 border-cyan-400';
                } else if (zState.status === 'simulated_fire') {
                  stateClass = 'border-2 border-dashed border-amber-500 animate-pulse';
                  bgOverlay = 'rgba(245, 158, 11, 0.35)';
                  statusLabel = 'SIMULATED SPREAD';
                  badgeClass = 'bg-amber-950/90 text-amber-300 border-amber-500 font-bold';
                } else if (zState.status === 'simulated_smoke') {
                  stateClass = 'border-2 border-dashed border-cyan-500';
                  bgOverlay = 'rgba(6, 182, 212, 0.2)';
                  statusLabel = 'SIMULATED SMOKE';
                  badgeClass = 'bg-cyan-950/80 text-cyan-300 border-cyan-500';
                } else if (zState.status === 'suppressed') {
                  stateClass = 'border-2 border-emerald-400';
                  bgOverlay = 'rgba(16, 185, 129, 0.25)';
                  statusLabel = 'SUPPRESSED';
                  badgeClass = 'bg-emerald-950/90 text-emerald-300 border-emerald-400 font-bold';
                } else if (zState.status === 'normal') {
                  stateClass = 'border-2 border-emerald-500/70';
                  bgOverlay = 'rgba(16, 185, 129, 0.1)';
                  statusLabel = 'NORMAL';
                  badgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-500';
                }

                return (
                  <div
                    key={geom.id}
                    onClick={() => {
                      setSelectedZoneId(geom.id);
                      setInspectingZoneId(geom.id);
                    }}
                    className={`absolute cursor-pointer transition-all duration-300 rounded-lg flex flex-col justify-between p-2 ${stateClass} ${
                      isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-[1.01]'
                    }`}
                    style={{
                      left: `${geom.xPct}%`,
                      top: `${geom.yPct}%`,
                      width: `${geom.widthPct}%`,
                      height: `${geom.heightPct}%`,
                      backgroundColor: bgOverlay,
                    }}
                  >
                    {/* Top zone info row */}
                    <div className="flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: geom.accentColor }} 
                        />
                        <span className="text-[11px] font-mono font-bold text-white drop-shadow">
                          {geom.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-slate-300 border border-slate-700">
                        {geom.cameraId}
                      </span>
                    </div>

                    {/* Active State Center Animation */}
                    <div className="flex items-center justify-center pointer-events-none my-auto">
                      {zState.status === 'detected_fire' && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-600/90 text-white font-mono text-[10px] font-bold shadow-lg animate-bounce">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>ACTIVE FIRE</span>
                        </div>
                      )}
                      {zState.status === 'simulated_fire' && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-600/90 text-white font-mono text-[10px] font-bold shadow-lg">
                          <Flame className="w-3.5 h-3.5" />
                          <span>SIMULATED</span>
                        </div>
                      )}
                      {zState.status === 'suppressed' && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600/90 text-white font-mono text-[10px] font-bold shadow-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>EXTINGUISHED</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Status Badge */}
                    <div className="flex items-center justify-between text-[9px] font-mono pointer-events-none">
                      <span className={`px-1.5 py-0.5 rounded border ${badgeClass}`}>
                        {statusLabel}
                      </span>
                      {zState.detectionResult && (
                        <span className="text-slate-300 font-bold bg-black/60 px-1 rounded">
                          {(zState.detectionResult.highestConfidence * 100).toFixed(0)}% conf
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Water Sprinkler Heads overlay markers */}
              {DIGITAL_TWIN_ZONES_GEOMETRY.filter(g => g.suppressionType === 'water').map(g => (
                <div
                  key={`spk-${g.id}`}
                  className={`absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-sky-400 bg-sky-950 flex items-center justify-center text-sky-400 ${
                    simState.waterSprinklerActive ? 'animate-ping' : ''
                  }`}
                  style={{ left: `${g.sprinklerX}%`, top: `${g.sprinklerY}%` }}
                  title="Automatic Water Sprinkler Head"
                >
                  <Droplets className="w-2.5 h-2.5" />
                </div>
              ))}

              {/* CO2 Discharge Nozzle (Zone 6) */}
              <div
                className={`absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-red-500 bg-red-950 flex items-center justify-center text-red-400 ${
                  simState.co2FloodActive ? 'animate-ping' : ''
                }`}
                style={{ left: '55%', top: '45%' }}
                title="CO2 Gas Nozzle (Electrical Fire Class C)"
              >
                <Wind className="w-2.5 h-2.5" />
              </div>
            </div>

            {/* Floor Plan Footer Bar */}
            <div className="px-5 py-2.5 bg-[#080c14] border-t border-panel-border flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>3 Emergency Exits: West (Stairs), North, South</span>
                </span>
                <span>•</span>
                <span className="text-slate-300">Central Corridors Link All 6 Zones</span>
              </div>
              <div className="text-slate-400">
                Ground Floor Topology • FireTwin YOLO11s Inference Node
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Right Column (4 cols): Zone Status, Legend, and Simulation / Suppression Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Zone Status Panel */}
          <div className="rounded-2xl bg-panel-card border border-panel-border p-4 shadow-command-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-panel-border">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Zone Telemetry Matrix
              </span>
              <span className="text-[10px] font-mono text-slate-400">Ground Floor</span>
            </div>

            <div className="space-y-1.5">
              {DIGITAL_TWIN_ZONES_GEOMETRY.map((geom) => {
                const zState = zonesState[geom.id];
                return (
                  <div
                    key={geom.id}
                    onClick={() => {
                      setSelectedZoneId(geom.id);
                      setInspectingZoneId(geom.id);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedZoneId === geom.id 
                        ? 'bg-slate-800/80 border-slate-500' 
                        : 'bg-[#090e18] border-panel-border hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: geom.accentColor }} 
                      />
                      <div>
                        <div className="text-xs font-mono font-bold text-white">{geom.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{geom.cameraId}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {zState.status === 'untested' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                          UNTESTED
                        </span>
                      )}
                      {zState.status === 'normal' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                          NORMAL
                        </span>
                      )}
                      {zState.status === 'detected_fire' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-500 font-bold animate-pulse">
                          FIRE DETECTED
                        </span>
                      )}
                      {zState.status === 'detected_smoke' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-400">
                          SMOKE DETECTED
                        </span>
                      )}
                      {zState.status === 'simulated_fire' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-500">
                          SIMULATED
                        </span>
                      )}
                      {zState.status === 'suppressed' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500">
                          SUPPRESSED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulation & Suppression Controls Panel */}
          <div className="rounded-2xl bg-panel-card border border-panel-border p-4 shadow-command-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-panel-border">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-orange-400" />
                Fire Spread Simulation
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSetSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      simState.speedMultiplier === spd
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title={`Run at ${spd}x speed`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Guidance banner when starting simulation without active fire detection */}
            {!hasActiveFireDetection && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-[11px] font-mono text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>No Active Fire Outbreak Detected</span>
                </div>
                <p className="text-[10px] text-amber-200/90 leading-relaxed font-sans">
                  The corridor fire spread simulation models discrete thermal propagation from verified detection sources only. Run detection on <strong className="text-white">CAM-02 (Office)</strong> or <strong className="text-white">CAM-06 (Electrical Room)</strong> below to establish an outbreak origin.
                </p>
              </div>
            )}

            {/* Quick Action Controls: Play/Pause, Step +1m, Reset */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleToggleSimulation}
                className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                  simState.isRunning 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-glow-fire' 
                    : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                }`}
              >
                {simState.isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{simState.isRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={handleAdvanceOneStep}
                className="py-2 px-2.5 rounded-xl bg-panel-dark border border-panel-border hover:border-slate-600 text-xs font-mono font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all"
                title="Advance simulation by 1 minute"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Step +1m</span>
              </button>

              <button
                onClick={handleResetSimulation}
                className="py-2 px-2.5 rounded-xl bg-panel-dark border border-panel-border hover:border-slate-600 text-xs font-mono font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                title="Reset simulation to T+0m baseline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Time Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-slate-400">Simulation Time Step:</span>
                <span className="text-orange-400 font-bold">T + {simState.timeStepMinutes} min</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="1"
                value={simState.timeStepMinutes}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!hasActiveFireDetection && val > 0) {
                    setErrorMessage('Cannot advance timeline: No verified fire outbreak detected by YOLO11s. Run detection on a camera feed first.');
                    return;
                  }
                  setErrorMessage(null);
                  setSimState(s => ({ ...s, timeStepMinutes: val }));
                }}
                className={`w-full accent-orange-500 bg-slate-800 rounded-lg h-2 ${!hasActiveFireDetection ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>T+0m (Baseline)</span>
                <span>T+20m (Flashover)</span>
                <span>T+45m</span>
              </div>
            </div>

            {/* Suppression Simulation Controls (Water & CO2) */}
            <div className="pt-2 border-t border-panel-border space-y-2">
              <div className="text-[11px] font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>Suppression Systems (Simulation Only)</span>
                <span className="text-[9px] text-amber-400 font-normal">No physical activation</span>
              </div>

              {/* Water Sprinkler Button */}
              <button
                onClick={handleToggleWaterSprinklers}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-all ${
                  simState.waterSprinklerActive
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-glow-cyan'
                    : 'bg-panel-dark border-panel-border hover:border-sky-500/50 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-400" />
                  <span>Water Sprinklers (Zones 1–5)</span>
                </div>
                <span className="text-[10px] uppercase font-bold">
                  {simState.waterSprinklerActive ? 'DISCHARGING' : 'ARMED'}
                </span>
              </button>

              {/* CO2 Gas Flood Button */}
              <button
                onClick={handleToggleCO2Flood}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-all ${
                  simState.co2FloodActive
                    ? 'bg-red-500/20 border-red-400 text-red-300 shadow-glow-fire'
                    : 'bg-panel-dark border-panel-border hover:border-red-500/50 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-red-400" />
                  <span>CO₂ Gas Flooding (Zone 6)</span>
                </div>
                <span className="text-[10px] uppercase font-bold">
                  {simState.co2FloodActive ? 'DISCHARGING' : 'ARMED'}
                </span>
              </button>
            </div>

            {/* Simulation Advisory Notice Banner */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 text-[10px] font-mono text-slate-400 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Simulation Assumptions:</span>
              </div>
              <p>
                Hypothetical discrete propagation across corridor doorways. Source zone is marked <strong>DETECTED</strong> only when confirmed by backend YOLO11s inference. Neighboring zones are strictly labeled <strong>SIMULATED</strong>.
              </p>
            </div>
          </div>

          {/* Incident & Simulation Event Log Panel */}
          <div className="rounded-2xl bg-panel-card border border-panel-border p-4 shadow-command-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-panel-border">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-orange-400" />
                <span>Incident & Simulation Event Log</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                  {filteredLogs.length}
                </span>
              </span>
              <button
                onClick={handleClearEventLogs}
                className="text-slate-500 hover:text-slate-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
                title="Clear Log"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 text-[10px] font-mono flex-wrap">
              {(['ALL', 'MODEL_DETECTION', 'SIMULATED_SPREAD', 'SIMULATED_SUPPRESSION'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setLogFilter(tab)}
                  className={`px-2 py-0.5 rounded transition-all ${
                    logFilter === tab 
                      ? 'bg-slate-700 text-white font-bold' 
                      : 'text-slate-400 hover:text-white bg-slate-900/60'
                  }`}
                >
                  {tab === 'ALL' ? 'All' :
                   tab === 'MODEL_DETECTION' ? 'Detections' :
                   tab === 'SIMULATED_SPREAD' ? 'Spread' : 'Suppression'}
                </button>
              ))}
            </div>

            {/* Scrollable Event List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No incident events recorded.
                </div>
              ) : (
                filteredLogs.map(item => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border text-[10px] leading-relaxed transition-all ${
                      item.category === 'MODEL_DETECTION'
                        ? 'bg-red-950/20 border-red-500/30 text-red-200'
                        : item.category === 'SIMULATED_SPREAD'
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : item.category === 'SIMULATED_SUPPRESSION'
                        ? 'bg-sky-950/20 border-sky-400/30 text-sky-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-white/5 mb-1 text-[9px] text-slate-400">
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                          item.category === 'MODEL_DETECTION' ? 'bg-red-500 animate-pulse' :
                          item.category === 'SIMULATED_SPREAD' ? 'bg-amber-400' :
                          item.category === 'SIMULATED_SUPPRESSION' ? 'bg-sky-400' : 'bg-slate-400'
                        }`} />
                        <span>
                          {item.category === 'MODEL_DETECTION' ? '[YOLO11s DETECTION]' :
                           item.category === 'SIMULATED_SPREAD' ? '[SIMULATED SPREAD]' :
                           item.category === 'SIMULATED_SUPPRESSION' ? '[SIMULATED SUPPRESSION]' : '[SYSTEM]'}
                        </span>
                      </span>
                      <span>{item.timestamp} • T+{item.simTimeMin}m</span>
                    </div>
                    <p className="font-sans text-[11px] text-slate-200 leading-snug">
                      {item.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Components Legend matching reference */}
          <div className="p-3.5 rounded-xl bg-[#090e18] border border-panel-border text-xs font-mono space-y-2">
            <div className="text-[11px] font-bold text-white uppercase pb-1 border-b border-slate-800">
              System Components Legend
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-slate-400" />
                <span>Camera (CCTV)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border border-slate-400 bg-slate-800 inline-block" />
                <span>Smoke/Heat Sensor</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>Sprinkler Head</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-sky-500 rounded inline-block" />
                <span>Water Line</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-red-500 rounded inline-block" />
                <span>CO₂ Line</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 border-b border-dashed border-emerald-400 inline-block" />
                <span>ESP32 Control</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: 6 Live Camera Views (Simulated / Generated Images & Real Detection) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-orange-400" />
              Live Camera Feeds & AI Inference Nodes
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Cameras permanently mapped to Zones 1 through 6. Load sample frames or upload an image to run real YOLO11s detection.
            </p>
          </div>

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                (['zone-1', 'zone-2', 'zone-3', 'zone-4', 'zone-5', 'zone-6'] as ZoneId[]).forEach(zid => {
                  handleLoadSample(zid);
                });
              }}
              className="px-3 py-1.5 rounded-lg bg-panel-dark border border-panel-border hover:border-slate-600 text-xs font-mono text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load All Reference Samples</span>
            </button>
          </div>
        </div>

        {/* 6 Responsive Camera Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {DIGITAL_TWIN_ZONES_GEOMETRY.map((geom) => {
            const zState = zonesState[geom.id];
            const isAnalyzing = analyzingZoneId === geom.id;

            return (
              <div
                key={geom.id}
                className={`rounded-2xl bg-panel-card border overflow-hidden flex flex-col justify-between shadow-command-card transition-all ${
                  zState.status === 'detected_fire' 
                    ? 'border-red-500/80 shadow-glow-fire' 
                    : zState.status === 'detected_smoke'
                    ? 'border-cyan-400/80 shadow-glow-cyan'
                    : selectedZoneId === geom.id
                    ? 'border-slate-500 ring-1 ring-white/20'
                    : 'border-panel-border'
                }`}
              >
                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={(el) => { fileInputRefs.current[geom.cameraId] = el; }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(geom.id, e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {/* Card Top Title Bar */}
                <div className="px-3 py-2 bg-[#090e18] border-b border-panel-border flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white truncate">
                    {geom.cameraId} – {geom.name}
                  </span>
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: geom.accentColor }} 
                  />
                </div>

                {/* Camera Image Viewport */}
                <div 
                  className="relative aspect-[16/9] bg-black overflow-hidden flex items-center justify-center cursor-pointer group"
                  onClick={() => {
                    setSelectedZoneId(geom.id);
                    setInspectingZoneId(geom.id);
                  }}
                >
                  {zState.imagePreviewUrl || zState.samplePath ? (
                    <>
                      <img
                        src={zState.imagePreviewUrl || zState.samplePath}
                        alt={`${geom.cameraId} preview`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Normalized YOLO Bounding Boxes Overlay */}
                      {zState.detectionResult && (
                        <div className="absolute inset-0 pointer-events-none">
                          {zState.detectionResult.boxes.map((b) => (
                            <div
                              key={b.id}
                              className={`absolute border-2 ${
                                b.class === 'fire' 
                                  ? 'border-orange-500 bg-orange-500/20' 
                                  : 'border-cyan-400 bg-cyan-500/20'
                              }`}
                              style={{
                                left: `${b.x * 100}%`,
                                top: `${b.y * 100}%`,
                                width: `${b.width * 100}%`,
                                height: `${b.height * 100}%`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-xs font-mono">
                      <span>No image feed loaded</span>
                    </div>
                  )}

                  {/* Hover Inspect Icon */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-mono gap-1">
                    <Eye className="w-4 h-4" />
                    <span>Inspect</span>
                  </div>
                </div>

                {/* Detection Output Status Bar */}
                <div className="p-2.5 space-y-2 bg-[#090e18]/80 text-xs font-mono">
                  {/* Status Banner */}
                  <div>
                    {zState.status === 'untested' && (
                      <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 text-center text-[10px]">
                        UNTESTED / NO INFERENCE
                      </div>
                    )}
                    {zState.status === 'normal' && (
                      <div className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-center text-[10px] font-bold">
                        NO FIRE DETECTED
                      </div>
                    )}
                    {zState.status === 'detected_fire' && (
                      <div className="px-2 py-1 rounded bg-red-950/90 border border-red-500 text-red-300 text-center text-[10px] font-bold animate-pulse">
                        FIRE DETECTED ({(zState.detectionResult?.highestConfidence ? zState.detectionResult.highestConfidence * 100 : 0).toFixed(0)}%)
                      </div>
                    )}
                    {zState.status === 'detected_smoke' && (
                      <div className="px-2 py-1 rounded bg-cyan-950/90 border border-cyan-400 text-cyan-300 text-center text-[10px] font-bold">
                        SMOKE DETECTED
                      </div>
                    )}
                    {zState.status === 'simulated_fire' && (
                      <div className="px-2 py-1 rounded bg-amber-950/90 border border-amber-500 text-amber-300 text-center text-[10px] font-bold">
                        SIMULATED SPREAD
                      </div>
                    )}
                    {zState.status === 'suppressed' && (
                      <div className="px-2 py-1 rounded bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-center text-[10px] font-bold">
                        SUPPRESSED
                      </div>
                    )}
                  </div>

                  {/* Preliminary Severity Score if evaluated */}
                  {zState.preliminarySeverity && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Severity Tier:</span>
                      <span className="font-bold text-white uppercase">
                        {zState.preliminarySeverity.level} ({zState.preliminarySeverity.score}/100)
                      </span>
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={() => fileInputRefs.current[geom.cameraId]?.click()}
                      className="py-1 px-1.5 rounded bg-panel-dark border border-panel-border hover:border-slate-600 text-[10px] text-slate-300 hover:text-white transition-colors truncate"
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => handleLoadSample(geom.id)}
                      className="py-1 px-1.5 rounded bg-panel-dark border border-panel-border hover:border-amber-500/50 text-[10px] text-amber-300 transition-colors truncate"
                    >
                      Sample
                    </button>
                  </div>

                  {/* Run Real YOLO Inference */}
                  <button
                    onClick={() => handleRunInference(geom.id)}
                    disabled={isAnalyzing}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isAnalyzing
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-glow-fire'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-orange-300" />
                        <span>RUNNING YOLO...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>ANALYZE WITH YOLO11s</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Zone Deep Inspection Modal */}
      {inspectingZone && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingZoneId(null)}
          title={`ZONE INSPECTOR: ${inspectingZone.name.toUpperCase()} (${inspectingZone.cameraId})`}
          subtitle={`Hardware ID: ${inspectingZone.zoneId} • Suppression: ${inspectingZone.suppressionType.toUpperCase()}`}
          icon={Video}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs font-mono">
            {/* Viewport Frame with Real Detections */}
            <div className="relative rounded-xl overflow-hidden bg-black max-h-[360px] flex items-center justify-center border border-panel-border">
              <img
                src={inspectingZone.imagePreviewUrl || inspectingZone.samplePath}
                alt={inspectingZone.name}
                className="max-h-[360px] w-full object-contain"
              />

              {/* Bounding Boxes */}
              {inspectingZone.detectionResult && (
                <div className="absolute inset-0 pointer-events-none">
                  {inspectingZone.detectionResult.boxes.map((b) => (
                    <div
                      key={b.id}
                      className={`absolute border-2 ${
                        b.class === 'fire' 
                          ? 'border-orange-500 bg-orange-500/25 shadow-glow-fire' 
                          : 'border-cyan-400 bg-cyan-500/25 shadow-glow-cyan'
                      }`}
                      style={{
                        left: `${b.x * 100}%`,
                        top: `${b.y * 100}%`,
                        width: `${b.width * 100}%`,
                        height: `${b.height * 100}%`,
                      }}
                    >
                      <div className="absolute -top-5 left-0 px-1 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white uppercase">
                        {b.class} {(b.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inference Telemetry Summary */}
            <div className="p-3.5 rounded-xl bg-panel-dark border border-panel-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-white uppercase">
                  {inspectingZone.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Last Tested Timestamp:</span>
                <span className="text-slate-200">
                  {inspectingZone.lastTestedTimestamp || 'Not tested in this session'}
                </span>
              </div>
              {inspectingZone.detectionResult && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Detections:</span>
                    <span className="text-slate-200">
                      {inspectingZone.detectionResult.counts.fire} fire, {inspectingZone.detectionResult.counts.smoke} smoke
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Peak Model Confidence:</span>
                    <span className="text-orange-400 font-bold">
                      {(inspectingZone.detectionResult.highestConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Preliminary Severity Assessment Card if available */}
            {inspectingZone.preliminarySeverity && (
              <div className="p-4 rounded-xl bg-[#090e18] border border-panel-border space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-panel-border">
                  <span className="text-xs font-bold text-white">Preliminary Severity Assessment</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-orange-400 border border-slate-700">
                    Tier: {inspectingZone.preliminarySeverity.level} ({inspectingZone.preliminarySeverity.score}/100)
                  </span>
                </div>

                {/* Evidence Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-panel-dark border border-panel-border">
                    <span className="text-slate-400 block">Fire Coverage:</span>
                    <strong className="text-orange-400 text-xs">
                      {inspectingZone.preliminarySeverity.evidence.fire_coverage_pct}%
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-panel-dark border border-panel-border">
                    <span className="text-slate-400 block">Smoke Coverage:</span>
                    <strong className="text-cyan-400 text-xs">
                      {inspectingZone.preliminarySeverity.evidence.smoke_coverage_pct}%
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-panel-dark border border-panel-border">
                    <span className="text-slate-400 block">Clusters:</span>
                    <strong className="text-white text-xs">
                      {inspectingZone.preliminarySeverity.evidence.fire_cluster_count} fire
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-panel-dark border border-panel-border">
                    <span className="text-slate-400 block">Detector Certainty:</span>
                    <strong className="text-slate-200 text-xs">
                      {(inspectingZone.preliminarySeverity.evidence.peak_detector_confidence * 100).toFixed(0)}%
                    </strong>
                  </div>
                </div>

                {/* Factors */}
                {inspectingZone.preliminarySeverity.evidence.contributing_factors.length > 0 && (
                  <ul className="text-[11px] text-slate-300 space-y-1">
                    {inspectingZone.preliminarySeverity.evidence.contributing_factors.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-orange-400">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Disclaimer */}
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                  {inspectingZone.preliminarySeverity.disclaimer}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => handleRunInference(inspectingZone.zoneId)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-glow-fire transition-all"
              >
                Re-Analyze with YOLO11s
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
