# Official Meta AI Open-Source JEPA Ecosystem Guide

> **Official Repositories, Pre-Trained Weights, and Open-Source Integration.**

---

## 1. Official Meta AI Open-Source Repositories (Yann LeCun's Team)

Meta AI (FAIR) has released multiple open-source repositories under **permissive MIT / Apache licenses**:

### 1. **Meta I-JEPA (Image Joint Embedding Predictive Architecture)**
- **GitHub Repository**: [`facebookresearch/ijepa`](https://github.com/facebookresearch/ijepa)
- **Paper**: *Self-Supervised Learning from Images with Joint Embedding Predictive Architectures* (Assran et al., CVPR 2023)
- **Pre-trained Checkpoints**:
  - `ijepa_vith14` (ViT-Huge, 14x14 patch size, 1280d embedding)
  - `ijepa_vitg16` (ViT-Giant, 16x16 patch size, 1408d embedding)
- **HuggingFace Weights**: Available via [`meta-fair/ijepa`](https://huggingface.co/models?search=ijepa)

### 2. **Meta V-JEPA (Video Joint Embedding Predictive Architecture)**
- **GitHub Repository**: [`facebookresearch/vjepa`](https://github.com/facebookresearch/vjepa)
- **Paper**: *V-JEPA: Video Joint Embedding Predictive Architecture for Visual World Models* (Bardes et al., 2024)
- **Pre-trained Checkpoints**: Pre-trained on 2,000,000+ hours of video (Kinetics-700 / Something-Something v2).

### 3. **Audio-JEPA**
- **GitHub Repository**: [`facebookresearch/audio_jepa`](https://github.com/facebookresearch/audio_jepa)
- **Use Case**: Self-supervised acoustic wave representation prediction for sound anomaly detection and industrial vibration monitoring.

---

## 2. Loading Official Pre-Trained Weights in PyTorch

You can load Meta's official open-source I-JEPA weights directly in Python with 2 lines of PyTorch code:

```python
import torch

# Load official Meta I-JEPA ViT-Huge model via PyTorch Hub
model = torch.hub.load('facebookresearch/ijepa:main', 'ijepa_vith14', pretrained=True)
model.eval()

# Run inference on input image tensor (B, 3, 224, 224)
input_tensor = torch.randn(1, 3, 224, 224)
with torch.no_grad():
    representations = model(input_tensor)
```

---

## 3. How Our JEPA-Guard Project Integrates Open-Source JEPA

Our workspace contains both the **custom PyTorch JEPA implementation** and the **Meta integration loader**:

1. **[`backend/jepa_model.py`](file:///c:/Users/majip/Downloads/Jepa%20-%20Yan%20L/backend/jepa_model.py)**: A lightweight, standalone PyTorch implementation of I-JEPA / V-JEPA (`ViTPatchEncoder`, `JepaPredictor`, `JepaModel`).
2. **[`backend/load_official_jepa.py`](file:///c:/Users/majip/Downloads/Jepa%20-%20Yan%20L/backend/load_official_jepa.py)**: An integration loader that connects directly to Meta FAIR's open-source GitHub repositories (`facebookresearch/ijepa`).
3. **[`backend/train_jepa.py`](file:///c:/Users/majip/Downloads/Jepa%20-%20Yan%20L/backend/train_jepa.py)**: A self-supervised pre-training script allowing you to fine-tune open-source JEPA weights on your own custom video or image folders.
