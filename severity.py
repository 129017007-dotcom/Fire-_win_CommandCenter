"""
FireTwin Preliminary Severity Evaluation Engine (Stage 1 Rule-Based Advisory)
=============================================================================
This module computes a transparent, physics-informed, rule-based preliminary severity
estimate using spatial and geometric evidence extracted from YOLO11s bounding boxes.

CRITICAL PRINCIPLES:
1. Detection confidence represents model classification certainty, NOT physical fire severity.
   A tiny match flame can have 99% detector confidence but represents LOW severity.
2. Fire severity is estimated using optical spatial proxies:
   - Fire Frame Coverage Ratio (percentage of visual frame occupied by flame bounding boxes)
   - Smoke Frame Coverage Ratio (percentage of visual frame occupied by aerosol plumes)
   - Ignition Cluster Count (single isolated flame vs. multiple dispersed fronts)
   - Dual-Phase Combustion Co-occurrence (simultaneous flame and smoke)
3. Results are explicitly designated as PRELIMINARY ADVISORY ESTIMATES and must not
   be conflated with certified ground-truth or thermodynamic heat-release rate measurements.
"""

from typing import Any, Dict, List, Optional, Tuple

DISCLAIMER_TEXT = (
    "PRELIMINARY RULE-BASED ESTIMATE: Derived from optical 2D bounding-box coverage and plume geometry. "
    "This is an advisory estimation for containment prioritization and does NOT represent certified ground-truth "
    "or thermodynamic heat-release rate."
)

# Configurable rule-based thresholds
DEFAULT_SEVERITY_THRESHOLDS = {
    # CRITICAL tier: Massive flame front (>= 20% frame) OR multi-front breakout (>= 3 clusters and >= 10% flame)
    "critical_fire_coverage_pct": 20.0,
    "critical_cluster_count": 3,
    "critical_cluster_fire_coverage_pct": 10.0,
    
    # HIGH tier: Substantial flame front (>= 8% frame) OR co-occurrence with heavy smoke OR >= 3 clusters
    "high_fire_coverage_pct": 8.0,
    "high_cooccurrence_fire_pct": 4.0,
    "high_cooccurrence_smoke_pct": 15.0,
    "high_cluster_count": 3,
    
    # MODERATE tier: Established flame front (>= 2% frame) OR dense smoke plume (>= 15%) OR >= 2 clusters
    "moderate_fire_coverage_pct": 2.0,
    "moderate_smoke_coverage_pct": 15.0,
    "moderate_cluster_count": 2,
}


def clip_bounding_box(
    bbox: Optional[List[float]],
    img_width: float,
    img_height: float
) -> Tuple[float, float, float, float]:
    """
    Safely clip bounding box coordinates [x1, y1, x2, y2] to stay strictly within
    [0, img_width] and [0, img_height]. Ensures x1 <= x2 and y1 <= y2.
    """
    if not bbox or len(bbox) < 4:
        return 0.0, 0.0, 0.0, 0.0
    
    try:
        x1 = max(0.0, min(img_width, float(bbox[0])))
        y1 = max(0.0, min(img_height, float(bbox[1])))
        x2 = max(x1, min(img_width, float(bbox[2])))
        y2 = max(y1, min(img_height, float(bbox[3])))
        return x1, y1, x2, y2
    except (ValueError, TypeError):
        return 0.0, 0.0, 0.0, 0.0


