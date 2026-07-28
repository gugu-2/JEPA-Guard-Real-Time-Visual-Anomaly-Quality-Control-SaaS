# JEPA-Guard: Real-Time Visual Anomaly & Quality Control SaaS

> **Powered by Joint Embedding Predictive Architecture (JEPA)** — Pioneered by Yann LeCun & Meta AI.

[![PyTorch](https://img.shields.io/badge/PyTorch-2.12+-EE4C2C.svg?style=flat&logo=pytorch)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)

---

## 📂 Project Directory Structure

```
Jepa - Yan L/
├── docs/                      # 📚 Complete Documentation Suite
│   ├── README.md              # Documentation Directory Index
│   ├── ARCHITECTURE.md        # Full-Stack System & REST API Reference
│   ├── JEPA_SPECIFICATION.md  # Theory, Math Equations & Pseudocode Algorithm
│   ├── RESEARCH_PAPER.md      # IEEE / NeurIPS Format Academic Research Paper
│   └── DESIGN.md              # Revolut UI Design System Tokens
│
├── backend/                   # 🐍 Python PyTorch Neural Engine & FastAPI Server
│   ├── jepa_model.py          # PyTorch I-JEPA / V-JEPA Neural Model
│   ├── server.py              # FastAPI High-Performance REST Backend
│   └── train_jepa.py          # Self-Supervised Training Script for Custom Data
│
├── src/                       # ⚛️ React Vite Frontend (Revolut UI Design)
│   ├── App.tsx                # Main Dashboard Container & State Manager
│   ├── index.css              # Revolut Design System Styling
│   ├── engine/                # In-Browser Canvas JEPA Engine
│   ├── services/              # API Client Service connecting React to FastAPI
│   └── components/            # Visual Dashboard & Modal Components
│
├── index.html                 # Main HTML5 entry point
├── package.json               # Node.js dependencies & build scripts
└── vite.config.ts             # Vite bundler configuration
```

---

## ⚡ Quick Start

### 1. Launch PyTorch FastAPI Backend
```bash
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
# API Docs available at: http://localhost:8000/docs
```

### 2. Launch React Web Frontend
```bash
npm run dev
# Web dashboard running at: http://localhost:5173/
```

### 3. Optional: Train on Custom Datasets
```bash
python backend/train_jepa.py --data_dir ./my_custom_images --epochs 10
```

---

## 📚 Complete Documentation Links

- 📖 **[Executive Documentation (`docs/README.md`)](file:///c:/Users/majip/Downloads/Jepa%20-%20Yan%20L/docs/README.md)**
- 📐 **[Technical Architecture (`docs/ARCHITECTURE.md`)](file:///c:/Users/majip/Downloads/Jepa%20-%20Yan%20L/docs/ARCHITECTURE.md)**
- 🧮 **[Mathematical Algorithm & JEPA Specs (`docs/JEPA_SPECIFICATION.md`)](file:///c:/Users/majip/Downloads/Jepa%20-%20Yan%20L/docs/JEPA_SPECIFICATION.md)**
- 🎓 **[Academic Research Paper (`docs/RESEARCH_PAPER.md`)](file:///c:/Users/majip/Downloads/Jepa%20-%20Yan%20L/docs/RESEARCH_PAPER.md)**
- 🎨 **[Revolut Design System (`docs/DESIGN.md`)](file:///c:/Users/majip/Downloads/Jepa%20-%20Yan%20L/docs/DESIGN.md)**
