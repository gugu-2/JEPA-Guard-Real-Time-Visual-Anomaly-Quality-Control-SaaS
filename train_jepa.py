"""
JEPA-Guard: Self-Supervised Training Script for Custom Datasets
Pioneered by Yann LeCun & Meta AI.

Usage:
  python train_jepa.py --data_dir ./my_dataset --epochs 10 --batch_size 16

Note: JEPA uses Self-Supervised Learning! You ONLY need normal (unlabeled) video/image samples.
No manual bounding-box annotations or defect labels are required.
"""

import os
import argparse
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from PIL import Image

from jepa_model import JepaModel

class UnlabeledImageDataset(Dataset):
    def __init__(self, folder_path, transform=None):
        self.folder_path = folder_path
        self.transform = transform
        self.image_paths = []

        if os.path.exists(folder_path):
            for root, _, files in os.walk(folder_path):
                for f in files:
                    if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.webp')):
                        self.image_paths.append(os.path.join(root, f))
        
        print(f"[DATASET] Found {len(self.image_paths)} unlabeled training frames in '{folder_path}'")

    def __len__(self):
        return max(len(self.image_paths), 32) # Fallback synthetic samples if folder empty

    def __getitem__(self, idx):
        if len(self.image_paths) > 0:
            path = self.image_paths[idx % len(self.image_paths)]
            img = Image.open(path).convert('RGB')
        else:
            # Synthetic tensor fallback for testing training loop out of the box
            img = Image.fromarray((torch.rand(224, 224, 3).numpy() * 255).astype('uint8'))

        if self.transform:
            img = self.transform(img)
        return img

def train_jepa(data_dir="./dataset", epochs=5, batch_size=8, lr=1e-4, save_path="jepa_weights.pth"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n==================================================")
    print(f"  JEPA Self-Supervised Training Pipeline")
    print(f"  Device: {device} | Epochs: {epochs} | Batch Size: {batch_size}")
    print(f"==================================================\n")

    # Data Augmentations
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.3),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    dataset = UnlabeledImageDataset(data_dir, transform=transform)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, drop_last=False)

    # Initialize JEPA Model & Optimizer
    model = JepaModel(img_size=224, patch_size=14, embed_dim=512).to(device)
    optimizer = torch.optim.AdamW(model.context_encoder.parameters(), lr=lr, weight_decay=0.05)
    
    model.train()
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        total_loss = 0.0
        batches = 0

        for batch_idx, frames in enumerate(dataloader):
            frames = frames.to(device)
            optimizer.zero_grad()

            # Forward pass
            out = model(frames)
            # Loss = mean squared error in representation space
            loss = out['energy_map'].mean()

            loss.backward()
            optimizer.step()

            # EMA Update target encoder
            model.update_target_encoder(momentum=0.996)

            total_loss += loss.item()
            batches += 1

        avg_loss = total_loss / max(batches, 1)
        print(f"Epoch [{epoch}/{epochs}] - JEPA Latent Representation Loss: {avg_loss:.6f}")

    # Save trained weights
    torch.save(model.state_dict(), save_path)
    elapsed = round(time.time() - start_time, 2)
    print(f"\n[SUCCESS] Training completed in {elapsed}s!")
    print(f"[MODEL SAVED] Trained weights saved to '{save_path}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JEPA Self-Supervised Training")
    parser.add_argument("--data_dir", type=str, default="./dataset", help="Path to unlabeled images folder")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=8, help="Batch size")
    args = parser.parse_args()

    train_jepa(args.data_dir, args.epochs, args.batch_size)