def evaluate_preliminary_severity(
    detections: Optional[List[Dict[str, Any]]],
    image_width: int,
    image_height: int,
    thresholds: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Computes a transparent rule-based preliminary severity score and classification tier.

    Args:
        detections: List of detection dictionaries (each may contain 'label', 'confidence', 'bbox', 'area_pixels')
        image_width: Width of image in pixels (must be > 0)
        image_height: Height of image in pixels (must be > 0)
        thresholds: Optional override dictionary for classification thresholds

    Returns:
        Dictionary containing:
        - level: 'nominal' | 'low' | 'moderate' | 'high' | 'critical'
        - score: int (0 to 100)
        - label: Formatted human-readable label
        - is_preliminary_estimate: True
        - evidence: Dict with coverage percentages, cluster counts, co-occurrence, peak confidence, factors
        - disclaimer: Clear visual estimate disclaimer string
    """
    # Safe validation of image dimensions
    safe_width = max(1.0, float(image_width if isinstance(image_width, (int, float)) and image_width > 0 else 1.0))
    safe_height = max(1.0, float(image_height if isinstance(image_height, (int, float)) and image_height > 0 else 1.0))
    img_area = safe_width * safe_height

    cfg = dict(DEFAULT_SEVERITY_THRESHOLDS)
    if thresholds and isinstance(thresholds, dict):
        cfg.update(thresholds)

    # Handle empty or invalid detections safely
    if not detections or not isinstance(detections, list):
        return {
            "level": "nominal",
            "score": 0,
            "label": "Preliminary Severity: NOMINAL",
            "is_preliminary_estimate": True,
            "evidence": {
                "fire_coverage_pct": 0.0,
                "smoke_coverage_pct": 0.0,
                "fire_cluster_count": 0,
                "smoke_cluster_count": 0,
                "co_occurrence": False,
                "peak_detector_confidence": 0.0,
                "contributing_factors": [
                    "No optical flame or smoke plume detected above confidence threshold."
                ],
            },
            "disclaimer": DISCLAIMER_TEXT,
        }

    # Separate fire and smoke detections
    fire_boxes: List[Dict[str, Any]] = []
    smoke_boxes: List[Dict[str, Any]] = []

    for d in detections:
        if not isinstance(d, dict):
            continue
        label = str(d.get("label") or "").lower()
        if "fire" in label:
            fire_boxes.append(d)
        elif "smoke" in label:
            smoke_boxes.append(d)

    fire_count = len(fire_boxes)
    smoke_count = len(smoke_boxes)
    co_occurrence = fire_count > 0 and smoke_count > 0

    # Calculate clipped bounding box areas for fire
    fire_pixels = 0.0
    for d in fire_boxes:
        if "bbox" in d and isinstance(d["bbox"], (list, tuple)) and len(d["bbox"]) >= 4:
            x1, y1, x2, y2 = clip_bounding_box(d["bbox"], safe_width, safe_height)
            box_area = (x2 - x1) * (y2 - y1)
        elif "area_pixels" in d and isinstance(d["area_pixels"], (int, float)):
            box_area = max(0.0, min(img_area, float(d["area_pixels"])))
        else:
            box_area = 0.0
        fire_pixels += box_area

    # Calculate clipped bounding box areas for smoke
    smoke_pixels = 0.0
    for d in smoke_boxes:
        if "bbox" in d and isinstance(d["bbox"], (list, tuple)) and len(d["bbox"]) >= 4:
            x1, y1, x2, y2 = clip_bounding_box(d["bbox"], safe_width, safe_height)
            box_area = (x2 - x1) * (y2 - y1)
        elif "area_pixels" in d and isinstance(d["area_pixels"], (int, float)):
            box_area = max(0.0, min(img_area, float(d["area_pixels"])))
        else:
            box_area = 0.0
        smoke_pixels += box_area

    # Safe percentage coverage (capped at 100.0%)
    fire_coverage_pct = round(min(100.0, (fire_pixels / img_area) * 100.0), 2)
    smoke_coverage_pct = round(min(100.0, (smoke_pixels / img_area) * 100.0), 2)

    # Peak detector confidence (strictly reported as classification certainty, not physical severity)
    valid_confs = []
    for d in detections:
        if isinstance(d, dict):
            c = d.get("confidence")
            if isinstance(c, (int, float)):
                valid_confs.append(float(c))
    peak_detector_confidence = round(max(valid_confs), 4) if valid_confs else 0.0

    contributing_factors: List[str] = []

    # Rule-Based Tier Determination
    if fire_count == 0 and smoke_count == 0:
        level = "nominal"
        score = 0
        label = "Preliminary Severity: NOMINAL"
        contributing_factors.append("No active optical flame or smoke plume detected above confidence threshold.")

    elif (
        fire_coverage_pct >= cfg["critical_fire_coverage_pct"]
        or (fire_count >= cfg["critical_cluster_count"] and fire_coverage_pct >= cfg["critical_cluster_fire_coverage_pct"])
    ):
        level = "critical"
        # Score range: 85 - 100
        excess = max(0.0, fire_coverage_pct - cfg["critical_fire_coverage_pct"])
        score = max(85, min(100, int(85 + min(15, excess * 1.5))))
        label = "Preliminary Severity: CRITICAL"
        contributing_factors.append(
            f"Catastrophic flame envelope consuming {fire_coverage_pct}% of visual frame (>={cfg['critical_fire_coverage_pct']}%)."
        )
        if fire_count >= cfg["critical_cluster_count"]:
            contributing_factors.append(
                f"Multiple discrete flame clusters detected ({fire_count}), indicating widespread outbreak."
            )
        if co_occurrence:
            contributing_factors.append(
                f"Heavy co-occurring aerosol plume covering {smoke_coverage_pct}% of frame."
            )

    elif (
        fire_coverage_pct >= cfg["high_fire_coverage_pct"]
        or (co_occurrence and fire_coverage_pct >= cfg["high_cooccurrence_fire_pct"] and smoke_coverage_pct >= cfg["high_cooccurrence_smoke_pct"])
        or fire_count >= cfg["high_cluster_count"]
    ):
        level = "high"
        # Score range: 65 - 84
        excess = max(0.0, fire_coverage_pct - cfg["high_fire_coverage_pct"])
        bonus = 5 if co_occurrence else 0
        score = max(65, min(84, int(65 + min(14, excess * 1.6) + bonus)))
        label = "Preliminary Severity: HIGH"
        if fire_coverage_pct >= cfg["high_fire_coverage_pct"]:
            contributing_factors.append(
                f"Substantial flame perimeter consuming {fire_coverage_pct}% of frame ({cfg['high_fire_coverage_pct']}% - {cfg['critical_fire_coverage_pct']}%)."
            )
        elif co_occurrence:
            contributing_factors.append(
                f"Dual-phase fire and heavy aerosol plume co-occurrence (flame: {fire_coverage_pct}%, smoke: {smoke_coverage_pct}%)."
            )
        if co_occurrence and fire_coverage_pct >= cfg["high_fire_coverage_pct"]:
            contributing_factors.append(
                f"Dual-phase fire and smoke co-occurrence confirmed (smoke coverage: {smoke_coverage_pct}%)."
            )
        if fire_count >= 2:
            contributing_factors.append(
                f"Dispersed combustion front with {fire_count} separate flame clusters."
            )

    elif (
        (cfg["moderate_fire_coverage_pct"] <= fire_coverage_pct < cfg["high_fire_coverage_pct"])
        or smoke_coverage_pct >= cfg["moderate_smoke_coverage_pct"]
        or (fire_count >= cfg["moderate_cluster_count"] and fire_coverage_pct < cfg["high_fire_coverage_pct"])
    ):
        level = "moderate"
        # Score range: 35 - 64
        base = 35 + int((min(cfg["high_fire_coverage_pct"], fire_coverage_pct) / cfg["high_fire_coverage_pct"]) * 20)
        smoke_bonus = 9 if smoke_coverage_pct >= cfg["moderate_smoke_coverage_pct"] else 0
        score = max(35, min(64, base + smoke_bonus))
        label = "Preliminary Severity: MODERATE"
        if fire_coverage_pct >= cfg["moderate_fire_coverage_pct"]:
            contributing_factors.append(
                f"Established flame front covering {fire_coverage_pct}% of frame ({cfg['moderate_fire_coverage_pct']}% - {cfg['high_fire_coverage_pct']}%)."
            )
        if smoke_coverage_pct >= cfg["moderate_smoke_coverage_pct"]:
            contributing_factors.append(
                f"Dense smoke plume obscuring {smoke_coverage_pct}% of frame."
            )
        if fire_count >= cfg["moderate_cluster_count"]:
            contributing_factors.append(
                f"Multiple ignition points ({fire_count}) observed."
            )

    else:
        # LOW tier: localized flame (< 2%) or localized smoke wisp
        level = "low"
        # Score range: 1 - 34
        score = max(1, min(34, int(fire_coverage_pct * 10) + int(smoke_coverage_pct * 0.5) + 5))
        label = "Preliminary Severity: LOW"
        if fire_count > 0:
            contributing_factors.append(
                f"Localized incipient flame covering {fire_coverage_pct}% of frame (< {cfg['moderate_fire_coverage_pct']}%)."
            )
        if smoke_count > 0:
            contributing_factors.append(
                f"Isolated smoke plume covering {smoke_coverage_pct}% of frame."
            )

    return {
        "level": level,
        "score": score,
        "label": label,
        "is_preliminary_estimate": True,
        "evidence": {
            "fire_coverage_pct": fire_coverage_pct,
            "smoke_coverage_pct": smoke_coverage_pct,
            "fire_cluster_count": fire_count,
            "smoke_cluster_count": smoke_count,
            "co_occurrence": co_occurrence,
            "peak_detector_confidence": peak_detector_confidence,
            "contributing_factors": contributing_factors,
        },
        "disclaimer": DISCLAIMER_TEXT,
    }
