import React from 'react';
import { Cpu, Zap, Layers, ShieldCheck, DollarSign } from 'lucide-react';

interface JepaArchitectureDiagramProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JepaArchitectureDiagram: React.FC<JepaArchitectureDiagramProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="revolut-card p-8 max-w-4xl w-full flex flex-col gap-6 my-8 bg-[#000000] border border-[rgba(255,255,255,0.12)]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.12)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#494fdf] text-white flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white font-display">
                Joint Embedding Predictive Architecture (JEPA) Technical Deep-Dive
              </h2>
              <p className="text-xs text-[#8d969e] font-mono">
                Pioneered by Yann LeCun & Meta AI • Latent Representation Space Prediction
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

        {/* Core Architectural Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Box 1: Context Encoder */}
          <div className="p-5 rounded-[16px] bg-[#16181a] border border-[rgba(255,255,255,0.12)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-[#494fdf] font-bold">
              <span>1. CONTEXT ENCODER (f_θ)</span>
              <Layers className="w-4 h-4" />
            </div>
            <p className="text-slate-300 text-[11px] font-sans">
              Encodes observable frame patches into dense latent representation vectors <code className="text-[#a5a9ff]">s_x</code> without predicting raw pixels.
            </p>
            <div className="mt-2 p-2 rounded-md bg-[#0a0a0a] text-[10px] text-slate-300 border border-[rgba(255,255,255,0.12)]">
              Input: Context Patches X → Latent Vector s_x ∈ ℝ⁵¹²
            </div>
          </div>

          {/* Box 2: Latent Predictor */}
          <div className="p-5 rounded-[16px] bg-[#16181a] border border-[rgba(255,255,255,0.12)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-white font-bold">
              <span>2. LATENT PREDICTOR (g_φ)</span>
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-slate-300 text-[11px] font-sans">
              Predicts the expected representation <code className="text-white">ŝ_y</code> of target patches conditioned on context vector <code className="text-[#a5a9ff]">s_x</code>.
            </p>
            <div className="mt-2 p-2 rounded-md bg-[#0a0a0a] text-[10px] text-slate-300 border border-[rgba(255,255,255,0.12)]">
              Prediction: ŝ_y = g_φ(s_x, z_position)
            </div>
          </div>

          {/* Box 3: Target Encoder & Energy Loss */}
          <div className="p-5 rounded-[16px] bg-[#16181a] border border-[rgba(255,255,255,0.12)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-[#ff6b78] font-bold">
              <span>3. ENERGY LOSS (E_L2)</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-slate-300 text-[11px] font-sans">
              Calculates representation mismatch: <code className="text-[#ff6b78]">E = ||s_y - ŝ_y||²</code>. High energy signals physical anomaly or defect!
            </p>
            <div className="mt-2 p-2 rounded-md bg-[#0a0a0a] text-[10px] text-slate-300 border border-[rgba(255,255,255,0.12)]">
              Anomaly Heatmap: E(x,y) &gt; Threshold
            </div>
          </div>
        </div>

        {/* Why JEPA Wins vs Pixel-Generative Models */}
        <div className="p-6 rounded-[20px] bg-[#16181a] border border-[rgba(255,255,255,0.12)] flex flex-col gap-3">
          <h3 className="font-semibold text-white text-sm font-display flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#40dfb3]" />
            Commercial Advantage: Why JEPA is 20x Cheaper to Run for SaaS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="p-4 rounded-[12px] bg-[#0a0a0a] border border-[rgba(255,255,255,0.12)]">
              <span className="font-bold text-[#ff6b78] block mb-2">Traditional Vision LLMs / Pixel Generative Models</span>
              <ul className="text-slate-300 space-y-1.5 list-disc pl-4 text-[11px]">
                <li>Reconstructs raw 4K pixels or decodes high-dimensional tokens.</li>
                <li>Requires expensive cloud A100 GPUs ($3.50/hr).</li>
                <li>High latency (200ms–2000ms per frame) — unfit for 30 FPS feeds.</li>
                <li>Prone to pixel noise hallucinations & lighting false alarms.</li>
              </ul>
            </div>

            <div className="p-4 rounded-[12px] bg-[#0a0a0a] border border-[rgba(0,168,126,0.3)]">
              <span className="font-bold text-[#40dfb3] block mb-2">JEPA Representation Architecture (JEPA-Guard)</span>
              <ul className="text-slate-300 space-y-1.5 list-disc pl-4 text-[11px]">
                <li>Operates directly in compact 512d embedding space.</li>
                <li>Runs ultra-fast (<strong className="text-white">12ms per frame</strong>) on standard consumer GPUs or edge CPUs.</li>
                <li>Requires minimal labeled training data (few-shot linear probe adaptation).</li>
                <li>High profit margin SaaS (<strong>&gt;85% gross margin</strong>).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
