import React from 'react';
import { useApp } from '../../context/AppContext';
import { DIGITAL_TWIN_ZONES_GEOMETRY } from '../../data/digitalTwinData';
import { ZoneId, CameraId } from '../../types';
import { 
  Flame, 
  CloudRain, 
  AlertTriangle, 
  UploadCloud, 
  Video, 
  Eye, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck,
  Server,
  Cpu,
  Activity,
  Layers,
  ArrowRight,
  Info,
  Droplets,
  Wind,
  Settings,
  Building2,
  Compass,
  Trash2,
  ChevronRight
} from 'lucide-react';

export const CommandCenterView: React.FC = () => {
  const { 
    setCurrentView, 
    backendStatus, 
    backendLatency,
    backendInfo,
    activeDetectionSession,
    updateActiveDetectionSession,
    digitalTwinZones,
    simControls,
    detectionHistory,
    clearDetectionHistory,
  } = useApp();

  // Active detection (prefer current lab session detection, fallback to most recent history)
  const activeDetection = activeDetectionSession.detectionResult || (detectionHistory.length > 0 ? detectionHistory[0] : null);
  const activeSeverity = activeDetection?.preliminarySeverity;

  // Origin zone geometry
  const originGeom = simControls.originZoneId 
    ? DIGITAL_TWIN_ZONES_GEOMETRY.find(z => z.id === simControls.originZoneId)
    : null;

  // Count zone statuses across the 6 building rooms
  const zoneEntries = Object.entries(digitalTwinZones);
  const fireDetectedCount = zoneEntries.filter(([_, z]) => z.status === 'detected_fire').length;
  const smokeDetectedCount = zoneEntries.filter(([_, z]) => z.status === 'detected_smoke').length;
  const simulatedSpreadCount = zoneEntries.filter(([_, z]) => z.status === 'simulated_fire' || z.status === 'simulated_smoke').length;
  const nominalCount = zoneEntries.filter(([_, z]) => z.status === 'normal').length;
  const untestedCount = zoneEntries.filter(([_, z]) => z.status === 'untested').length;

  // Quick inspect camera in AI Lab
  const handleInspectCameraInLab = (cameraId: CameraId, zoneId: ZoneId) => {
    updateActiveDetectionSession({
      targetCameraId: cameraId,
      targetZoneId: zoneId,
    });
    setCurrentView('ai-detection-lab');
  };

  return (
    <div className="space-y-6">
      {/* 1. System Status Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1627] via-[#111c33] to-[#0d1627] border border-panel-border p-5 lg:p-6 shadow-command-card">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                FIRETWIN AI COMMAND CENTER
              </span>
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                6-Zone Architectural Digital Twin
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5">
              Ground-Floor AI Fire Defense & Spread Node
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-sans">
              Integrated real-time computer vision detection, rule-based optical severity triage, and 3D architectural cutaway spread simulation for monitored zones CAM-01 through CAM-06.
            </p>
          </div>

          {/* System Health Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Backend FastAPI Status */}
            <div className="px-3 py-2 rounded-xl bg-[#090e18] border border-panel-border flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400 shadow-glow-emerald animate-pulse' : 'bg-red-400'}`} />
              <div className="font-mono text-left">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">FastAPI Backend (8000)</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{backendStatus === 'online' ? 'ONLINE' : 'OFFLINE'}</span>
                  {backendStatus === 'online' && (
                    <span className="text-[10px] text-slate-400">({backendLatency}ms)</span>
                  )}
                </div>
              </div>
            </div>

            {/* YOLO11s Model Status */}
            <div className="px-3 py-2 rounded-xl bg-[#090e18] border border-panel-border flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-orange-400 shrink-0" />
              <div className="font-mono text-left">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Trained ML Model</div>
                <div className="text-xs font-bold text-white">YOLO11s (Dual-Class)</div>
              </div>
            </div>

            {/* EfficientNet Status Badge */}
            <div className="px-3 py-2 rounded-xl bg-[#090e18] border border-panel-border flex items-center gap-2.5">
              <Server className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="font-mono text-left">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">EfficientNet-B0</div>
                <div className="text-[11px] font-bold text-slate-300">Unintegrated (Future)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2 & 3. Fire & Smoke Detection Summary + Incident Severity Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Detection Summary Card */}
        <div className="lg:col-span-6 rounded-2xl bg-panel-card border border-panel-border p-5 lg:p-6 shadow-command-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-panel-border">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  AI Optical Detection Summary
                </h3>
              </div>
              {activeDetection ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
                  GENUINE INFERENCE
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                  NO ACTIVE SESSION
                </span>
              )}
            </div>

            {activeDetection ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-black border border-panel-border shrink-0 relative group">
                    <img 
                      src={activeDetection.mediaUrl} 
                      alt="Active Detection Frame"
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 font-mono text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">File:</span>
                      <span className="text-white font-bold truncate max-w-[180px]">{activeDetection.fileName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Monitored Zone:</span>
                      <span className="text-cyan-300 font-bold">
                        {activeDetectionSession.targetCameraId} ({activeDetectionSession.targetZoneId.toUpperCase()})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Inference Latency:</span>
                      <span className="text-slate-200">{activeDetection.inferenceTimeMs}ms (Local Engine)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Highest Confidence:</span>
                      <span className="text-orange-400 font-bold">
                        {(activeDetection.highestConfidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stat Counters */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#090e18] border border-panel-border text-center font-mono">
                    <div className="text-[10px] text-slate-400 uppercase">Fire BBoxes</div>
                    <div className="text-xl font-bold text-orange-400 mt-0.5">
                      {activeDetection.counts.fire}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#090e18] border border-panel-border text-center font-mono">
                    <div className="text-[10px] text-slate-400 uppercase">Smoke BBoxes</div>
                    <div className="text-xl font-bold text-cyan-400 mt-0.5">
                      {activeDetection.counts.smoke}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#090e18] border border-panel-border text-center font-mono">
                    <div className="text-[10px] text-slate-400 uppercase">Total Detected</div>
                    <div className="text-xl font-bold text-white mt-0.5">
                      {activeDetection.counts.total}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 mb-6 text-center py-6 px-4 rounded-xl border border-dashed border-panel-border font-mono">
                <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-300">No Genuine Detections in Current Session</div>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-sans">
                  Upload a camera frame or test image to CAM-01 through CAM-06 in the AI Detection Lab to trigger real YOLO11s inference.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-panel-border flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              Dual-Class Object Detection Model
            </span>
            <button
              onClick={() => setCurrentView('ai-detection-lab')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-white font-mono text-xs transition-colors border border-orange-500/30"
            >
              <span>Open AI Lab</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Severity Assessment Card */}
        <div className="lg:col-span-6 rounded-2xl bg-panel-card border border-panel-border p-5 lg:p-6 shadow-command-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-panel-border">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  Rule-Based Optical Severity
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                OPTION A ENGINE
              </span>
            </div>

            {activeSeverity ? (
              <div className="mt-4 space-y-4">
                {/* Tier & Score Header */}
                <div className="p-3.5 rounded-xl bg-[#090e18] border border-panel-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Preliminary Severity Tier</span>
                    <div className="text-lg font-bold font-mono text-white mt-0.5 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs uppercase font-extrabold ${
                        activeSeverity.level === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                        activeSeverity.level === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                        activeSeverity.level === 'moderate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        activeSeverity.level === 'low' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {activeSeverity.level}
                      </span>
                      <span className="text-sm text-slate-300 font-normal">({activeSeverity.label})</span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Score</span>
                    <div className="text-2xl font-black text-orange-400">
                      {activeSeverity.score}<span className="text-xs text-slate-500 font-normal">/100</span>
                    </div>
                  </div>
                </div>

                {/* Evidence Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#090e18] border border-panel-border/80">
                    <div className="text-[10px] text-slate-400">Fire Area</div>
                    <div className="text-sm font-bold text-orange-400 mt-0.5">
                      {activeSeverity.evidence.fire_coverage_pct.toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090e18] border border-panel-border/80">
                    <div className="text-[10px] text-slate-400">Smoke Area</div>
                    <div className="text-sm font-bold text-cyan-400 mt-0.5">
                      {activeSeverity.evidence.smoke_coverage_pct.toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090e18] border border-panel-border/80">
                    <div className="text-[10px] text-slate-400">Co-occurrence</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {activeSeverity.evidence.co_occurrence ? 'YES' : 'NO'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090e18] border border-panel-border/80">
                    <div className="text-[10px] text-slate-400">Peak Conf</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {(activeSeverity.evidence.peak_detector_confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Contributing factors */}
                {activeSeverity.evidence.contributing_factors.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#090e18] border border-panel-border/80 font-mono text-[11px] text-slate-300">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Contributing Rule Factors:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      {activeSeverity.evidence.contributing_factors.map((f, i) => (
                        <li key={i}><span className="text-slate-200">{f}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 mb-6 text-center py-6 px-4 rounded-xl border border-dashed border-panel-border font-mono">
                <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-300">Severity Assessment Nominal</div>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-sans">
                  The rule-based proxy calculates bounding box coverage and cluster overlap when YOLO11s detects fire or smoke.
                </p>
              </div>
            )}
          </div>

          {/* Transparent Disclaimer */}
          <div className="pt-3 border-t border-panel-border">
            <p className="text-[10px] font-mono text-slate-400 flex items-start gap-1.5 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Transparent Disclaimer:</strong> Preliminary optical proxy calculated directly from YOLO bounding box coverage. This is a heuristic visual estimate, not a validated physical measurement of real-world heat release or thermal flux.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Building & Camera Overview (Our Actual 6 Cameras) */}
      <div className="rounded-2xl bg-panel-card border border-panel-border p-5 lg:p-6 shadow-command-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-panel-border">
          <div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-orange-400" />
              <h3 className="text-base font-bold font-mono text-white">
                Monitored Building Zones & CCTV Matrix (6 Cameras)
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Permanent 1-to-1 mapping across CAM-01 through CAM-06 and ground-floor cutaway zones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-300">
              Fire: {fireDetectedCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              Smoke: {smokeDetectedCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
              Simulated: {simulatedSpreadCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
              Nominal: {nominalCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
              Untested: {untestedCount}
            </span>
          </div>
        </div>

        {/* 6 Cameras Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {DIGITAL_TWIN_ZONES_GEOMETRY.map((geom) => {
            const state = digitalTwinZones[geom.id];
            const isOrigin = simControls.originZoneId === geom.id;

            // Status badge styling
            let statusBadge = (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                UNTESTED
              </span>
            );

            if (state.status === 'detected_fire') {
              statusBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 border border-red-500 text-red-300 font-bold animate-pulse">
                  🔥 DETECTED FIRE
                </span>
              );
            } else if (state.status === 'detected_smoke') {
              statusBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold">
                  💨 DETECTED SMOKE
                </span>
              );
            } else if (state.status === 'simulated_fire') {
              statusBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300">
                  ⚠️ SIMULATED FIRE
                </span>
              );
            } else if (state.status === 'simulated_smoke') {
              statusBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-yellow-600 text-yellow-300">
                  🌫️ SIMULATED SMOKE
                </span>
              );
            } else if (state.status === 'suppressed') {
              statusBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-400 text-sky-300">
                  💧 SUPPRESSED
                </span>
              );
            } else if (state.status === 'normal') {
              statusBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300">
                  ✓ NOMINAL
                </span>
              );
            }

            return (
              <div 
                key={geom.id}
                className={`rounded-xl bg-[#090e18] border p-4 flex flex-col justify-between transition-all hover:border-slate-600 ${
                  isOrigin ? 'ring-2 ring-red-500 border-red-500/60' : 'border-panel-border'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700">
                        {geom.cameraId}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {geom.name}
                      </span>
                    </div>
                    {statusBadge}
                  </div>

                  <div className="mt-3 text-xs font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Room ID:</span>
                      <span className="text-slate-300">{geom.id.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protection:</span>
                      <span className="text-slate-300 flex items-center gap-1">
                        {geom.suppressionType === 'co2' ? (
                          <>
                            <Wind className="w-3 h-3 text-red-400" />
                            <span>CO₂ Gas Flooding</span>
                          </>
                        ) : (
                          <>
                            <Droplets className="w-3 h-3 text-cyan-400" />
                            <span>Water Sprinkler</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Tested:</span>
                      <span className="text-slate-300">{state.lastTestedTimestamp || 'Never'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-panel-border/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleInspectCameraInLab(geom.cameraId, geom.id)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-panel-dark hover:bg-slate-800 border border-panel-border text-[11px] font-mono text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <UploadCloud className="w-3 h-3 text-orange-400" />
                    <span>Upload & Test</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('fire-spread')}
                    className="py-1.5 px-2.5 rounded-lg bg-panel-dark hover:bg-slate-800 border border-panel-border text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1"
                    title="View in 3D Cutaway"
                  >
                    <Eye className="w-3 h-3" />
                    <span>3D</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Fire Spread & Containment Overview */}
      <div className="rounded-2xl bg-panel-card border border-panel-border p-5 lg:p-6 shadow-command-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-panel-border">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <h3 className="text-base font-bold font-mono text-white">
                Spread Simulation & Automated Containment Status
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Deterministic corridor propagation overlay synchronized with suppression actuators.
            </p>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold">
            SIMULATED APPROXIMATION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* Origin Card */}
          <div className="p-4 rounded-xl bg-[#090e18] border border-panel-border font-mono text-xs space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Outbreak Origin Source</span>
            {originGeom ? (
              <div className="flex items-center gap-2.5 mt-1">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <div>
                  <div className="text-sm font-bold text-white">{originGeom.name} ({originGeom.cameraId})</div>
                  <div className="text-[10px] text-orange-400">Verified via YOLO11s optical fire detection</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-sm italic mt-1">
                No active outbreak origin established
              </div>
            )}
          </div>

          {/* Simulation Timeline Step */}
          <div className="p-4 rounded-xl bg-[#090e18] border border-panel-border font-mono text-xs space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Simulation Timeline Clock</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-cyan-400">
                T+{simControls.timeStepMinutes} min
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {simControls.isRunning ? `Running (${simControls.speedMultiplier}x)` : 'Paused'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Advances thermal & smoke front along door corridors
            </div>
          </div>

          {/* Containment Actuator Controls */}
          <div className="p-4 rounded-xl bg-[#090e18] border border-panel-border font-mono text-xs space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Suppression Actuators</span>
            <div className="space-y-1.5 mt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Water Sprinklers (Zones 1-5):
                </span>
                <span className={`font-bold ${simControls.waterSprinklerActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {simControls.waterSprinklerActive ? 'DISCHARGING' : 'ARMED'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-red-400" /> CO₂ Flooding (Zone 6):
                </span>
                <span className={`font-bold ${simControls.co2FloodActive ? 'text-red-400' : 'text-slate-500'}`}>
                  {simControls.co2FloodActive ? 'DISCHARGING' : 'ARMED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-panel-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <p className="text-[10px] text-slate-400">
            <strong>Note:</strong> Fire spread kinetics and suppression cooling are computational simulation overlays, not physical building hardware controls.
          </p>
          <button
            onClick={() => setCurrentView('fire-spread')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel-dark hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-panel-border shrink-0"
          >
            <span>Interactive 3D Timeline & Controls</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* 6. Recent Detection / Incident History */}
      <div className="rounded-2xl bg-panel-card border border-panel-border overflow-hidden shadow-command-card">
        <div className="px-5 py-4 border-b border-panel-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <h3 className="text-base font-bold font-mono text-white">
              Recent Detection & Inference History Log
            </h3>
            <span className="text-xs font-mono text-slate-400">({detectionHistory.length} recorded)</span>
          </div>

          {detectionHistory.length > 0 && (
            <button
              onClick={clearDetectionHistory}
              className="text-xs font-mono text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {detectionHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0a0f18] text-slate-400 uppercase text-[10px] tracking-wider border-b border-panel-border">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">File / Image</th>
                  <th className="px-4 py-3">Fire BBoxes</th>
                  <th className="px-4 py-3">Smoke BBoxes</th>
                  <th className="px-4 py-3">Peak Conf</th>
                  <th className="px-4 py-3">Severity Tier</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border text-slate-300">
                {detectionHistory.slice(0, 5).map((det) => (
                  <tr key={det.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{new Date(det.timestamp).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                      <img src={det.mediaUrl} alt="Thumbnail" className="w-8 h-8 rounded object-cover bg-black shrink-0" />
                      <span className="truncate max-w-[160px]">{det.fileName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded ${det.counts.fire > 0 ? 'bg-red-500/20 text-red-400 font-bold' : 'text-slate-400'}`}>
                        {det.counts.fire}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded ${det.counts.smoke > 0 ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400'}`}>
                        {det.counts.smoke}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {(det.highestConfidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <span className="uppercase text-[11px] font-bold text-orange-400">
                        {det.preliminarySeverity?.level || 'NOMINAL'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          updateActiveDetectionSession({
                            detectionResult: det,
                            selectedFile: null,
                            filePreviewUrl: det.mediaUrl,
                          });
                          setCurrentView('ai-detection-lab');
                        }}
                        className="px-2.5 py-1 rounded bg-panel-dark hover:bg-orange-500/20 hover:text-orange-400 border border-panel-border text-[11px] text-slate-300 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center font-mono text-slate-400">
            <p className="text-xs">No detections in this session. Upload an image to start.</p>
          </div>
        )}
      </div>

      {/* 7. Quick Actions Dock */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setCurrentView('ai-detection-lab')}
          className="p-4 rounded-xl bg-panel-card hover:bg-[#111c33] border border-panel-border hover:border-orange-500/50 text-left font-mono transition-all group shadow-command-card"
        >
          <UploadCloud className="w-5 h-5 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-white">AI Detection Lab</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Upload image or camera frame</div>
        </button>

        <button
          onClick={() => setCurrentView('fire-spread')}
          className="p-4 rounded-xl bg-panel-card hover:bg-[#111c33] border border-panel-border hover:border-cyan-500/50 text-left font-mono transition-all group shadow-command-card"
        >
          <Building2 className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-white">3D Digital Twin</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cutaway building inspection</div>
        </button>

        <button
          onClick={() => setCurrentView('fire-spread')}
          className="p-4 rounded-xl bg-panel-card hover:bg-[#111c33] border border-panel-border hover:border-amber-500/50 text-left font-mono transition-all group shadow-command-card"
        >
          <Activity className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-white">Spread Simulation</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Corridor propagation & T+t clock</div>
        </button>

        <button
          onClick={() => setCurrentView('settings')}
          className="p-4 rounded-xl bg-panel-card hover:bg-[#111c33] border border-panel-border hover:border-slate-500 text-left font-mono transition-all group shadow-command-card"
        >
          <Settings className="w-5 h-5 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-white">System & Health</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Backend ping & model config</div>
        </button>
      </div>
    </div>
  );
};
