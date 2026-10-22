# FireTwin — AI-Powered Predictive Fire Containment System
### Industrial Dark Command-Center Web Dashboard

**FireTwin** is an industrial command-center web dashboard engineered for high-frequency fire and smoke detection, optical/thermal CCTV matrix surveillance, spatial fire spread modeling, and automated containment advisory protocols.

Designed to interface with a **FastAPI** backend powering a trained **Ultralytics YOLO11s** dual-class (Fire & Smoke) computer vision model.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0+ (Tested on Node v24.19.0)
- **npm** / **pnpm** / **yarn**

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🎨 Industrial Design System

- **Command Center Palette**: Deep near-black navy (`#06090f`, `#0a0f18`) with charcoal panels (`#111827`, `#0d131f`) and high-tech telemetry grids.
- **Accent Signals**:
  - **Flame Orange** (`#ff5500`, `#f97316`) for active fire entities and alarms.
  - **Critical Red** (`#ef4444`, `#dc2626`) for severe threat levels.
  - **Telemetry Cyan** (`#06b6d4`, `#38bdf8`) for smoke aerosol plumes, wind vectors, and system telemetry.
  - **Radar Emerald** (`#10b981`) for nominal status and online backend nodes.
- **Tactical Features**:
  - CRT Scanline raster overlay toggle
  - Web Audio synthetic klaxon alert tone generator
  - Real-time UTC Zulu & Local time clocks
  - Responsive multi-screen layout (optimized for laptop command stations and mobile tablets)

---

## 🧭 Dashboard Modules & Architecture

The application provides 7 dedicated operational views accessible via the tactical sidebar:

### 1. Command Center (`/command-center`)
- **System Health & Connectivity**: Real-time ping to the FastAPI YOLO11s server with round-trip latency counter.
- **Executive Metric Cards**: Fire Detections, Smoke Detections, Active Incidents, and Media/Streams Analysed (explicitly tagged `[DEMO DATA]`).
- **Tactical Surveillance CCTV Matrix**: Multi-channel optical and thermal camera feeds (`CAM-01`, `CAM-03`, `CAM-04`, `CAM-11`) with interactive channel switcher and active threat HUD overlays.
- **Immediate Media Triage Dropzone**: Quick dropzone to jump directly into the AI Detection Lab.
- **Dual-Class Detection Activity Chart**: Custom responsive 24-hour time-series telemetry chart comparing Fire vs Smoke events with interactive inspection tooltips.
- **Active Incidents Table**: Live triage feed with direct links to incident dossiers.

### 2. AI Detection Lab (`/ai-detection-lab`)
- **Media Upload Hub**: Drag-and-drop support for optical frames, thermal captures, and video (`.jpg`, `.png`, `.webp`, `.mp4`, `.webm`).
- **Inference Parameter Controls**: Live sliders for Confidence threshold (`conf: 10%–95%`) and NMS IoU overlap threshold (`iou: 20%–80%`).
- **Connection Guard**: **Strictly adheres to safety requirements:** Never fakes a successful detection if the backend is offline. If the FastAPI server is unreachable, an actionable troubleshooting card is displayed with instructions to start the server.
- **Benchmark Demo Samples**: Clear `[DEMO BENCHMARK DATA]` buttons allowing reviewers to test bounding box rendering and classification filters even before starting the backend.
- **Interactive Annotation Viewer**:
  - Bounding box overlays with distinctive Fire (orange solid glow) and Smoke (cyan dashed) styling.
  - Layer toggles: Show/Hide Fire, Show/Hide Smoke, Show Confidence % labels.
  - Coordinate inspector table: Displays normalized `[x, y, w, h]`, class score, and pixel area.

### 3. Incident Management (`/incidents`)
- **Searchable Incident Registry**: Search by Incident ID, Camera Feed, Location, or Keyword.
- **Multi-Factor Filters**: Filter by Event Type (`Fire`, `Smoke`, `Combined`), Severity (`Critical`, `High`, `Moderate`, `Low`), and Operational Status (`Active`, `Investigating`, `Contained`, `Resolved`).
- **View Toggle**: Switch between high-density Table View and visual Card Grid mode.
- **Incident Dossier Modal**: Comprehensive inspection view with high-res optical evidence, sensor readings, peak temperature, spread rate, and SOP action history. Allows exporting JSON dossiers.

### 4. Fire Spread Analysis (`/fire-spread`)
- **Interactive 2D Cellular Propagation Model**: Physics-based canvas visualizer modeling thermal front expansion over time (`t+0m` to `t+60m`).
- **Environmental Parameters**:
  - Wind Velocity slider (`0–80 km/h`)
  - 8-point Wind Direction compass (`N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`)
  - Ambient Temperature (`15°C–50°C`) and Relative Humidity (`10%–90%`)
  - Fuel Classification: Volatile Solvents, Dry Timber Pallets, Warehouse Packaging, or Perimeter Brush.
- **Derived Metrics**: Front advance velocity (`m/min`), projected hazard area (`m²`), and estimated time to boundary breach.
- **Safety Notice**: Prominent banner marking all spread visualizations as unvalidated simulation approximations for planning, not certified forecasts.

