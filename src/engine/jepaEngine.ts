import type { AnomalyEvent, BoundingBox, CameraFeed, JepaConfig, SeverityLevel } from '../types';

export class JepaEngine {
  private config: JepaConfig;
  private patchGridSize: number = 16; // 16x16 grid = 256 patches
  private patchEnergyMatrix: number[][];
  private frameCount: number = 0;
  private currentDefectType: string | null = null;
  private defectLocation: { gx: number; gy: number; size: number } | null = null;
  private audioContext: AudioContext | null = null;

  constructor(config: JepaConfig) {
    this.config = config;
    this.patchEnergyMatrix = Array(16).fill(0).map(() => Array(16).fill(0.05));
  }

  public updateConfig(newConfig: JepaConfig) {
    this.config = newConfig;
  }

  // Trigger a manual or synthetic defect injection
  public injectDefect(type: string, location?: { gx: number; gy: number; size: number }) {
    this.currentDefectType = type;
    this.defectLocation = location || {
      gx: Math.floor(Math.random() * 8) + 4,
      gy: Math.floor(Math.random() * 8) + 4,
      size: Math.floor(Math.random() * 3) + 2
    };
  }

  public clearDefect() {
    this.currentDefectType = null;
    this.defectLocation = null;
  }

  public getDefectStatus() {
    return { type: this.currentDefectType, location: this.defectLocation };
  }

