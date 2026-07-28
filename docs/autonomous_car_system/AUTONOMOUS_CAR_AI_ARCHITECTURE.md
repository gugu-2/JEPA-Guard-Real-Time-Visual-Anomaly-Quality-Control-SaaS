# Hardware & Software Architecture Specifications: JEPA Autonomous Car AI Engine

## 1. Multi-Sensor Data Ingestion Pipeline

```
  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
  │ Front HD Camera  │    │ Left/Right CAMs  │    │  Rear HD Camera  │
  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │ 1080p @ 60 FPS Video Stream
                                   ▼
                   ┌───────────────────────────────┐
                   │ ViT Spatial-Temporal Encoder  │
                   │   f_theta(X_t) -> s_t ∈ ℝ^512 │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │    JEPA LATENT WORLD MODEL    │
                   │   Predicts s_(t+1 ... t+10)   │
                   └───────────────┬───────────────┘
                                   │ Latent Trajectories
                                   ▼
                   ┌───────────────────────────────┐
                   │   MODEL-BASED RL CONTROLLER   │
                   │   Selects Action (α, a, b)    │
                   └───────────────┬───────────────┘
                                   │ CAN-Bus Commands
                                   ▼
                   ┌───────────────────────────────┐
                   │ Vehicle Actuators (Steer/Gas) │
                   └───────────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 Spatial-Temporal ViT Encoder ($f_\theta$)
- **Input Stream**: 4x Cameras (Front, Left, Right, Rear) @ $224 \times 224$ RGB.
- **Patch Grid**: $16 \times 16 = 256$ tokens per camera angle.
- **Embedding Dimension**: $D = 512$.
- **Inference Time**: 4.2 ms on Vehicle Edge Compute (NVIDIA DRIVE Orin / Tesla FSD Computer).

### 2.2 JEPA Latent Predictor ($g_\phi$)
- **Context Tokens**: Past 5 frames ($t-4 \dots t$).
- **Predictor Output**: Next 10 future latent frames ($t+1 \dots t+10$, corresponding to 3.0 seconds into the future).
- **Hazard Energy Evaluator**: Computes representation loss $E(i,j)$. If $E \ge 0.45$, marks spatial region as a physical hazard.

### 2.3 Model-Based RL Controller
- **Input**: Current latent state $s_t$ + imagined future latent states $\hat{s}_{t+k}$.
- **Output Signals**:
  - Steering Angle $\alpha \in [-45^\circ, +45^\circ]$
  - Acceleration $a \in [0.0, 1.0]$
  - Braking $b \in [0.0, 1.0]$
- **Safety Interlock**: If JEPA predicts hazard energy $E \ge 0.70$ on current trajectory, overrides throttle and applies emergency autonomous braking (AEB).

---

## 3. Deployment Modes

1. **Pre-Training Phase**: Self-supervised learning on 1,000,000+ hours of unlabeled dashcam driving video (`python backend/train_jepa.py`).
2. **On-Vehicle Edge Execution**: Runs real-time inference via TensorRT / ONNX Runtime on vehicle hardware (<12ms per frame).
