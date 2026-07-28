import React, { useState } from 'react';
import { CreditCard, Check, Key, DollarSign, Copy, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { SaaSMetrics } from '../types';

interface SaaSModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: SaaSMetrics;
  onUpdateMetrics: (metrics: SaaSMetrics) => void;
}

export const SaaSModal: React.FC<SaaSModalProps> = ({ isOpen, onClose, metrics, onUpdateMetrics }) => {
  const [streamCount, setStreamCount] = useState<number>(metrics.activeStreams || 4);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  if (!isOpen) return null;

  // Calculate projected annual labor savings
  const manualLaborCostPerYear = streamCount * 45000; // $45,000 per camera shift inspector
  const jepaSoftwareCostPerYear = metrics.monthlyFee * 12;
  const netSavingsUSD = manualLaborCostPerYear - jepaSoftwareCostPerYear;

  const handleSelectPlan = (planName: 'Starter' | 'Pro Enterprise' | 'Scale Heavy', fee: number, maxStreams: number) => {
    onUpdateMetrics({
      ...metrics,
      planName,
      monthlyFee: fee,
      maxStreams
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(metrics.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="revolut-card p-8 max-w-4xl w-full flex flex-col gap-6 my-8 bg-[#000000] border border-[rgba(255,255,255,0.12)]">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.12)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#494fdf] text-white flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white font-display">
                JEPA-Guard Commercial Plans & Pricing
              </h2>
              <p className="text-xs text-[#8d969e] font-sans">
                Inspired by Revolut Business • High Margin B2B SaaS Model
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8d969e] hover:text-white font-mono px-3 py-1 bg-[#16181a] rounded-full border border-[rgba(255,255,255,0.12)]"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Pricing Tier Cards (Revolut DESIGN.md Plan Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          {/* Starter Plan */}
          <div className={`p-8 rounded-[20px] border flex flex-col justify-between transition ${
            metrics.planName === 'Starter'
              ? 'bg-[#16181a] border-[#494fdf] shadow-lg'
              : 'bg-[#16181a] border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.24)]'
          }`}>
            <div>
              <span className="text-xs font-mono text-[#8d969e] font-bold uppercase tracking-wider block mb-2">STARTER</span>
              <h3 className="text-3xl font-semibold text-white mb-2 font-display">$49 <span className="text-xs font-normal text-[#8d969e]">/ mo</span></h3>
              <p className="text-xs text-[#8d969e] mb-6">Ideal for single small workshops or single conveyor QC lines.</p>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#494fdf]" /> Up to 2 Camera Feeds</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#494fdf]" /> 16x16 JEPA Spatial Heatmap</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#494fdf]" /> CSV Export & Audit Logs</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('Starter', 49, 2)}
              className="mt-8 w-full py-3 rounded-full font-semibold text-xs bg-[#0a0a0a] text-white border border-[rgba(255,255,255,0.12)] hover:bg-[#26292d] transition"
            >
              {metrics.planName === 'Starter' ? 'Current Plan' : 'Select Starter'}
            </button>
          </div>

          {/* Pro Enterprise (Featured Plan Card in Revolut Cobalt Violet #494fdf) */}
          <div className={`p-8 rounded-[20px] relative flex flex-col justify-between transition ${
            metrics.planName === 'Pro Enterprise'
              ? 'revolut-card-featured shadow-[0_0_30px_rgba(73,79,223,0.5)]'
              : 'revolut-card-featured hover:brightness-110'
          }`}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-[#494fdf] shadow-md">
              POPULAR MOST PROFITABLE
            </span>
            <div>
              <span className="text-xs font-mono text-white/80 font-bold uppercase tracking-wider block mb-2">PRO ENTERPRISE</span>
              <h3 className="text-4xl font-semibold text-white mb-2 font-display">$199 <span className="text-xs font-normal text-white/70">/ mo</span></h3>
              <p className="text-xs text-white/80 mb-6">For factories, warehouses, and commercial security firms.</p>
              <ul className="space-y-3 text-xs text-white">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-white font-bold" /> Up to 10 Live Streams</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-white font-bold" /> Real-time PDF Audit Reports</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-white font-bold" /> REST API Key & Webhooks</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-white font-bold" /> Multi-Category Presets</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('Pro Enterprise', 199, 10)}
              className="mt-8 w-full py-3 rounded-full font-bold text-xs bg-white text-[#000000] hover:bg-slate-100 transition shadow-md"
            >
              {metrics.planName === 'Pro Enterprise' ? 'Active Subscription' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Industrial Scale */}
          <div className={`p-8 rounded-[20px] border flex flex-col justify-between transition ${
            metrics.planName === 'Scale Heavy'
              ? 'bg-[#16181a] border-[#494fdf] shadow-lg'
              : 'bg-[#16181a] border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.24)]'
          }`}>
            <div>
              <span className="text-xs font-mono text-[#8d969e] font-bold uppercase tracking-wider block mb-2">INDUSTRIAL SCALE</span>
              <h3 className="text-3xl font-semibold text-white mb-2 font-display">$599 <span className="text-xs font-normal text-[#8d969e]">/ mo</span></h3>
              <p className="text-xs text-[#8d969e] mb-6">Unlimited multi-plant deployment with custom fine-tuned JEPA probes.</p>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#494fdf]" /> Unlimited Camera Feeds</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#494fdf]" /> Dedicated Edge JEPA Model</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#494fdf]" /> 24/7 SLA Support</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('Scale Heavy', 599, 99)}
              className="mt-8 w-full py-3 rounded-full font-semibold text-xs bg-[#0a0a0a] text-white border border-[rgba(255,255,255,0.12)] hover:bg-[#26292d] transition"
            >
              {metrics.planName === 'Scale Heavy' ? 'Current Plan' : 'Select Scale'}
            </button>
          </div>
        </div>

        {/* Customer ROI Savings Calculator */}
        <div className="p-6 rounded-[20px] bg-[#16181a] border border-[rgba(255,255,255,0.12)] flex flex-col gap-4">
          <h3 className="font-semibold text-white text-base font-display flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#40dfb3]" />
            Interactive ROI Calculator (Customer Value Proposition)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center font-sans text-xs">
            <div>
              <label className="text-[#8d969e] block mb-2 font-mono">CAMERA FEEDS MONITORED:</label>
              <input
                type="range"
                min={1}
                max={25}
                value={streamCount}
                onChange={(e) => setStreamCount(parseInt(e.target.value))}
                className="w-full h-2 bg-[#0a0a0a] rounded-full appearance-none cursor-pointer"
              />
              <div className="text-[#494fdf] font-bold text-sm mt-2">{streamCount} Cameras</div>
            </div>

            <div className="p-4 rounded-[12px] bg-[#0a0a0a] border border-[rgba(255,255,255,0.12)]">
              <span className="text-[#8d969e] block font-mono">MANUAL LABOR COST:</span>
              <span className="text-[#ff6b78] font-bold text-base font-mono">${manualLaborCostPerYear.toLocaleString()} / yr</span>
            </div>

            <div className="p-4 rounded-[12px] bg-[rgba(0,168,126,0.15)] border border-[rgba(0,168,126,0.3)]">
              <span className="text-[#40dfb3] font-bold block font-mono">NET CUSTOMER SAVINGS:</span>
              <span className="text-white font-bold text-lg font-mono">${netSavingsUSD.toLocaleString()} / yr</span>
            </div>
          </div>
        </div>

        {/* API Key Gateway */}
        <div className="p-4 rounded-[12px] bg-[#0a0a0a] border border-[rgba(255,255,255,0.12)] flex flex-col gap-2 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-[#494fdf] font-bold">
              <Key className="w-4 h-4" /> ENTERPRISE REST API KEY:
            </span>
            <button onClick={copyApiKey} className="text-white hover:text-slate-300 flex items-center gap-1">
              {copiedKey ? <CheckCircle className="w-3.5 h-3.5 text-[#40dfb3]" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey ? 'COPIED!' : 'COPY API KEY'}
            </button>
          </div>
          <code className="p-2.5 rounded-lg bg-[#16181a] text-slate-200 border border-[rgba(255,255,255,0.12)] break-all select-all">
            {metrics.apiKey}
          </code>
        </div>
      </div>
    </div>
  );
};
