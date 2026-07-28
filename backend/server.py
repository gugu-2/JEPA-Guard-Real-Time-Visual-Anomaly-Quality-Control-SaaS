"""
JEPA-Guard: FastAPI High-Performance PyTorch Backend Server
Pioneered by Yann LeCun & Meta AI.

Provides real-time REST API endpoints for PyTorch JEPA inference, frame analysis,
anomaly heatmap calculation, and SaaS stream management.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import time
import base64
import io
import math
import torch
import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from jepa_model import JepaModel

# Initialize FastAPI App
app = FastAPI(
    title="JEPA-Guard Engine API",
    description="Real-Time Visual Anomaly & Quality Control SaaS Backend powered by PyTorch JEPA",
    version="2.4.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Device selection (CUDA GPU if available, else CPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[JEPA SERVER] Initializing PyTorch model on device: {device}")

# Global PyTorch JEPA Model Instance
model = JepaModel(img_size=224, patch_size=14, embed_dim=512).to(device)
model.eval()

# Global Defect State Injection Store
active_defect = {
    "is_injected": False,
    "defect_type": None,
    "gx": 8,
    "gy": 8,
    "size": 3
}

# Data Models
class FrameAnalysisRequest(BaseModel):
    image_base64: Optional[str] = None
    feed_id: Optional[str] = "feed-1"
    # Default 1.2 suits untrained/random model. After training on real data,
    # calibrate to 0.3-0.6 based on baseline normal-frame energy distribution.
    energy_threshold: float = 1.2
    sensitivity: float = 2.5

class DefectInjectionRequest(BaseModel):
    defect_type: str = "Surface Crack / Defect"
    gx: Optional[int] = 8
    gy: Optional[int] = 8
    size: Optional[int] = 3

class SaaSUpgradeRequest(BaseModel):
    plan_name: str
    monthly_fee: float
    max_streams: int

# REST Endpoints
@app.get("/")
@app.get("/api/status")
def get_system_status():
    return {
        "status": "ONLINE",
        "engine": "Joint Embedding Predictive Architecture (JEPA)",
        "framework": "PyTorch " + torch.__version__,
        "device": str(device),
        "cuda_available": torch.cuda.is_available(),
        "patch_grid": "16x16 (256 tokens)",
        "latent_dimension": 512,
        "active_defect": active_defect["is_injected"],
        "version": "2.4.0-SaaS"
    }

@app.post("/api/analyze")
def analyze_frame(request: FrameAnalysisRequest):
    start_time = time.time()

    # 1. Process image input (if base64 provided or generate tensor)
    if request.image_base64 and len(request.image_base64) > 100:
        try:
            image_bytes = base64.b64decode(request.image_base64.split(",")[-1])
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
            img_np = np.array(img).astype(np.float32) / 255.0
            frame_tensor = torch.from_numpy(img_np).permute(2, 0, 1).unsqueeze(0).to(device)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image payload: {str(e)}")
    else:
        # Generate synthetic input frame
        frame_tensor = torch.randn(1, 3, 224, 224, device=device)

    # 2. PyTorch JEPA Latent Representation Forward Pass
    with torch.no_grad():
        output = model(frame_tensor)
        energy_map = output["energy_map"][0].cpu().numpy().tolist() # 16x16 grid
        max_energy = float(output["max_anomaly_score"][0].cpu().item())
        avg_energy = float(np.mean(energy_map))

    # Apply defect injection if state is active
    if active_defect["is_injected"]:
        gx, gy, sz = active_defect["gx"], active_defect["gy"], active_defect["size"]
        for y in range(16):
            for x in range(16):
                dist = math.hypot(x - gx, y - gy)
                if dist <= sz:
                    spike = 0.55 + (1.0 - dist / (sz + 1)) * 0.35 * (request.sensitivity / 2.0)
                    energy_map[y][x] = min(0.99, energy_map[y][x] + spike)
        max_energy = max(max_energy, float(np.max(energy_map)))

    is_anomaly = max_energy >= request.energy_threshold
    inference_time_ms = round((time.time() - start_time) * 1000, 2)

    # Calculate bounding box coordinates
    bbox = None
    if is_anomaly:
        max_idx = np.unravel_index(np.argmax(energy_map), (16, 16))
        bg_y, bg_x = int(max_idx[0]), int(max_idx[1])
        bbox = {
            "x": round(max(5, (bg_x - 1.5) / 16 * 100), 1),
            "y": round(max(5, (bg_y - 1.5) / 16 * 100), 1),
            "w": 25.0,
            "h": 25.0
        }

    return {
        "success": True,
        "inference_time_ms": inference_time_ms,
        "max_energy_score": round(max_energy, 4),
        "average_energy": round(avg_energy, 4),
        "threshold": request.energy_threshold,
        "is_anomaly": is_anomaly,
        "bounding_box": bbox,
        "energy_map": energy_map, # 16x16 grid
        "defect_type": active_defect["defect_type"] if active_defect["is_injected"] else "JEPA Representation Mismatch"
    }

@app.post("/api/inject-defect")
def inject_defect(req: DefectInjectionRequest):
    active_defect["is_injected"] = True
    active_defect["defect_type"] = req.defect_type
    active_defect["gx"] = req.gx or np.random.randint(4, 12)
    active_defect["gy"] = req.gy or np.random.randint(4, 12)
    active_defect["size"] = req.size or 3
    return {"success": True, "active_defect": active_defect}

@app.post("/api/clear-defect")
def clear_defect():
    active_defect["is_injected"] = False
    active_defect["defect_type"] = None
    return {"success": True, "active_defect": active_defect}

@app.get("/api/feeds")
def list_camera_feeds():
    return [
        {
            "id": "feed-1",
            "name": "Conveyor Line A1 - Metal Sheets",
            "type": "synthetic_conveyor",
            "category": "Industrial Manufacturing",
            "status": "active",
            "resolution": "1080p @ 60 FPS",
            "baseline_energy": 0.04
        },
        {
            "id": "feed-2",
            "name": "SMT PCB Surface Inspection B4",
            "type": "synthetic_pcb",
            "category": "Electronics QC",
            "status": "active",
            "resolution": "4K Macro @ 30 FPS",
            "baseline_energy": 0.05
        },
        {
            "id": "feed-3",
            "name": "Pharma Bottle Packaging Line C2",
            "type": "synthetic_bottle",
            "category": "Pharma Packaging",
            "status": "active",
            "resolution": "1080p @ 120 FPS",
            "baseline_energy": 0.03
        },
        {
            "id": "feed-4",
            "name": "Vault Zone A - High Security Feed",
            "type": "synthetic_security",
            "category": "Security & Surveillance",
            "status": "active",
            "resolution": "1080p IR Night Vision",
            "baseline_energy": 0.02
        }
    ]

@app.post("/api/saas/upgrade")
def upgrade_saas_plan(req: SaaSUpgradeRequest):
    return {
        "success": True,
        "message": f"Successfully updated subscription to {req.plan_name}",
        "monthly_fee": req.monthly_fee,
        "api_key": "jepa_live_pk_" + base64.b64encode(str(time.time()).encode()).decode()[:16]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
