import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import type { DetectionResult, ZoneId, CameraId } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { 
  UploadCloud, 
  Play, 
  RefreshCw, 
  Flame, 
  CloudRain, 
  Sliders, 
  Eye, 
  Layers, 
  WifiOff, 
  ExternalLink,
  ChevronRight,
  Cpu,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  Activity,
  Video,
  Trash2,
  Building2
} from 'lucide-react';

export const AIDetectionLabView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    backendStatus, 
    backendLatency,
    backendInfo,
    addDetectionToHistory,
    setCurrentView,
    triggerAlarmSound,
    activeDetectionSession,
    updateActiveDetectionSession,
    clearActiveDetectionSession,
    applyDetectionToZone,
  } = useApp();

  const selectedFile = activeDetectionSession.selectedFile;
  const filePreviewUrl = activeDetectionSession.filePreviewUrl;
  const detectionResult = activeDetectionSession.detectionResult;
  const isLoading = activeDetectionSession.isLoading;
  const detectionError = activeDetectionSession.error;
  const targetZoneId = activeDetectionSession.targetZoneId;
  const targetCameraId = activeDetectionSession.targetCameraId;

  const [fileType, setFileType] = useState<'image' | 'video' | null>('image');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [autoDetectedNotice, setAutoDetectedNotice] = useState<string | null>(null);

  // Inference controls
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(settings.confidenceThreshold || 0.25);
  const [iouThreshold, setIouThreshold] = useState<number>(settings.iouThreshold || 0.45);

  // Overlay toggles
  const [showFireBoxes, setShowFireBoxes] = useState<boolean>(true);
  const [showSmokeBoxes, setShowSmokeBoxes] = useState<boolean>(true);
  const [showConfidenceLabels, setShowConfidenceLabels] = useState<boolean>(true);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      updateActiveDetectionSession({
        error: 'Please upload an image file (.jpg, .png, .webp) for YOLO11s detection.'
      });
      return;
    }

    setFileType('image');
    const url = URL.createObjectURL(file);

    // Auto-detect camera & zone from filename
    const lowerName = file.name.toLowerCase();
    let detectedCamera: CameraId | null = null;
    let detectedZone: ZoneId | null = null;

    if (lowerName.includes('cam01') || lowerName.includes('cam-01') || lowerName.includes('cam_01') || lowerName.includes('classroom') || lowerName.includes('zone1') || lowerName.includes('zone-1') || lowerName.includes('zone_1')) {
      detectedCamera = 'CAM-01';
      detectedZone = 'zone-1';
    } else if (lowerName.includes('cam02') || lowerName.includes('cam-02') || lowerName.includes('cam_02') || lowerName.includes('office') || lowerName.includes('zone2') || lowerName.includes('zone-2') || lowerName.includes('zone_2')) {
      detectedCamera = 'CAM-02';
      detectedZone = 'zone-2';
    } else if (lowerName.includes('cam03') || lowerName.includes('cam-03') || lowerName.includes('cam_03') || lowerName.includes('laboratory') || lowerName.includes('lab') || lowerName.includes('zone3') || lowerName.includes('zone-3') || lowerName.includes('zone_3')) {
      detectedCamera = 'CAM-03';
      detectedZone = 'zone-3';
    } else if (lowerName.includes('cam04') || lowerName.includes('cam-04') || lowerName.includes('cam_04') || lowerName.includes('library') || lowerName.includes('zone4') || lowerName.includes('zone-4') || lowerName.includes('zone_4')) {
      detectedCamera = 'CAM-04';
      detectedZone = 'zone-4';
    } else if (lowerName.includes('cam05') || lowerName.includes('cam-05') || lowerName.includes('cam_05') || lowerName.includes('storage') || lowerName.includes('zone5') || lowerName.includes('zone-5') || lowerName.includes('zone_5')) {
      detectedCamera = 'CAM-05';
      detectedZone = 'zone-5';
    } else if (lowerName.includes('cam06') || lowerName.includes('cam-06') || lowerName.includes('cam_06') || lowerName.includes('electrical') || lowerName.includes('zone6') || lowerName.includes('zone-6') || lowerName.includes('zone_6')) {
      detectedCamera = 'CAM-06';
      detectedZone = 'zone-6';
    }

    if (detectedCamera && detectedZone) {
      setAutoDetectedNotice(`Auto-mapped to ${detectedCamera} (${detectedZone.toUpperCase()}) from filename`);
      updateActiveDetectionSession({
        selectedFile: file,
        filePreviewUrl: url,
        detectionResult: null,
        error: null,
        targetCameraId: detectedCamera,
        targetZoneId: detectedZone,
      });
    } else {
      setAutoDetectedNotice(null);
      updateActiveDetectionSession({
        selectedFile: file,
        filePreviewUrl: url,
        detectionResult: null,
        error: null,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Run Real Detection via FastAPI Backend
  const handleRunDetection = async () => {
    if (!selectedFile) return;

    updateActiveDetectionSession({ isLoading: true, error: null });

    try {
      const result = await apiService.detect(selectedFile, {
        confidence: confidenceThreshold,
        iou: iouThreshold,
      });

      // Update active detection session preserved across tab navigation
      updateActiveDetectionSession({
        detectionResult: result,
        isLoading: false,
        error: null,
      });

      // Map verified detection into the selected Digital Twin Zone
      applyDetectionToZone(targetZoneId, result, selectedFile, filePreviewUrl);
    } catch (err: any) {
      updateActiveDetectionSession({
        isLoading: false,
        error: err.message || 
          'Inference failed. Please check that your FastAPI backend is running and reachable at ' + settings.apiBaseUrl
      });
    }
  };

  // Filter boxes by visibility toggles and confidence threshold
  const visibleBoxes = (detectionResult?.boxes || []).filter(box => {
    if (box.class === 'fire' && !showFireBoxes) return false;
    if (box.class === 'smoke' && !showSmokeBoxes) return false;
    if (box.confidence < confidenceThreshold) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="rounded-2xl bg-panel-card border border-panel-border p-5 lg:p-6 shadow-command-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              YOLO11s INFERENCE NODE
            </span>
            <span className="text-xs font-mono text-slate-400">
              Dual-Class (Fire & Smoke) Object Detection Lab
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
            AI Detection & Computer Vision Lab
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-sans">
            Upload optical frames or thermal images. Transmits directly to your FastAPI backend running <strong className="text-orange-400">FireTwin_YOLO11s_best.pt</strong> for genuine fire and smoke bounding box regression.
          </p>
        </div>

        {/* Live Model Status Card */}
        <div className="bg-[#090e18] p-3 rounded-xl border border-panel-border flex flex-col gap-1.5 shrink-0 min-w-[220px]">
          <div className="flex items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Model:
            </span>
            <span className="font-bold text-white">YOLO11s</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Backend Node:</span>
            <span className={`font-bold ${backendStatus === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
              {backendStatus === 'online' ? `ONLINE (${backendLatency}ms)` : 'OFFLINE'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-800">
            <span className="text-slate-400">Classes:</span>
            <span className="text-slate-300">Smoke (0) & Fire (1)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls (Left 4 cols) + Visual Display & Results (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Inference Parameters */}
        <div className="lg:col-span-5 space-y-5">
          {/* File Upload Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-orange-500 bg-orange-500/10 shadow-glow-fire'
                : 'border-panel-border hover:border-slate-600 bg-panel-card/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <h4 className="text-sm font-bold font-mono text-white">
              {selectedFile ? selectedFile.name : 'Choose or Drag Image'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Supports JPEG, PNG, WEBP (up to 25MB)
            </p>

            {selectedFile && (
              <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#090e18] border border-panel-border text-[11px] font-mono text-slate-300">
                <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                <span>•</span>
                <span className="uppercase text-orange-400">{fileType}</span>
              </div>
            )}
          </div>

          {/* Model Hyperparameters & Thresholds */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-4 shadow-command-card">
            <div className="flex items-center justify-between pb-3 border-b border-panel-border">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-400" />
                Inference Controls
              </span>
              <span className="text-[11px] font-mono text-slate-400">FireTwin_YOLO11s_best.pt</span>
            </div>

            {/* Target Camera / Zone Assignment */}
            <div className="pb-3 border-b border-panel-border space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1.5 font-bold">
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  Target Digital Twin Zone:
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                  {targetCameraId}
                </span>
              </div>
              <select
                value={targetZoneId}
                onChange={(e) => {
                  const zid = e.target.value as ZoneId;
                  const camMap: Record<ZoneId, CameraId> = {
                    'zone-1': 'CAM-01',
                    'zone-2': 'CAM-02',
                    'zone-3': 'CAM-03',
                    'zone-4': 'CAM-04',
                    'zone-5': 'CAM-05',
                    'zone-6': 'CAM-06',
                  };
                  setAutoDetectedNotice(null);
                  updateActiveDetectionSession({
                    targetZoneId: zid,
                    targetCameraId: camMap[zid] || 'CAM-01',
                  });
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#090e18] border border-panel-border text-xs font-mono text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="zone-1">CAM-01 • Zone 1: Classroom (Water Sprinkler)</option>
                <option value="zone-2">CAM-02 • Zone 2: Office (Water Sprinkler)</option>
                <option value="zone-3">CAM-03 • Zone 3: Laboratory (Water Sprinkler)</option>
                <option value="zone-4">CAM-04 • Zone 4: Library (Water Sprinkler)</option>
                <option value="zone-5">CAM-05 • Zone 5: Storage (Water Sprinkler)</option>
                <option value="zone-6">CAM-06 • Zone 6: Electrical Room (CO₂ Gas Nozzle)</option>
              </select>

              {autoDetectedNotice && (
                <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{autoDetectedNotice}</span>
                </div>
              )}

              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Inference maps directly to 3D model room</span>
                <span className="text-orange-400 font-semibold">{targetZoneId.toUpperCase()}</span>
              </div>
            </div>

            {/* Confidence Threshold Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">Confidence Threshold (conf):</span>
                <span className="text-orange-400 font-bold">{(confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.95"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setConfidenceThreshold(val);
                  updateSettings({ confidenceThreshold: val });
                }}
                className="w-full accent-orange-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>10% (High Recall)</span>
                <span>95% (High Precision)</span>
              </div>
            </div>

            {/* IoU / NMS Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">NMS / IoU Overlap Threshold:</span>
                <span className="text-cyan-400 font-bold">{(iouThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={iouThreshold}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setIouThreshold(val);
                  updateSettings({ iouThreshold: val });
                }}
                className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Server Endpoint Status summary */}
            <div className="p-3 rounded-xl bg-[#090e18] border border-panel-border text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Target Backend:</span>
                <span className="text-slate-200 font-mono truncate max-w-[150px]">
                  {settings.apiBaseUrl}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Backend Status:</span>
                <span className={`font-bold ${backendStatus === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {backendStatus === 'online' ? `ONLINE (${backendLatency}ms)` : 'OFFLINE'}
                </span>
              </div>
            </div>

            {/* Run Detection CTA */}
            <button
              onClick={handleRunDetection}
              disabled={isLoading || !selectedFile}
              className={`w-full py-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isLoading || !selectedFile
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-panel-border'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-glow-fire hover:scale-[1.01]'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-300" />
                  <span>RUNNING YOLO11s INFERENCE...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>RUN REAL AI DETECTION</span>
                </>
              )}
            </button>

            {!selectedFile && (
              <p className="text-[11px] font-mono text-center text-slate-500">
                Select an image above to run model inference.
              </p>
            )}
          </div>

          {/* Backend Offline Warning Card (Visible if error occurs or backend is offline) */}
          {detectionError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-xs font-mono text-red-200 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <WifiOff className="w-4 h-4 shrink-0" />
                <span>Detection Service Notice</span>
              </div>
              <p className="text-[11px] text-red-300/90 leading-relaxed font-sans">
                {detectionError}
              </p>
              <div className="pt-2 border-t border-red-500/20 flex items-center justify-between">
                <button
                  onClick={() => setCurrentView('settings')}
                  className="text-xs text-orange-400 hover:text-orange-300 underline flex items-center gap-1"
                >
                  Configure API endpoint & view FastAPI guide <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Visual Media Preview, Interactive Bounding Box Overlays, & Results */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Inspection Viewport */}
          <div className="rounded-2xl bg-panel-card border border-panel-border overflow-hidden shadow-command-card flex flex-col">
            {/* Viewport Toolbar */}
            <div className="px-5 py-3 border-b border-panel-border flex flex-wrap items-center justify-between gap-3 bg-[#0a0f18]/80">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  INSPECTION VIEWPORT
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                  {targetCameraId}
                </span>
                {detectionResult && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                    REAL YOLO11s PREDICTION
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Explicit Clear Lab Session Button */}
                {selectedFile && (
                  <button
                    onClick={clearActiveDetectionSession}
                    className="px-2.5 py-1 rounded-lg bg-panel-dark border border-panel-border hover:border-red-500/50 text-xs font-mono text-slate-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
                    title="Clear uploaded image and reset lab viewport"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}

                {/* Box Layer Filter Toggles */}
                {detectionResult && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <button
                      onClick={() => setShowFireBoxes(!showFireBoxes)}
                      className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-all ${
                        showFireBoxes
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                          : 'bg-panel-dark border-panel-border text-slate-500'
                      }`}
                    >
                      <Flame className="w-3 h-3" />
                      <span>Fire ({detectionResult.counts.fire})</span>
                    </button>

                    <button
                      onClick={() => setShowSmokeBoxes(!showSmokeBoxes)}
                      className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-all ${
                        showSmokeBoxes
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                          : 'bg-panel-dark border-panel-border text-slate-500'
                      }`}
                    >
                      <CloudRain className="w-3 h-3" />
                      <span>Smoke ({detectionResult.counts.smoke})</span>
                    </button>

                    <button
                      onClick={() => setShowConfidenceLabels(!showConfidenceLabels)}
                      className={`px-2 py-1 rounded border text-[11px] transition-all ${
                        showConfidenceLabels
                          ? 'bg-slate-800 border-slate-600 text-slate-200'
                          : 'bg-panel-dark border-panel-border text-slate-500'
                      }`}
                    >
                      Labels
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Image Display Frame with Bounding Boxes */}
            <div 
              ref={mediaContainerRef}
              className="relative min-h-[360px] max-h-[500px] bg-black flex items-center justify-center overflow-hidden p-2"
            >
              {filePreviewUrl ? (
                <div className="relative inline-block max-w-full max-h-[460px]">
                  <img
                    src={filePreviewUrl}
                    alt="Detection Preview"
                    className="max-h-[460px] max-w-full object-contain rounded-lg select-none"
                  />

                  {/* Bounding Box Overlays */}
                  {detectionResult && (
                    <div className="absolute inset-0 pointer-events-none">
                      {visibleBoxes.map((box) => {
                        const isHovered = hoveredBoxId === box.id;
                        const isFire = box.class === 'fire';

                        return (
                          <div
                            key={box.id}
                            className={`absolute transition-all ${
                              isFire
                                ? isHovered
                                  ? 'border-2 border-orange-400 bg-orange-500/30 shadow-glow-fire'
                                  : 'border-2 border-orange-500 bg-orange-500/15'
                                : isHovered
                                ? 'border-2 border-dashed border-cyan-300 bg-cyan-500/30 shadow-glow-cyan'
                                : 'border-2 border-dashed border-cyan-400 bg-cyan-500/15'
                            }`}
                            style={{
                              left: `${box.x * 100}%`,
                              top: `${box.y * 100}%`,
                              width: `${box.width * 100}%`,
                              height: `${box.height * 100}%`,
                            }}
                          >
                            {/* Class Label Badge */}
                            {showConfidenceLabels && (
                              <div
                                className={`absolute -top-6 left-0 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md ${
                                  isFire
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-cyan-600 text-white'
                                }`}
                              >
                                {isFire ? <Flame className="w-2.5 h-2.5" /> : <CloudRain className="w-2.5 h-2.5" />}
                                <span>{box.class.toUpperCase()}</span>
                                <span className="text-white/80">{(box.confidence * 100).toFixed(0)}%</span>
                              </div>
                            )}

                            {box.areaPixels && (
                              <div className="absolute bottom-1 right-1 text-[9px] font-mono text-slate-300 bg-black/70 px-1 rounded">
                                {box.areaPixels.toLocaleString()} px
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-center px-4">
                  <div className="w-16 h-16 rounded-2xl bg-panel-card border border-panel-border flex items-center justify-center text-slate-600 mb-3">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold font-mono text-slate-400">
                    No Media Loaded
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 font-sans">
                    Upload an optical or thermal image from the left panel to test fire and smoke detection.
                  </p>
                </div>
              )}
            </div>

            {/* Metadata Bottom Bar */}
            {detectionResult && (
              <div className="px-5 py-2.5 bg-[#0a0f18] border-t border-panel-border flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center gap-3">
                  <span>Inference: <strong className="text-emerald-400">{detectionResult.inferenceTimeMs}ms</strong></span>
                  <span>•</span>
                  <span>Model: <strong className="text-slate-200">{detectionResult.modelUsed}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Detections: <strong className="text-white">{visibleBoxes.length}</strong></span>
                  <span>•</span>
                  <span>Peak Conf: <strong className="text-orange-400">{(detectionResult.highestConfidence * 100).toFixed(1)}%</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Preliminary Severity Assessment Card (Stage 1 Rule-Based Advisory) */}
          {detectionResult?.preliminarySeverity && (
            <div className="rounded-2xl bg-panel-card border border-panel-border overflow-hidden shadow-command-card">
              {/* Card Header */}
              <div className="px-5 py-3 border-b border-panel-border flex flex-wrap items-center justify-between gap-2 bg-[#0a0f18]/80">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold font-mono text-white">
                    PRELIMINARY FIRE SEVERITY ASSESSMENT
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Rule-Based Optical Proxy
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {(() => {
                    const level = detectionResult.preliminarySeverity.level;
                    const config = {
                      nominal: { bg: 'bg-emerald-950/60', border: 'border-emerald-500/40', text: 'text-emerald-300', dot: 'bg-emerald-400' },
                      low: { bg: 'bg-sky-950/60', border: 'border-sky-500/40', text: 'text-sky-300', dot: 'bg-sky-400' },
                      moderate: { bg: 'bg-amber-950/60', border: 'border-amber-500/40', text: 'text-amber-300', dot: 'bg-amber-400' },
                      high: { bg: 'bg-orange-950/60', border: 'border-orange-500/50', text: 'text-orange-300', dot: 'bg-orange-400' },
                      critical: { bg: 'bg-red-950/80', border: 'border-red-500 shadow-glow-fire', text: 'text-red-300 animate-pulse', dot: 'bg-red-400' }
                    }[level] || { bg: 'bg-slate-900', border: 'border-slate-700', text: 'text-slate-300', dot: 'bg-slate-400' };

                    return (
                      <div className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold flex items-center gap-2 ${config.bg} ${config.border} ${config.text}`}>
                        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                        <span>{level.toUpperCase()}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                {/* Score bar */}
                <div>
                  <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                    <span className="text-slate-400">Preliminary Severity Score:</span>
                    <span className="text-white font-bold font-mono">
                      {detectionResult.preliminarySeverity.score} <span className="text-slate-500">/ 100</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-panel-border">
                    <div
                      className={`h-full transition-all duration-500 ${
                        detectionResult.preliminarySeverity.level === 'critical'
                          ? 'bg-gradient-to-r from-orange-500 to-red-600'
                          : detectionResult.preliminarySeverity.level === 'high'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : detectionResult.preliminarySeverity.level === 'moderate'
                          ? 'bg-gradient-to-r from-cyan-500 to-amber-500'
                          : detectionResult.preliminarySeverity.level === 'low'
                          ? 'bg-sky-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(4, detectionResult.preliminarySeverity.score)}%` }}
                    />
                  </div>
                </div>

                {/* 4-Column Evidence Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#090e18] border border-panel-border">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Fire Frame Coverage</div>
                    <div className="text-base font-bold font-mono text-orange-400 mt-1">
                      {detectionResult.preliminarySeverity.evidence.fire_coverage_pct}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">of 2D pixel area</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#090e18] border border-panel-border">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Smoke Frame Coverage</div>
                    <div className="text-base font-bold font-mono text-cyan-400 mt-1">
                      {detectionResult.preliminarySeverity.evidence.smoke_coverage_pct}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">plume visual area</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#090e18] border border-panel-border">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Ignition Clusters</div>
                    <div className="text-base font-bold font-mono text-white mt-1">
                      {detectionResult.preliminarySeverity.evidence.fire_cluster_count}{' '}
                      <span className="text-xs font-normal text-slate-400">flame</span> /{' '}
                      {detectionResult.preliminarySeverity.evidence.smoke_cluster_count}{' '}
                      <span className="text-xs font-normal text-slate-400">smoke</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {detectionResult.preliminarySeverity.evidence.co_occurrence ? 'Dual-phase active' : 'Single-phase'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#090e18] border border-panel-border">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Detector Certainty</div>
                    <div className="text-base font-bold font-mono text-slate-200 mt-1">
                      {(detectionResult.preliminarySeverity.evidence.peak_detector_confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-[9px] text-amber-400/90 mt-0.5 font-sans leading-tight">
                      YOLO certainty (not severity)
                    </div>
                  </div>
                </div>

                {/* Contributing Factors */}
                {detectionResult.preliminarySeverity.evidence.contributing_factors.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#090e18] border border-panel-border text-xs font-mono">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-orange-400" />
                      <span>Evaluation Factors & Evidence Basis:</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {detectionResult.preliminarySeverity.evidence.contributing_factors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px]">
                          <span className="text-orange-400 select-none">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Transparent Disclaimer Banner */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 text-[11px] font-mono text-slate-400 flex items-start gap-2.5 leading-relaxed">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-200 font-bold">Advisory Notice: </span>
                    {detectionResult.preliminarySeverity.disclaimer}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detections Breakdown Table or Clean Zero-Detection State */}
          {detectionResult && (
            <div className="rounded-2xl bg-panel-card border border-panel-border overflow-hidden shadow-command-card">
              <div className="px-5 py-3 border-b border-panel-border flex items-center justify-between bg-[#0a0f18]/60">
                <span className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  YOLO11s Real Model Detections ({visibleBoxes.length})
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Fire: {detectionResult.counts.fire} | Smoke: {detectionResult.counts.smoke}
                </span>
              </div>

              {visibleBoxes.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-slate-400 space-y-2">
                  <div className="inline-flex p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-slate-300 font-bold">
                    No fire or smoke detected in this frame.
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto font-sans">
                    All class probabilities remained below the active confidence threshold ({(confidenceThreshold * 100).toFixed(0)}%). You can adjust the slider on the left to test lower threshold sensitivities.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#080c14] text-slate-400 text-[10px] uppercase border-b border-panel-border">
                      <tr>
                        <th className="px-4 py-2.5">Box ID</th>
                        <th className="px-4 py-2.5">Classification</th>
                        <th className="px-4 py-2.5">Confidence</th>
                        <th className="px-4 py-2.5">Normalized Geometry [x, y, w, h]</th>
                        <th className="px-4 py-2.5">Area</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-panel-border text-slate-300">
                      {visibleBoxes.map((box) => (
                        <tr
                          key={box.id}
                          onMouseEnter={() => setHoveredBoxId(box.id)}
                          onMouseLeave={() => setHoveredBoxId(null)}
                          className={`transition-colors cursor-pointer ${
                            hoveredBoxId === box.id
                              ? 'bg-orange-500/10'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="px-4 py-2.5 font-bold text-white">{box.id}</td>
                          <td className="px-4 py-2.5">
                            <StatusBadge type="class" value={box.class} />
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-200">
                            {(box.confidence * 100).toFixed(1)}%
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                            [{box.x.toFixed(2)}, {box.y.toFixed(2)}, {box.width.toFixed(2)}, {box.height.toFixed(2)}]
                          </td>
                          <td className="px-4 py-2.5 text-slate-400">
                            {box.areaPixels ? `${box.areaPixels.toLocaleString()} px` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Action bar below table */}
              <div className="p-3 bg-[#0a0f18] border-t border-panel-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] font-mono text-slate-400">
                  Telemetry record mapped to <strong className="text-cyan-300">{targetCameraId} ({targetZoneId})</strong> & logged to Detection History
                </span>
                <button
                  onClick={() => setCurrentView('fire-spread')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500/30 to-red-600/30 hover:from-orange-500/40 hover:to-red-600/40 border border-orange-500/50 text-orange-300 hover:text-white text-xs font-mono font-bold transition-all shadow-glow-fire"
                >
                  <Building2 className="w-4 h-4 text-orange-400" />
                  <span>View in 3D Digital Twin & Simulate Spread</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
