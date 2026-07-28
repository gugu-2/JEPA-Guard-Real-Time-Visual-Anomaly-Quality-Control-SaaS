import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Activity } from 'lucide-react';
import type { JepaConfig } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface JepaTelemetryChartProps {
  currentTotalEnergy: number;
  currentMaxEnergy: number;
  config: JepaConfig;
}

export const JepaTelemetryChart: React.FC<JepaTelemetryChartProps> = ({
  currentTotalEnergy,
  currentMaxEnergy,
  config
}) => {
  const [energyHistory, setEnergyHistory] = useState<number[]>(Array(30).fill(0.04));
  const [labels, setLabels] = useState<string[]>(Array(30).fill(''));

  useEffect(() => {
    setEnergyHistory((prev) => {
      const updated = [...prev.slice(1), currentMaxEnergy];
      return updated;
    });

    setLabels((prev) => {
      const now = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
      return [...prev.slice(1), now];
    });
  }, [currentMaxEnergy]);

  const isAboveThreshold = currentMaxEnergy >= config.energyThreshold;

  const chartData = {
    labels,
    datasets: [
      {
        label: 'JEPA Max Patch Latent Error',
        data: energyHistory,
        borderColor: isAboveThreshold ? '#e23b4a' : '#494fdf',
        backgroundColor: isAboveThreshold ? 'rgba(226, 59, 74, 0.15)' : 'rgba(73, 79, 223, 0.1)',
        borderWidth: 2.5,
        tension: 0.3,
        fill: true,
        pointRadius: (ctx: any) => (ctx.raw >= config.energyThreshold ? 5 : 0),
        pointBackgroundColor: '#e23b4a'
      },
      {
        label: 'Anomaly Energy Threshold',
        data: Array(30).fill(config.energyThreshold),
        borderColor: 'rgba(236, 126, 0, 0.8)',
        borderDash: [5, 5],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8d969e', font: { family: 'JetBrains Mono', size: 10 } }
      },
      y: {
        min: 0,
        max: 1.0,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8d969e', font: { family: 'JetBrains Mono', size: 10 } }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#8d969e', font: { family: 'Inter', size: 11 } }
      },
      tooltip: {
        backgroundColor: '#0a0a0a',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        titleFont: { family: 'JetBrains Mono' },
        bodyFont: { family: 'JetBrains Mono' }
      }
    }
  };

  return (
    <div className="revolut-card p-6 flex flex-col gap-4">
      {/* Telemetry Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[rgba(255,255,255,0.12)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-[rgba(73,79,223,0.15)] text-[#494fdf]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base font-display">
              Real-Time Latent Energy Telemetry
            </h3>
            <p className="text-xs text-[#8d969e] font-mono">
              Loss: <span className="text-[#a5a9ff]">L2(s, s_hat)</span> • Sampling Rate: 30 Hz
            </p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="text-right">
            <span className="text-[#8d969e] block">AVG ENERGY:</span>
            <span className="text-white font-bold text-sm">{(currentTotalEnergy * 100).toFixed(1)}%</span>
          </div>
          <div className="text-right">
            <span className="text-[#8d969e] block">MAX PATCH ERR:</span>
            <span className={`font-bold text-sm ${isAboveThreshold ? 'text-[#ff6b78]' : 'text-[#40dfb3]'}`}>
              {(currentMaxEnergy * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full relative">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