  // Core JEPA Latent Representation & Energy Evaluation Loop
  public processFrame(
    canvasCtx: CanvasRenderingContext2D,
    width: number,
    height: number,
    feed: CameraFeed,
    isManualDefect: boolean = false
  ): {
    totalEnergy: number;
    maxPatchEnergy: number;
    detectedAnomaly: AnomalyEvent | null;
    patchEnergyMatrix: number[][];
  } {
    this.frameCount++;

    // 1. Render base synthetic feed scene
    this.renderScene(canvasCtx, width, height, feed);

    // 2. Compute JEPA spatial embedding prediction errors
    const grid = this.patchGridSize;
    let totalEnergySum = 0;
    let maxPatchEnergy = 0;
    let maxEnergyPatchCoords = { gx: 0, gy: 0 };

    const baseNoise = feed.baselineEnergy || 0.04;

    for (let gy = 0; gy < grid; gy++) {
      for (let gx = 0; gx < grid; gx++) {
        // Calculate nominal representation distance
        let energy = baseNoise + Math.sin(this.frameCount * 0.1 + gx * 0.5 + gy * 0.3) * 0.02;

        // If defect is present, inject latent representation mismatch in target region
        if (this.defectLocation) {
          const dist = Math.hypot(gx - this.defectLocation.gx, gy - this.defectLocation.gy);
          if (dist <= this.defectLocation.size) {
            const severityMultiplier = 1.0 - (dist / (this.defectLocation.size + 1));
            const spike = 0.55 + severityMultiplier * 0.38 * (this.config.sensitivity / 2.0);
            energy += spike;
          }
        } else if (isManualDefect && gy >= 6 && gy <= 9 && gx >= 6 && gx <= 9) {
          energy += 0.65 * (this.config.sensitivity / 2.0);
        }

        // Clamp energy to [0, 1]
        energy = Math.max(0.01, Math.min(0.99, energy));
        this.patchEnergyMatrix[gy][gx] = energy;

        totalEnergySum += energy;
        if (energy > maxPatchEnergy) {
          maxPatchEnergy = energy;
          maxEnergyPatchCoords = { gx, gy };
        }
      }
    }

    const averageEnergy = totalEnergySum / (grid * grid);

    // 3. Render JEPA Spatial Heatmap Overlay
    if (this.config.heatmapOpacity > 0) {
      this.renderHeatmapOverlay(canvasCtx, width, height, grid);
    }

    // 4. Render Bounding Boxes & HUD overlay
    let detectedAnomaly: AnomalyEvent | null = null;
    const isTriggered = maxPatchEnergy >= this.config.energyThreshold;

    if (isTriggered) {
      const gx = this.defectLocation?.gx ?? maxEnergyPatchCoords.gx;
      const gy = this.defectLocation?.gy ?? maxEnergyPatchCoords.gy;
      const size = this.defectLocation?.size ?? 3;

      const bbox: BoundingBox = {
        x: Math.max(5, Math.min(85, ((gx - size / 2) / grid) * 100)),
        y: Math.max(5, Math.min(85, ((gy - size / 2) / grid) * 100)),
        w: Math.min(90, (size / grid) * 100 * 1.5),
        h: Math.min(90, (size / grid) * 100 * 1.5)
      };

      const severity: SeverityLevel = 
        maxPatchEnergy > 0.75 ? 'critical' :
        maxPatchEnergy > 0.55 ? 'high' :
        maxPatchEnergy > 0.40 ? 'medium' : 'low';

      const typeLabel = this.currentDefectType || this.getDefectNameByFeed(feed.type);

      if (this.config.showBoundingBoxes) {
        this.renderBoundingBox(canvasCtx, width, height, bbox, typeLabel, maxPatchEnergy, severity);
      }

      // Play audio alarm if enabled
      if (this.config.soundAlarmEnabled && this.frameCount % 30 === 0) {
        this.playBeep(maxPatchEnergy > 0.7 ? 880 : 587);
      }

      // Create snapshot thumbnail URL
      const snapshotUrl = canvasCtx.canvas.toDataURL('image/jpeg', 0.6);

      detectedAnomaly = {
        id: `INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        frameIndex: this.frameCount,
        energyScore: parseFloat(maxPatchEnergy.toFixed(3)),
        threshold: this.config.energyThreshold,
        anomalyType: typeLabel,
        locationLabel: `Grid (${gx},${gy}) - ${feed.category}`,
        boundingBox: bbox,
        severity,
        status: 'unreviewed',
        feedId: feed.id,
        feedName: feed.name,
        snapshotUrl,
        latentPatchCoords: maxEnergyPatchCoords
      };
    }

    // Grid lines render
    if (this.config.showPatchGrid) {
      this.renderPatchGridLines(canvasCtx, width, height, grid);
    }

    return {
      totalEnergy: parseFloat(averageEnergy.toFixed(3)),
      maxPatchEnergy: parseFloat(maxPatchEnergy.toFixed(3)),
      detectedAnomaly,
      patchEnergyMatrix: this.patchEnergyMatrix
    };
  }

  // Render Synthetic Industrial Feed Dynamics
  private renderScene(ctx: CanvasRenderingContext2D, w: number, h: number, feed: CameraFeed) {
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, w, h);

    const time = this.frameCount * 0.05;

    switch (feed.type) {
      case 'synthetic_conveyor': {
        // Metallic conveyor belt
        const beltY = h * 0.3;
        const beltH = h * 0.4;

        ctx.fillStyle = '#141c2b';
        ctx.fillRect(0, beltY, w, beltH);

        // Moving slatted belt lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        const offset = (this.frameCount * 4) % 40;
        for (let x = -40 + offset; x < w; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, beltY);
          ctx.lineTo(x + 15, beltY + beltH);
          ctx.stroke();
        }

        // Moving metal plates
        const plateW = 120;
        const plateH = 80;
        const plateSpacing = 220;
        const plateOffset = (this.frameCount * 3) % plateSpacing;

        for (let px = -plateW + plateOffset; px < w + plateW; px += plateSpacing) {
          const py = h * 0.4;

          // Metal plate base
          const gradient = ctx.createLinearGradient(px, py, px + plateW, py + plateH);
          gradient.addColorStop(0, '#475569');
          gradient.addColorStop(0.5, '#94a3b8');
          gradient.addColorStop(1, '#334155');
          ctx.fillStyle = gradient;
          ctx.fillRect(px, py, plateW, plateH);
          ctx.strokeStyle = '#cbd5e1';
          ctx.strokeRect(px, py, plateW, plateH);

          // Check if defect is injected at this metal plate location
          if (this.defectLocation && px > w * 0.2 && px < w * 0.7) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4;
            // Scratch / Crack mark
            ctx.beginPath();
            ctx.moveTo(px + 20, py + 20);
            ctx.lineTo(px + 60, py + 50);
            ctx.lineTo(px + 90, py + 30);
            ctx.stroke();

            // Burn / Discoloration patch
            ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.beginPath();
            ctx.arc(px + 50, py + 40, 18, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }

      case 'synthetic_pcb': {
        // High-tech PCB board background
        ctx.fillStyle = '#042f2e';
        ctx.fillRect(0, 0, w, h);

        // Copper circuit traces
        ctx.strokeStyle = '#0d9488';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const y = (h / 8) * i + 20;
          ctx.moveTo(0, y);
          ctx.lineTo(w * 0.4, y);
          ctx.lineTo(w * 0.5, y + 30);
          ctx.lineTo(w, y + 30);
        }
        ctx.stroke();

        // Electronic IC chips
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(w * 0.3, h * 0.25, 140, 140);
        ctx.strokeStyle = '#64748b';
        ctx.strokeRect(w * 0.3, h * 0.25, 140, 140);

        ctx.fillStyle = '#f59e0b';
        ctx.font = '12px var(--font-mono)';
        ctx.fillText('JEPA-MCU-v4', w * 0.3 + 20, h * 0.25 + 70);

        // Defect injection: Solder bridge or burn mark on IC pins
        if (this.defectLocation) {
          ctx.fillStyle = '#ff1744';
          ctx.beginPath();
          ctx.arc(w * 0.3 + 40, h * 0.25 + 20, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
        break;
      }

      case 'synthetic_bottle': {
        // Pharmaceutical liquid bottle packaging conveyor line
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        const bottleW = 60;
        const bottleH = 140;
        const spacing = 140;
        const offset = (this.frameCount * 2.5) % spacing;

        for (let bx = -bottleW + offset; bx < w + bottleW; bx += spacing) {
          const by = h * 0.3;

          // Glass bottle body
          ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.fillRect(bx, by, bottleW, bottleH);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, bottleW, bottleH);

          // Liquid fill level
          const hasFillDefect = this.defectLocation && bx > w * 0.3 && bx < w * 0.6;
          const fillH = hasFillDefect ? bottleH * 0.2 : bottleH * 0.75; // Low fill defect!

          ctx.fillStyle = hasFillDefect ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.6)';
          ctx.fillRect(bx + 4, by + bottleH - fillH, bottleW - 8, fillH - 4);

          // Cap on top
          const hasCapMissing = hasFillDefect;
          if (!hasCapMissing) {
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(bx + 15, by - 16, 30, 16);
          }
        }
        break;
      }

      case 'synthetic_security': {
        // High-security surveillance camera feed
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        // Security grid floor
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Restricted vault zone outline
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6);
        ctx.fillStyle = 'rgba(255, 23, 68, 0.05)';
        ctx.fillRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6);

        ctx.fillStyle = '#ff1744';
        ctx.font = '12px var(--font-mono)';
        ctx.fillText('RESTRICTED VAULT ZONE A1', w * 0.2 + 15, h * 0.2 + 25);

        // Moving intruder in security zone
        if (this.defectLocation) {
          const ix = (w * 0.3) + Math.sin(time) * 100;
          const iy = (h * 0.4) + Math.cos(time * 0.7) * 50;

          // Silhouette intruder figure
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(ix, iy - 25, 14, 0, Math.PI * 2); // Head
          ctx.fill();
          ctx.fillRect(ix - 12, iy - 10, 24, 40); // Torso
        }
        break;
      }
    }
  }

  // Render JEPA Latent Error Spatial Thermal Overlay
  private renderHeatmapOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, grid: number) {
    const patchW = w / grid;
    const patchH = h / grid;

    ctx.save();
    ctx.globalAlpha = this.config.heatmapOpacity;

    for (let gy = 0; gy < grid; gy++) {
      for (let gx = 0; gx < grid; gx++) {
        const energy = this.patchEnergyMatrix[gy][gx];
        if (energy > 0.15) {
          const px = gx * patchW;
          const py = gy * patchH;

          // Color scale: Green -> Yellow -> Bright Red Glow
          let r = 0, g = 255, b = 0;
          if (energy > 0.5) {
            r = 255;
            g = Math.max(0, Math.floor(255 * (1 - (energy - 0.5) * 2)));
            b = 0;
          } else {
            r = Math.floor(255 * (energy * 2));
            g = 255;
            b = 0;
          }

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(px, py, patchW, patchH);
        }
      }
    }

    ctx.restore();
  }

  private renderBoundingBox(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    bbox: BoundingBox,
    label: string,
    energyScore: number,
    severity: SeverityLevel
  ) {
    const bx = (bbox.x / 100) * w;
    const by = (bbox.y / 100) * h;
    const bw = (bbox.w / 100) * w;
    const bh = (bbox.h / 100) * h;

    const strokeColor = severity === 'critical' ? '#ff1744' : severity === 'high' ? '#ff9100' : '#00f0ff';

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = strokeColor;
    ctx.strokeRect(bx, by, bw, bh);

    // Corner targeting brackets
    const bracketLen = 15;
    ctx.lineWidth = 4;
    // Top-Left
    ctx.beginPath(); ctx.moveTo(bx, by + bracketLen); ctx.lineTo(bx, by); ctx.lineTo(bx + bracketLen, by); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(bx + bw - bracketLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bracketLen); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(bx, by + bh - bracketLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bracketLen, by + bh); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(bx + bw - bracketLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - bracketLen); ctx.stroke();

    // Tag header
    ctx.fillStyle = strokeColor;
    ctx.fillRect(bx, Math.max(0, by - 26), Math.max(160, label.length * 9 + 60), 26);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px var(--font-mono)';
    ctx.fillText(`${label.toUpperCase()} (${(energyScore * 100).toFixed(1)}% JEPA ERR)`, bx + 8, Math.max(16, by - 8));

    ctx.restore();
  }

  private renderPatchGridLines(ctx: CanvasRenderingContext2D, w: number, h: number, grid: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    const patchW = w / grid;
    const patchH = h / grid;

    for (let i = 1; i < grid; i++) {
      ctx.beginPath();
      ctx.moveTo(i * patchW, 0);
      ctx.lineTo(i * patchW, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * patchH);
      ctx.lineTo(w, i * patchH);
      ctx.stroke();
    }
    ctx.restore();
  }

  private getDefectNameByFeed(type: string): string {
    switch (type) {
      case 'synthetic_conveyor': return 'Surface Crack / Metal Defect';
      case 'synthetic_pcb': return 'PCB Solder Bridge / Pin Short';
      case 'synthetic_bottle': return 'Underfill / Missing Cap';
      case 'synthetic_security': return 'Unauthorized Intruder';
      default: return 'JEPA Representation Anomaly';
    }
  }

  private playBeep(freq: number) {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.2);
    } catch (e) {
      // audio disabled or restricted by browser policy
    }
  }
}
