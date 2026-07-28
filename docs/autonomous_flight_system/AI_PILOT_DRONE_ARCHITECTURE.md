# Hardware & Software Architecture Specifications: JEPA AI Pilot & Drone Engine

## 1. High-Speed Flight Ingestion Pipeline

```
  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
  │ Stereo Cameras   │    │ IMU / Gyroscope  │    │ Optical Flow/LiDAR│
  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │ 120 FPS Sensor Stream
                                   ▼
                   ┌───────────────────────────────┐
                   │ ViT Spatial-Temporal Encoder  │
                   │   f_theta(X_t) -> s_t ∈ ℝ^512 │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │   JEPA FLIGHT WORLD MODEL     │
                   │   Predicts s_(t+1 ... t+10)   │
                   └───────────────┬───────────────┘
                                   │ Latent Trajectories (<3.8ms)
                                   ▼
                   ┌───────────────────────────────┐
                   │   MODEL-BASED RL CONTROLLER   │
                   │   Selects Action (RPM, Elev)  │
                   └───────────────┬───────────────┘
                                   │ MAVLink / PX4 Commands
                                   ▼
                   ┌───────────────────────────────┐
                   │ Flight Control Unit (FCU)     │
                   └───────────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 Spatial-Temporal ViT Encoder ($f_\theta$)
- **Sensor Inputs**: High-speed Global Shutter Stereo Cameras @ 120 FPS + 6-AXIS IMU.
- **Patch Grid**: $16 \times 16 = 256$ spatial-temporal tokens.
- **Embedding Dimension**: $D = 512$.
- **Inference Time**: 3.8 ms on Vehicle Edge Compute (NVIDIA Jetson Orin NX / Snapdragon Flight RB5).

### 2.2 JEPA Flight Predictor ($g_\phi$)
- **Context Tokens**: Past 4 frames ($t-3 \dots t$).
- **Predictor Output**: Next 10 future latent frames ($t+1 \dots t+10$, corresponding to 0.5 seconds ahead at 120 Hz).
- **Hazard Energy Evaluator**: Computes representation loss $E(i,j)$. If $E \ge 0.40$, flags spatial zone as an aerial obstacle.

### 2.3 Model-Based RL Controller
- **Input**: Current latent state $s_t$ + imagined future latent states $\hat{s}_{t+k}$.
- **Output Signals**:
  - Motor RPM values (Quadrotor) or Control Surface deflections (Aileron, Elevator, Rudder).
- **Emergency Evasion (AEB)**: If JEPA predicts hazard energy $E \ge 0.65$ on current flight vector, overrides user inputs and performs instantaneous evasive banking maneuver.

---

## 3. Flight Deployment Modes

1. **Pre-Training Phase**: Self-supervised learning on 500,000+ hours of unlabeled aerial GoPro video, flight simulator logs, and dashcam data (`python backend/train_jepa.py`).
2. **On-Vehicle Edge Execution**: Runs real-time inference via ONNX Runtime / TensorRT on drone edge hardware (<3.8ms per frame).
