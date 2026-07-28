import React from 'react';
import { AlertTriangle, Download, Cpu, CreditCard, Volume2, VolumeX, Sparkles, Server, ChevronRight } from 'lucide-react';
import type { CameraFeed, JepaConfig, SaaSMetrics } from '../types';
import type { BackendStatus } from '../services/api';

interface HeaderProps {
  activeFeed: CameraFeed;
  feeds: CameraFeed[];
  onSelectFeed: (feed: CameraFeed) => void;
  config: JepaConfig;
  onUpdateConfig: (config: JepaConfig) => void;
  saasMetrics: SaaSMetrics;
  backendStatus: BackendStatus | null;
  onOpenSaaSModal: () => void;
  onOpenArchModal: () => void;
  onOpenPdfModal: () => void;
  onInjectDefect: (type: string) => void;
  onClearDefect: () => void;
  hasActiveDefect: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeFeed,
  feeds,
  onSelectFeed,
  config,
  onUpdateConfig,
  saasMetrics,
  backendStatus,
  onOpenSaaSModal,
  onOpenArchModal,
  onOpenPdfModal,
  onInjectDefect,
  onClearDefect,
  hasActiveDefect
}) => {
  return (
    <header className="bg-[#000000] border-b border-[rgba(255,255,255,0.12)] p-4 md:px-8 mb-6 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Wordmark & Revolut Badge */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#494fdf] text-white flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(73,79,223,0.4)]">
          R
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold text-white tracking-tight font-display">
              JEPA-Guard <span className="text-[#8d969e] text-sm font-normal">by Revolut AI</span>
            </h1>

            {/* FastAPI PyTorch Backend Indicator */}
            {backendStatus ? (
              <span className="revolut-pill-badge badge-teal flex items-center gap-1 font-mono">
                <Server className="w-3 h-3" />
                PYTORCH ({backendStatus.device.toUpperCase()})
              </span>
            ) : (
              <span className="revolut-pill-badge badge-cobalt flex items-center gap-1 font-mono">
                <Cpu className="w-3 h-3" />
                WEB ENGINE
              </span>
            )}
          </div>
          <p className="text-xs text-[#8d969e] font-sans flex items-center gap-2 mt-0.5">
            Real-time visual anomaly intelligence • <button onClick={onOpenArchModal} className="text-[#494fdf] hover:underline font-semibold flex items-center">How JEPA Works <ChevronRight className="w-3 h-3" /></button>
          </p>
        </div>
      </div>

      {/* Revolut Pill Sub-Nav Feed Selector */}
      <div className="flex items-center gap-2 bg-[#16181a] p-1.5 rounded-full border border-[rgba(255,255,255,0.12)]">
        {feeds.map((f) => {
          const isActive = f.id === activeFeed.id;
          return (
            <button
              key={f.id}
              onClick={() => onSelectFeed(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                isActive
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#8d969e] hover:text-white'
              }`}
            >
              {f.category.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Revolut Action Toolbar Buttons */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Inject / Clear Defect Trigger */}
        {hasActiveDefect ? (
          <button
            onClick={onClearDefect}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[rgba(0,168,126,0.2)] text-[#40dfb3] border border-[rgba(0,168,126,0.4)] hover:bg-[rgba(0,168,126,0.3)] transition"
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1" />
            Clear Defect
          </button>
        ) : (
          <button
            onClick={() => onInjectDefect('Synthetic Anomaly')}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[rgba(226,59,74,0.2)] text-[#ff6b78] border border-[rgba(226,59,74,0.4)] hover:bg-[rgba(226,59,74,0.3)] transition animate-pulse"
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
            Inject Defect
          </button>
        )}

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => onUpdateConfig({ ...config, soundAlarmEnabled: !config.soundAlarmEnabled })}
          className={`p-2 rounded-full text-xs border transition ${
            config.soundAlarmEnabled
              ? 'bg-[rgba(236,126,0,0.2)] text-[#ffaa48] border-[rgba(236,126,0,0.4)]'
              : 'bg-[#16181a] text-[#8d969e] border-[rgba(255,255,255,0.12)] hover:text-white'
          }`}
          title={config.soundAlarmEnabled ? 'Audio Alarm Active' : 'Audio Alarm Muted'}
        >
          {config.soundAlarmEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* PDF Audit Exporter */}
        <button
          onClick={onOpenPdfModal}
          className="btn-revolut-outline text-xs py-2 px-4"
        >
          <Download className="w-3.5 h-3.5 inline mr-1" />
          Audit PDF
        </button>

        {/* Revolut Primary CTA: White Pill on Black Canvas */}
        <button
          onClick={onOpenSaaSModal}
          className="btn-revolut-white text-xs"
        >
          <CreditCard className="w-4 h-4" />
          {saasMetrics.planName} (${saasMetrics.monthlyFee}/mo)
        </button>
      </div>
    </header>
  );
};
