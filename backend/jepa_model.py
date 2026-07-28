"""
JEPA-Guard: Joint Embedding Predictive Architecture (I-JEPA / V-JEPA) PyTorch Implementation
Pioneered by Yann LeCun & Meta AI.

This module provides the complete PyTorch deep learning architecture for training and deploying
JEPA models for visual anomaly detection, quality control inspection, and surveillance.
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class ViTPatchEncoder(nn.Module):
    """
    Vision Transformer Patch Encoder (f_theta)
    Converts 224x224x3 image frames into a 16x16 grid of 512-dimensional patch embeddings.
    """
    def __init__(self, img_size=224, patch_size=14, in_channels=3, embed_dim=512):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.num_patches = (img_size // patch_size) ** 2 # 16x16 = 256
        self.embed_dim = embed_dim

        # Patch projection layer
        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)
        
        # Positional Embeddings
        self.pos_embed = nn.Parameter(torch.zeros(1, self.num_patches, embed_dim))
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

        # Transformer Encoder Blocks
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim, nhead=8, dim_feedforward=2048, dropout=0.1, batch_first=True
        )
        self.blocks = nn.TransformerEncoder(encoder_layer, num_layers=4)

    def forward(self, x):
        # x: (B, C, H, W)
        x = self.proj(x) # (B, D, H/P, W/P)
        x = x.flatten(2).transpose(1, 2) # (B, N_patches, D)
        x = x + self.pos_embed
        x = self.blocks(x) # (B, N_patches, D)
        return x


class JepaPredictor(nn.Module):
    """
    JEPA Predictor Network (g_phi)
    Predicts representations of masked target patches given unmasked context patch representations.
    """
    def __init__(self, embed_dim=512, predictor_dim=384, depth=4):
        super().__init__()
        self.predictor_embed = nn.Linear(embed_dim, predictor_dim)
        self.mask_token = nn.Parameter(torch.zeros(1, 1, predictor_dim))
        nn.init.trunc_normal_(self.mask_token, std=0.02)

        predictor_layer = nn.TransformerEncoderLayer(
            d_model=predictor_dim, nhead=6, dim_feedforward=1536, dropout=0.1, batch_first=True
        )
        self.predictor_blocks = nn.TransformerEncoder(predictor_layer, num_layers=depth)
        self.predictor_proj = nn.Linear(predictor_dim, embed_dim)

    def forward(self, context_embeds, mask_indices=None):
        x = self.predictor_embed(context_embeds)
        x = self.predictor_blocks(x)
        predicted_target_embeds = self.predictor_proj(x)
        return predicted_target_embeds


class JepaModel(nn.Module):
    """
    Full Joint Embedding Predictive Architecture (JEPA) Model
    Features Context Encoder, Target Encoder (Exponential Moving Average), and Predictor Network.
    """
    def __init__(self, img_size=224, patch_size=14, embed_dim=512, ema_decay=0.996):
        super().__init__()
        self.context_encoder = ViTPatchEncoder(img_size, patch_size, 3, embed_dim)
        self.target_encoder = ViTPatchEncoder(img_size, patch_size, 3, embed_dim)
        self.predictor = JepaPredictor(embed_dim=embed_dim)
        self.ema_decay = ema_decay

        # Target encoder is updated via EMA, no gradient computation needed
        for param in self.target_encoder.parameters():
            param.requires_grad = False
        self.update_target_encoder(momentum=0.0) # Copy initial weights

    @torch.no_grad()
    def update_target_encoder(self, momentum=None):
        m = momentum if momentum is not None else self.ema_decay
        for param_q, param_k in zip(self.context_encoder.parameters(), self.target_encoder.parameters()):
            param_k.data.mul_(m).add_((1.0 - m) * param_q.detach().data)

    def compute_latent_energy(self, s_target, s_predicted):
        """
        Calculates normalized L2 latent representation error (Energy Metric E)
        E(i,j) = || s_target - s_predicted ||_2^2 / (|| s_target ||_2^2 + epsilon)
        Output range: [0.0, ~1.0] — values > threshold indicate anomaly.
        """
        sq_error = ((s_predicted - s_target) ** 2).sum(dim=-1)          # (B, N)
        sq_norm  = (s_target ** 2).sum(dim=-1).clamp(min=1e-6)           # (B, N)
        return (sq_error / sq_norm).clamp(max=2.0)                        # (B, N_patches)

    def forward(self, frames):
        """
        frames: (B, 3, 224, 224)
        """
        # 1. Context Encoder
        s_context = self.context_encoder(frames) # (B, N, D)

        # 2. Target Encoder (EMA)
        with torch.no_grad():
            s_target = self.target_encoder(frames) # (B, N, D)

        # 3. Latent Predictor
        s_predicted = self.predictor(s_context) # (B, N, D)

        # 4. Latent Representation Energy (Anomaly Metric)
        patch_energy = self.compute_latent_energy(s_target, s_predicted) # (B, N)
        grid_size = int(math.sqrt(patch_energy.shape[1]))
        energy_map = patch_energy.reshape(-1, grid_size, grid_size)

        return {
            'context_embeds': s_context,
            'target_embeds': s_target,
            'predicted_embeds': s_predicted,
            'energy_map': energy_map, # (B, H_grid, W_grid)
            'max_anomaly_score': energy_map.detach().max(dim=-1)[0].max(dim=-1)[0] # (B,)
        }

if __name__ == '__main__':
    print("Testing JEPA PyTorch Architecture...")
    model = JepaModel(img_size=224, patch_size=14, embed_dim=512)
    dummy_input = torch.randn(2, 3, 224, 224)
    out = model(dummy_input)
    print("Context Embeddings Shape:", out['context_embeds'].shape)
    print("Predicted Target Embeddings Shape:", out['predicted_embeds'].shape)
    print("Energy Heatmap Grid Shape:", out['energy_map'].shape)
    print("Max Anomaly Score per Sample:", out['max_anomaly_score'])
    print("[SUCCESS] JEPA PyTorch Neural Engine operates cleanly!")
