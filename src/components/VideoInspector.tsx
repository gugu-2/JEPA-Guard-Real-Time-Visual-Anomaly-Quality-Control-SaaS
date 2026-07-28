import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Camera, Upload, Eye, AlertCircle, Layers } from 'lucide-react';
import type { CameraFeed, JepaConfig, AnomalyEvent } from '../types';
import { JepaEngine } from '../engine/jepaEngine';

interface VideoInspectorProps {
  activeFeed: CameraFeed;
  config: JepaConfig;
  onUpdateConfig: (config: JepaConfig) => void;
  jepaEngine: JepaEngine;
  onAnomalyDetected: (anomaly: AnomalyEvent) => void;
  onFrameProcessed: (energy: number, maxEnergy: number) => void;
}

export const VideoInspector: React.FC<VideoInspectorProps> = ({
  activeFeed,
  config,
  onUpdateConfig,
  jepaEngine,
  onAnomalyDetected,
  onFrameProcessed
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFps, setCurrentFps] = useState<number>(30);
  const [lastMaxEnergy, setLastMaxEnergy] = useState<number>(0.05);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Render & Process frame loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isSubscribed = true;

    const renderLoop = () => {
      if (!isSubscribed) return;

      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (isPlaying) {
        if (delta > 0) {
          setCurrentFps(Math.round(1000 / delta));
        }
        lastTimeRef.current = now;

        // Process JEPA latent prediction and heatmap
        const result = jepaEngine.processFrame(ctx, canvas.width, canvas.height, activeFeed);

        setLastMaxEnergy(result.maxPatchEnergy);
        onFrameProcessed(result.totalEnergy, result.maxPatchEnergy);

        if (result.detectedAnomaly) {
          onAnomalyDetected(result.detectedAnomaly);
        }
      }

      requestRef.current = requestAnimationFrame(renderLoop);
    };

    requestRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isSubscribed = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, activeFeed, config, jepaEngine]);

  // Handle Custom Video Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && videoRef.current) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.play();
      setIsWebcamActive(false);
    }
  };

  // Handle Webcam Toggle
  const toggleWebcam = async () => {
    if (isWebcamActive) {
      setIsWebcamActive(false);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsWebcamActive(true);
        }
      } catch (err) {
        alert('Webcam access failed or denied: ' + err);
      }
    }
  };

  const isAlertState = lastMaxEnergy >= config.energyThreshold;

  return (
    <div className="revolut-card p-6 flex flex-col gap-5">
      {/* Top Feed Status Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full ${isAlertState ? 'bg-[#e23b4a] animate-ping' : 'bg-[#00a87e] animate-pulse'}`} />
          <div>
            <h2 className="text-xl font-semibold text-white font-display flex items-center gap-2">
              {activeFeed.name}
            </h2>
            <p className="text-xs text-[#8d969e] font-mono">{activeFeed.category} • {activeFeed.resolution}</p>
          </div>
        </div>

        {/* Real-time Status Badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.12)] text-[#8d969e]">
            FPS: <strong className="text-white">{currentFps}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.12)] text-[#8d969e]">
            LATENT DIM: <strong className="text-[#494fdf]">{config.latentDimension}d</strong>
          </span>
          <span className={`px-3 py-1 rounded-full font-semibold ${
            isAlertState 
              ? 'badge-danger animate-pulse' 
              : 'badge-teal'
          }`}>
            {isAlertState ? '🚨 ANOMALY DETECTED' : 'NORMAL'}
          </span>
        </div>
      </div>

      {/* Main Canvas Viewport Container (Product Mockup Style) */}
      <div className="relative rounded-[28px] overflow-hidden border border-[rgba(255,255,255,0.12)] bg-[#000000] aspect-video flex items-center justify-center shadow-2xl group">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-full object-contain cursor-crosshair"
        />

        {/* Hidden video element for Custom Upload / Webcam */}
        <video ref={videoRef} className="hidden" muted playsInline loop />

        {/* Revolut Product Mockup Overlay Labels */}
        <div className="absolute top-4 left-4 pointer-events-none font-mono text-[11px] text-[#8d969e] bg-[#0a0a0a]/80 backdrop-blur-md px-3 py-1 rounded-full border border-[rgba(255,255,255,0.12)]">
          JEPA REPR SPACE // 16x16 PATCH GRID
        </div>
        <div className="absolute bottom-4 left-4 pointer-events-none font-mono text-[11px] text-[#ffaa48] bg-[#0a0a0a]/80 backdrop-blur-md px-3 py-1 rounded-full border border-[rgba(255,255,255,0.12)]">
          MAX LATENT ERR: {(lastMaxEnergy * 100).toFixed(1)}%
        </div>

        {/* Live HUD Alert Banner overlay */}
        {isAlertState && (
          <div className="absolute top-4 right-4 bg-[#e23b4a] text-white font-mono font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
            <AlertCircle className="w-4 h-4" />
            THRESHOLD EXCEEDED: {lastMaxEnergy.toFixed(3)}
          </div>
        )}
      </div>

      {/* Revolut Controls & Sensitivity Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-[16px] bg-[#0a0a0a] border border-[rgba(255,255,255,0.12)]">
        {/* Play/Pause & Media Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-full bg-white text-black font-semibold hover:bg-slate-200 transition"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleWebcam}
            className={`p-2.5 rounded-full border transition ${
              isWebcamActive 
                ? 'bg-[rgba(226,59,74,0.2)] text-[#ff6b78] border-[rgba(226,59,74,0.4)]' 
                : 'bg-[#16181a] text-white border-[rgba(255,255,255,0.12)] hover:bg-[#26292d]'
            }`}
            title="Toggle Live Webcam"
          >
            <Camera className="w-4 h-4" />
          </button>

          <label className="p-2.5 rounded-full bg-[#16181a] text-white border border-[rgba(255,255,255,0.12)] hover:bg-[#26292d] cursor-pointer transition">
            <Upload className="w-4 h-4" />
            <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Energy Threshold Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-mono text-[#8d969e]">
            <span>ANOMALY THRESHOLD:</span>
            <span className="text-[#494fdf] font-bold">{config.energyThreshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.20}
            max={0.85}
            step={0.01}
            value={config.energyThreshold}
            onChange={(e) => onUpdateConfig({ ...config, energyThreshold: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-[#16181a] rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Heatmap Opacity Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-mono text-[#8d969e]">
            <span>HEATMAP GLOW:</span>
            <span className="text-white font-bold">{Math.round(config.heatmapOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.0}
            max={0.9}
            step={0.05}
            value={config.heatmapOpacity}
            onChange={(e) => onUpdateConfig({ ...config, heatmapOpacity: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-[#16181a] rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Feature Overlay Toggles */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => onUpdateConfig({ ...config, showPatchGrid: !config.showPatchGrid })}
            className={`px-3 py-1.5 rounded-full text-xs font-mono border transition ${
              config.showPatchGrid ? 'bg-[#494fdf] text-white border-[#494fdf]' : 'bg-[#16181a] text-[#8d969e] border-[rgba(255,255,255,0.12)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            GRID
          </button>
          <button
            onClick={() => onUpdateConfig({ ...config, showBoundingBoxes: !config.showBoundingBoxes })}
            className={`px-3 py-1.5 rounded-full text-xs font-mono border transition ${
              config.showBoundingBoxes ? 'bg-[#00a87e] text-white border-[#00a87e]' : 'bg-[#16181a] text-[#8d969e] border-[rgba(255,255,255,0.12)]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" />
            BBOX
          </button>
        </div>
      </div>
    </div>
  );
};
