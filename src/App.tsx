import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { VideoInspector } from './components/VideoInspector';
import { JepaTelemetryChart } from './components/JepaTelemetryChart';
import { AnomalyLog } from './components/AnomalyLog';
import { JepaArchitectureDiagram } from './components/JepaArchitectureDiagram';
import { SaaSModal } from './components/SaaSModal';
import { PdfExportModal } from './components/PdfExportModal';

import type { CameraFeed, JepaConfig, AnomalyEvent, SaaSMetrics, IncidentStatus } from './types';
import { JepaEngine } from './engine/jepaEngine';
import { apiService, type BackendStatus } from './services/api';

const INITIAL_FEEDS: CameraFeed[] = [
  {
    id: 'feed-1',
    name: 'Conveyor Line A1 - Metal Sheets',
    type: 'synthetic_conveyor',
    category: 'Industrial Manufacturing',
    status: 'active',
    fps: 30,
    resolution: '1080p @ 60 FPS',
    totalInspected: 14200,
    anomaliesDetected: 14,
    baselineEnergy: 0.04
  },
  {
    id: 'feed-2',
    name: 'SMT PCB Surface Inspection B4',
    type: 'synthetic_pcb',
    category: 'Electronics QC',
    status: 'active',
    fps: 30,
    resolution: '4K Macro @ 30 FPS',
    totalInspected: 8900,
    anomaliesDetected: 5,
    baselineEnergy: 0.05
  },
  {
    id: 'feed-3',
    name: 'Pharma Bottle Packaging Line C2',
    type: 'synthetic_bottle',
    category: 'Pharma Packaging',
    status: 'active',
    fps: 30,
    resolution: '1080p @ 120 FPS',
    totalInspected: 32000,
    anomaliesDetected: 21,
    baselineEnergy: 0.03
  },
  {
    id: 'feed-4',
    name: 'Vault Zone A - High Security Feed',
    type: 'synthetic_security',
    category: 'Security & Surveillance',
    status: 'active',
    fps: 30,
    resolution: '1080p IR Night Vision',
    totalInspected: 45000,
    anomaliesDetected: 3,
    baselineEnergy: 0.02
  }
];

export function App() {
  const feeds = INITIAL_FEEDS;
  const [activeFeed, setActiveFeed] = useState<CameraFeed>(INITIAL_FEEDS[0]);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);

  const [config, setConfig] = useState<JepaConfig>({
    contextPatchGrid: 16,
    latentDimension: 512,
    predictorDepth: 6,
    energyThreshold: 0.45,
    sensitivity: 2.5,
    heatmapOpacity: 0.4,
    heatmapBlur: 4,
    soundAlarmEnabled: false,
    autoRecordIncident: true,
    showPatchGrid: true,
    showBoundingBoxes: true
  });

  const jepaEngine = useMemo(() => new JepaEngine(config), []);

  const [currentTotalEnergy, setCurrentTotalEnergy] = useState<number>(0.04);
  const [currentMaxEnergy, setCurrentMaxEnergy] = useState<number>(0.05);

  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [hasActiveDefect, setHasActiveDefect] = useState<boolean>(false);

  const [saasMetrics, setSaasMetrics] = useState<SaaSMetrics>({
    planName: 'Pro Enterprise',
    monthlyFee: 199,
    activeStreams: 4,
    maxStreams: 10,
    inspections24h: 89420,
    accuracyRate: 99.4,
    estimatedLaborSavingsUSD: 180000,
    apiKey: 'jepa_live_pk_99482f3a0017c5b'
  });

  const [isSaaSModalOpen, setIsSaaSModalOpen] = useState<boolean>(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Poll Python FastAPI Backend Connection Status
  useEffect(() => {
    const checkServer = async () => {
      const status = await apiService.checkBackendStatus();
      setBackendStatus(status);
    };
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle frame processing stats
  const handleFrameProcessed = (energy: number, maxEnergy: number) => {
    setCurrentTotalEnergy(energy);
    setCurrentMaxEnergy(maxEnergy);
  };

  // Handle anomaly event detected by JEPA Engine
  const handleAnomalyDetected = (anomaly: AnomalyEvent) => {
    setAnomalies((prev) => {
      // Prevent duplicate logging within 2 seconds
      if (prev.length > 0 && (Date.now() - parseInt(prev[0].id.split('-')[1])) < 2000) {
        return prev;
      }
      return [anomaly, ...prev];
    });
  };

  // Handle manual defect injection trigger across frontend & backend
  const handleInjectDefect = async (type: string) => {
    jepaEngine.injectDefect(type);
    setHasActiveDefect(true);
    await apiService.injectDefect(type);
  };

  const handleClearDefect = async () => {
    jepaEngine.clearDefect();
    setHasActiveDefect(false);
    await apiService.clearDefect();
  };

  const handleUpdateStatus = (id: string, status: IncidentStatus) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleClearLog = () => {
    setAnomalies([]);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 md:p-6 max-w-[1600px] mx-auto flex flex-col gap-6">
      {/* Header Bar */}
      <Header
        activeFeed={activeFeed}
        feeds={feeds}
        onSelectFeed={(feed) => {
          setActiveFeed(feed);
          handleClearDefect();
        }}
        config={config}
        onUpdateConfig={(newCfg) => {
          setConfig(newCfg);
          jepaEngine.updateConfig(newCfg);
        }}
        saasMetrics={saasMetrics}
        backendStatus={backendStatus}
        onOpenSaaSModal={() => setIsSaaSModalOpen(true)}
        onOpenArchModal={() => setIsArchModalOpen(true)}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onInjectDefect={handleInjectDefect}
        onClearDefect={handleClearDefect}
        hasActiveDefect={hasActiveDefect}
      />

      {/* Main Grid: Video Inspector & Real-time Telemetry Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <VideoInspector
            activeFeed={activeFeed}
            config={config}
            onUpdateConfig={(newCfg) => {
              setConfig(newCfg);
              jepaEngine.updateConfig(newCfg);
            }}
            jepaEngine={jepaEngine}
            onAnomalyDetected={handleAnomalyDetected}
            onFrameProcessed={handleFrameProcessed}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <JepaTelemetryChart
            currentTotalEnergy={currentTotalEnergy}
            currentMaxEnergy={currentMaxEnergy}
            config={config}
          />
        </div>
      </div>

      {/* Inspection Log Table */}
      <AnomalyLog
        anomalies={anomalies}
        onUpdateStatus={handleUpdateStatus}
        onClearLog={handleClearLog}
      />

      {/* Modals */}
      <JepaArchitectureDiagram
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

      <SaaSModal
        isOpen={isSaaSModalOpen}
        onClose={() => setIsSaaSModalOpen(false)}
        metrics={saasMetrics}
        onUpdateMetrics={setSaasMetrics}
      />

      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        activeFeed={activeFeed}
        anomalies={anomalies}
        saasMetrics={saasMetrics}
      />

      {/* Footer */}
      <footer className="glass-panel p-4 text-center text-xs font-mono text-slate-500 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div>
          JEPA-Guard Full-Stack Engine v2.4 • Joint Embedding Representation Architecture • Yann LeCun Paradigm
        </div>
        <div>
          Backend Status: <span className={backendStatus ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
            {backendStatus ? `FastAPI PyTorch (${backendStatus.device.toUpperCase()})` : 'Web Standalone'}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