### 5. Containment Recommendations (`/containment`)
- **Advisory Response Modules**:
  - Automated HVAC & Smoke Damper Lockdown Protocol
  - Dynamic Egress Corridor Routing (calculates safe routes away from smoke plume)
  - Pre-charge Mist Deluge Curtain (Simulated)
  - Autonomous Thermal Drone Patrol Dispatch (Simulated)
- **Containment Drill Simulator**: Interactive 5-step containment drill walkthrough with live simulation telemetry console and audio klaxon triggers.
- **Safety Notice**: Strict advisory label confirming that all suppression controls are non-physical simulated drills.

### 6. Detection History (`/detection-history`)
- **Audit Log**: Chronological record of real inferences executed during the session (persisted in browser storage).
- **Empty State**: When no real inferences exist, displays a clean, helpful empty state explaining how to run live detections.
- **Benchmark Toggle**: Includes an explicit option to load benchmark records clearly tagged `DEMO`.
- **Export & Purge**: One-click JSON export and history clearing.

### 7. System Settings (`/settings`)
- **Configurable `API_BASE_URL`**: Change target backend URL (default: `http://localhost:8000`) with instant "Test Connection" ping and latency readout.
- **Model Target Profile**: Displays YOLO11s input matrix (640x640), target classes, and inference engine.
- **Telemetry Preferences**: Toggle audio alarm tone and CRT scanline overlay.
- **FastAPI Integration Code**: Complete, copyable Python script for running the real YOLO11s backend.

---

## 🐍 Connecting your YOLO11s FastAPI Backend

A complete reference script is available directly inside the **System Settings** view or can be saved as `main.py`:

```python
# Install prerequisites:
# pip install fastapi uvicorn ultralytics python-multipart

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import numpy as np
import cv2
import time

app = FastAPI(title="FireTwin YOLO11s API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolo11s_fire_smoke.pt")  # Path to your trained weights

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "model": "YOLO11s-FireSmoke",
        "device": str(model.device),
        "classes": ["fire", "smoke"]
    }

@app.post("/api/v1/detect")
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
    start = time.time()
    results = model.predict(img, conf=confidence, iou=iou, imgsz=640)
    inference_time = round((time.time() - start) * 1000, 2)

    detections = []
    for r in results:
        for box in r.boxes:
            cls_name = model.names[int(box.cls[0])]
            detections.append({
                "class_name": cls_name,
                "confidence": float(box.conf[0]),
                "x": float(box.xyxy[0][0]) / w,
                "y": float(box.xyxy[0][1]) / h,
                "width": float(box.xyxy[0][2] - box.xyxy[0][0]) / w,
                "height": float(box.xyxy[0][3] - box.xyxy[0][1]) / h,
                "area": int((box.xyxy[0][2] - box.xyxy[0][0]) * (box.xyxy[0][3] - box.xyxy[0][1]))
            })

    return {
        "status": "success",
        "model": "YOLO11s-FireSmoke",
        "inference_time_ms": inference_time,
        "detections": detections
    }
```

Run the backend server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Once running, FireTwin will automatically detect the server and display `FASTAPI ONLINE` with live latency in the top bar.

---

## 📁 Project Structure

```
c:/Users/byraj/OneDrive/Documents/Physics/Tejas/
├── index.html                   # HTML entry point with dark theme and fonts
├── package.json                 # Dependencies & scripts
├── tailwind.config.js           # Industrial dark command theme tokens
├── postcss.config.js            # PostCSS configuration
├── tsconfig.json                # TypeScript root configuration
├── tsconfig.app.json            # Application TypeScript configuration
├── vite.config.ts               # Vite configuration
└── src/
    ├── main.tsx                 # React entry point
    ├── App.tsx                  # Root dashboard layout & router
    ├── index.css                # Tailwind directives & tactical styles
    ├── types/
    │   └── index.ts             # TypeScript definitions
    ├── services/
    │   └── api.ts               # FastAPI client & benchmark sample generator
    ├── data/
    │   └── demoIncidents.ts     # Demo incidents & historical telemetry
    ├── context/
    │   └── AppContext.tsx       # Global application state & sound generator
    └── components/
        ├── common/
        │   ├── Header.tsx       # Command header, status pills, clock, alarms
        │   ├── Sidebar.tsx      # 7-view navigation bar & model info
        │   ├── StatCard.tsx     # Industrial metric card with DEMO tag
        │   ├── StatusBadge.tsx  # Severity, status, class, and demo badges
        │   └── Modal.tsx        # Tactical modal dialog
        ├── dashboard/
        │   └── CommandCenterView.tsx   # CCTV matrix, summary metrics, charts
        ├── detection/
        │   └── AIDetectionLabView.tsx  # Bounding box visualizer & inference lab
        ├── incidents/
        │   └── IncidentManagementView.tsx # Search, filter, cards, and dossier
        ├── spread/
        │   └── FireSpreadAnalysisView.tsx # 2D physics spread simulation
        ├── containment/
        │   └── ContainmentRecommendationsView.tsx # Advisory checklist & drill simulator
        ├── history/
        │   └── DetectionHistoryView.tsx   # Inference audit logs & empty states
        └── settings/
            └── SystemSettingsView.tsx     # API config & FastAPI guide
```
