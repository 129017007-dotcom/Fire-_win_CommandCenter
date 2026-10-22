from pathlib import Path
import io
import time

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO

try:
    from severity import evaluate_preliminary_severity
except ImportError:
    from backend.severity import evaluate_preliminary_severity

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "FireTwin_YOLO11s_best.pt"

app = FastAPI(title="FireTwin AI Backend", version="1.0.0")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
model_error = None

# Load model once at startup
try:
    if MODEL_PATH.exists():
        model = YOLO(str(MODEL_PATH))
        print("FireTwin YOLO model loaded successfully:", MODEL_PATH)
        print("Model class map:", model.names)
    else:
        model_error = f"Model file not found at {MODEL_PATH}"
        print("MODEL LOAD ERROR:", model_error)
except Exception as exc:
    model_error = str(exc)
    print("MODEL LOAD ERROR:", model_error)


@app.get("/")
def root():
    return {
        "app": "FireTwin",
        "version": "1.0.0",
        "model_loaded": model is not None,
        "message": "FireTwin AI backend is running"
    }


@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {
        "status": "ok" if model is not None else "model_error",
        "model_loaded": model is not None,
        "model_name": "FireTwin_YOLO11s",
        "model_path": str(MODEL_PATH),
        "class_names": model.names if model is not None else None,
        "device": str(model.device) if model is not None else None,
        "error": model_error,
    }


@app.post("/detect")
@app.post("/api/v1/detect")
async def detect(
    file: UploadFile = File(...),
    confidence: float = Form(0.25),
    iou: float = Form(0.45)
):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Model failed to load: {model_error}",
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Please upload a valid image file (.jpg, .png, .webp).")

    try:
        content = await file.read()
        if len(content) > 25 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image must be 25 MB or smaller.")

        image = Image.open(io.BytesIO(content)).convert("RGB")
        img_w, img_h = image.size

        # Clamp confidence and iou between 0.05 and 0.95
        conf_val = max(0.05, min(0.95, float(confidence)))
        iou_val = max(0.10, min(0.90, float(iou)))

        # Time the inference
        start_time = time.perf_counter()
        results = model.predict(source=image, conf=conf_val, iou=iou_val, verbose=False)
        inference_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        result = results[0]
        detections = []

        for box in result.boxes:
            class_id = int(box.cls.item())
            label = model.names[class_id]
            conf_score = round(float(box.conf.item()), 4)
            raw_coords = [float(v) for v in box.xyxy[0].tolist()]

            # Safely clip box to image boundaries
            x1 = max(0.0, min(float(img_w), raw_coords[0]))
            y1 = max(0.0, min(float(img_h), raw_coords[1]))
            x2 = max(x1, min(float(img_w), raw_coords[2]))
            y2 = max(y1, min(float(img_h), raw_coords[3]))

            w_box = max(0.0, x2 - x1)
            h_box = max(0.0, y2 - y1)

            detections.append({
                "class_id": class_id,
                "label": label,
                "confidence": conf_score,
                "bbox": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
                "normalized_box": {
                    "x": round(x1 / img_w, 4) if img_w > 0 else 0.0,
                    "y": round(y1 / img_h, 4) if img_h > 0 else 0.0,
                    "width": round(w_box / img_w, 4) if img_w > 0 else 0.0,
                    "height": round(h_box / img_h, 4) if img_h > 0 else 0.0,
                },
                "area_pixels": int(w_box * h_box),
            })

        preliminary_severity = evaluate_preliminary_severity(
            detections=detections,
            image_width=img_w,
            image_height=img_h
        )

        return {
            "success": True,
            "filename": file.filename,
            "model": "FireTwin_YOLO11s",
            "inference_time_ms": inference_time_ms,
            "image_width": img_w,
            "image_height": img_h,
            "count": len(detections),
            "detections": detections,
            "preliminary_severity": preliminary_severity,
            "message": (
                f"Model detected {len(detections)} object(s). Preliminary Severity: {preliminary_severity['level'].upper()}."
                if detections else
                "No fire or smoke detections above the confidence threshold."
            ),
        }
    except HTTPException:
        raise
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid or readable image.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference execution failed: {exc}")
