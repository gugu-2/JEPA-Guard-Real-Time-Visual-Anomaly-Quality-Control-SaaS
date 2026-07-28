# System Architecture & Technical Specifications: JEPA-Guard

## 1. High-Level Architecture Overview

JEPA-Guard uses a decoupled **Full-Stack Artificial Intelligence Architecture** consisting of a PyTorch Deep Learning core, a high-throughput FastAPI REST backend, and a high-frame-rate React Web client.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           REACT FRONTEND (Client)                       │
│  - App.tsx (State Manager)                                              │
│  - VideoInspector.tsx (Canvas & Thermal Overlay Engine)                 │
│  - JepaTelemetryChart.tsx (Chart.js 30Hz Telemetry Plotter)             │
│  - AnomalyLog.tsx (Audit Table & CSV Exporter)                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ REST JSON Requests (api.ts)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI BACKEND (server.py)                    │
│  - GET  /api/status      -> Health & Device Diagnostics                 │
│  - POST /api/analyze     -> Base64 Image Representation Inference       │
│  - POST /api/inject-defect -> Real-Time Synthetic Defect Injection      │
│  - POST /api/saas/upgrade  -> B2B Plan Upgrade & API Key Generator        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ PyTorch Tensors (CUDA / CPU)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PYTORCH CORE ENGINE (jepa_model.py)               │
│  - ViTPatchEncoder (f_theta)  -> 16x16 Grid Embedding Tokenizer          │
│  - JepaPredictor (g_phi)      -> Representation Prediction Network      │
│  - Target Encoder (EMA)       -> Momentum Target Updater (tau=0.996)     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Deep Learning Core (`jepa_model.py`)

### 2.1 Context Encoder ($f_\theta$)
- **Backbone**: Vision Transformer (ViT) patch encoder.
- **Input Dimension**: $(B, 3, 224, 224)$ RGB image frames.
- **Patch Projection**: 2D Convolution with kernel size $14 \times 14$ and stride $14$.
- **Patch Grid**: $16 \times 16 = 256$ spatial patches.
- **Embedding Dimension**: $D = 512$.
- **Positional Encoding**: Learnable 1D trunc-normal positional embeddings.

### 2.2 Target Encoder ($f_{\bar{\theta}}$)
- Identical architecture to the Context Encoder.
- Parameters $\bar{\theta}$ are **NOT updated via gradient descent**.
- Updated using Exponential Moving Average (EMA) momentum tracking:
  $$\bar{\theta}_{t+1} \leftarrow \tau \bar{\theta}_t + (1 - \tau) \theta_{t+1} \quad (\tau = 0.996)$$

### 2.3 Latent Predictor ($g_\phi$)
- Takes context embeddings $s_{context} \in \mathbb{R}^{B \times N \times 512}$.
- Projects to predictor dimension $D_{pred} = 384$.
- Runs through 4 Multi-Head Transformer Encoder blocks.
- Outputs predicted target patch representations $\hat{s}_{target} \in \mathbb{R}^{B \times N \times 512}$.

### 2.4 Spatial Energy Metric ($E$)
For each patch $(i, j)$ in the $16 \times 16$ grid, the latent prediction error (Energy) is computed:
$$E(i,j) = \frac{\|s_{target}^{(i,j)} - \hat{s}_{target}^{(i,j)}\|_2^2}{\|s_{target}^{(i,j)}\|_2^2}$$
- Normal state: $E(i,j) \le \text{Threshold}$ (approx. $0.03 - 0.08$).
- Defect / Anomaly state: $E(i,j) > \text{Threshold}$ (up to $0.99$).

---

## 3. Backend REST Service (`server.py`)

The FastAPI service encapsulates PyTorch execution and exposes high-speed REST endpoints:

| Endpoint | Method | Input Payload | Response Output |
| :--- | :--- | :--- | :--- |
| `/api/status` | `GET` | None | GPU/CPU device info, active CUDA tensors, JEPA version |
| `/api/analyze` | `POST` | `{ image_base64, energy_threshold, sensitivity }` | `{ max_energy_score, average_energy, is_anomaly, energy_map, bounding_box, inference_time_ms }` |
| `/api/inject-defect` | `POST` | `{ defect_type, gx, gy, size }` | `{ success, active_defect }` |
| `/api/clear-defect` | `POST` | None | `{ success, active_defect }` |
| `/api/saas/upgrade` | `POST` | `{ plan_name, monthly_fee, max_streams }` | `{ success, message, api_key }` |

---

## 4. Frontend Client Architecture (`src/`)

### 4.1 Modular State Management (`src/App.tsx`)
- **Active Feed**: Currently selected camera feed (`synthetic_conveyor`, `synthetic_pcb`, `synthetic_bottle`, `synthetic_security`).
- **Configuration**: Latent grid dimension, energy threshold slider, heatmap opacity, bounding box display, and audio alarm toggle.
- **Incident Logger**: State array storing all detected `AnomalyEvent` instances with snapshot DataURLs.
- **Backend Sync**: Automatic health check polling `apiService.checkBackendStatus()` every 5 seconds.

### 4.2 Canvas Dual Rendering (`src/components/VideoInspector.tsx`)
1. **Base Layer**: Synthesizes 30 FPS dynamic industrial scenes (conveyor belt motion, PCB traces, bottle liquid fills, security camera grids).
2. **Thermal Heatmap Overlay**: Renders $16 \times 16$ translucent color-mapped rectangles ($E > 0.15$) directly over the canvas buffer.
3. **Cybernetic Target Brackets**: Draws corner targeting brackets and high-visibility text tags over anomaly bounding boxes.

---

## 5. Security & Commercial API Gateway

- **API Keys**: Formatted as `jepa_live_pk_<hash>`.
- **CORS**: Pre-configured middleware allowing cross-origin requests from web dashboards or edge hardware.
- **Audit Export**: Exports full audit reports using `jspdf` and structured `CSV` files.
