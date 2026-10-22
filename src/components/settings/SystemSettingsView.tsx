import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_API_BASE_URL } from '../../services/api';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Save, 
  Cpu, 
  Copy, 
  Check, 
  Volume2, 
  Tv, 
  Sliders, 
  Radio, 
  Terminal,
  ExternalLink,
  ShieldCheck,
  Code
} from 'lucide-react';

export const SystemSettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    backendStatus, 
    backendLatency, 
    backendError, 
    backendInfo,
    pingBackend,
    triggerAlarmSound 
  } = useApp();

  const [inputUrl, setInputUrl] = useState<string>(settings.apiBaseUrl);
  const [testingPing, setTestingPing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const handleTestConnection = async () => {
    setTestingPing(true);
    await pingBackend(inputUrl);
    setTestingPing(false);
  };

  const handleSaveSettings = () => {
    updateSettings({
      apiBaseUrl: inputUrl,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Complete FastAPI YOLO11s reference snippet
  const pythonFastApiCode = `# =========================================================
# FireTwin YOLO11s FastAPI Backend Service
# Run: pip install fastapi uvicorn ultralytics python-multipart
# Launch: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# =========================================================

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import numpy as np
import cv2
import time

app = FastAPI(title="FireTwin YOLO11s API", version="1.0.0")

# Enable CORS for FireTwin web dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained YOLO11s model (checkpoint)
# Replace with path to your trained best.pt
model = YOLO("yolo11s_fire_smoke.pt")

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "online",
        "model": "YOLO11s-FireSmoke",
        "device": str(model.device),
        "classes": ["fire", "smoke"]
    }

@app.post("/api/v1/detect")
@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    confidence: float = Form(0.45),
    iou: float = Form(0.45)
):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image payload")

    h, w, _ = img.shape
    start_time = time.time()
    
    # Run YOLO11s inference
    results = model.predict(img, conf=confidence, iou=iou, imgsz=640)
    inference_time_ms = round((time.time() - start_time) * 1000, 2)

    detections = []
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            cls_name = model.names[cls_id] # "fire" or "smoke"
            score = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            # Normalized coordinates for dashboard
            detections.append({
                "class_name": cls_name,
                "confidence": score,
                "x": x1 / w,
                "y": y1 / h,
                "width": (x2 - x1) / w,
                "height": (y2 - y1) / h,
                "area": int((x2 - x1) * (y2 - y1))
            })

    return {
        "status": "success",
        "model": "YOLO11s-FireSmoke",
        "inference_time_ms": inference_time_ms,
        "image_dimensions": {"width": w, "height": h},
        "detections": detections
    }
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonFastApiCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-panel-card border border-panel-border p-5 lg:p-6 shadow-command-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              CONFIGURATION & SERVICES
            </span>
            <span className="text-xs font-mono text-slate-400">
              System Settings & Integration Gateway
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
            System Settings & Backend Node
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-sans">
            Manage your FastAPI backend connection endpoint, adjust default YOLO11s detection thresholds, toggle industrial audio klaxons, and inspect the FastAPI server integration code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> Settings Saved!
            </span>
          )}
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-mono text-xs font-bold hover:shadow-glow-fire transition-all"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API Endpoint & Model Config */}
        <div className="lg:col-span-6 space-y-6">
          {/* Backend API Configuration Card */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-4 shadow-command-card">
            <div className="flex items-center justify-between pb-3 border-b border-panel-border">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-orange-400" />
                FastAPI Backend Endpoint
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                backendStatus === 'online'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/60 border border-red-500/40 text-red-300'
              }`}>
                {backendStatus.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">
                FastAPI Server Base URL (API_BASE_URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="flex-1 bg-[#090e18] border border-panel-border rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testingPing}
                  className="px-3 py-2 rounded-xl bg-panel-dark border border-panel-border hover:border-slate-600 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? 'animate-spin text-orange-400' : ''}`} />
                  <span>Test Connection</span>
                </button>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Default: <button onClick={() => setInputUrl(DEFAULT_API_BASE_URL)} className="underline text-slate-400">{DEFAULT_API_BASE_URL}</button>. Persisted in browser localStorage.
              </div>
            </div>

            {/* Live Health Status Box */}
            <div className="p-3.5 rounded-xl bg-[#090e18] border border-panel-border text-xs font-mono space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Live Health Check:</span>
                <span className={`font-bold ${backendStatus === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {backendStatus === 'online' ? `Connected (${backendLatency}ms)` : 'Unreachable'}
                </span>
              </div>
              {backendInfo && (
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <div>Model Node: <strong className="text-white">{backendInfo.model || 'YOLO11s'}</strong></div>
                  <div>Device: <strong className="text-cyan-400">{backendInfo.device || 'CUDA'}</strong></div>
                </div>
              )}
              {backendError && (
                <div className="text-[11px] text-red-300/90 pt-1 border-t border-red-500/20">
                  {backendError}
                </div>
              )}
            </div>
          </div>

          {/* Model Specification Card */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-4 shadow-command-card text-xs font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-panel-border">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                YOLO11s Target Model Profile
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                ACTIVE PROFILE
              </span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Base Architecture:</span>
                <span className="text-white font-bold">Ultralytics YOLO11s</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Target Classes:</span>
                <span className="text-orange-400 font-bold">Class 0: Fire | Class 1: Smoke</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Input Image Matrix:</span>
                <span>640 x 640 px (RGB)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Inference Format:</span>
                <span>PyTorch .pt / ONNX / TensorRT Engine</span>
              </div>
            </div>
          </div>

          {/* UI and Alarm Telemetry Preferences */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-4 shadow-command-card text-xs font-mono">
            <span className="text-xs font-mono font-bold text-white uppercase block pb-3 border-b border-panel-border">
              Telemetry & Command Center Preferences
            </span>

            {/* Sound Alert Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-slate-200 font-bold block">Audio Alarm Tone (Synthetic Klaxon)</span>
                <span className="text-[10px] text-slate-400">Trigger Web Audio acoustic beacon on critical fire trigger</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerAlarmSound}
                  className="px-2 py-1 rounded bg-panel-dark border border-panel-border text-[10px] text-slate-400 hover:text-white"
                >
                  Test Sound
                </button>
                <input
                  type="checkbox"
                  checked={settings.soundAlerts}
                  onChange={(e) => updateSettings({ soundAlerts: e.target.checked })}
                  className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* CRT Scanline Toggle */}
            <div className="flex items-center justify-between py-1 border-t border-slate-800/60 pt-2">
              <div>
                <span className="text-slate-200 font-bold block">CRT Scanline Industrial Overlay</span>
                <span className="text-[10px] text-slate-400">Tactical monitor scanline raster overlay</span>
              </div>
              <input
                type="checkbox"
                checked={settings.scanlineEffect}
                onChange={(e) => updateSettings({ scanlineEffect: e.target.checked })}
                className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: FastAPI YOLO11s Implementation Guide & Code */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl bg-panel-card border border-panel-border overflow-hidden shadow-command-card flex flex-col">
            <div className="px-5 py-3.5 border-b border-panel-border bg-[#0a0f18] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-mono font-bold text-white">
                  FastAPI YOLO11s Backend Integration Script
                </span>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-panel-dark border border-panel-border hover:border-orange-500 text-xs font-mono text-slate-300 hover:text-white transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'COPIED' : 'COPY SCRIPT'}</span>
              </button>
            </div>

            <div className="p-4 bg-black overflow-x-auto max-h-[560px]">
              <pre className="font-mono text-[11px] text-slate-300 leading-relaxed">
                <code>{pythonFastApiCode}</code>
              </pre>
            </div>

            <div className="p-4 bg-[#0a0f18] border-t border-panel-border text-xs font-mono text-slate-400 space-y-1">
              <div className="text-white font-bold">Quick Launch Command:</div>
              <div className="p-2 rounded bg-black border border-slate-800 text-cyan-300 select-all">
                uvicorn main:app --host 0.0.0.0 --port 8000 --reload
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
