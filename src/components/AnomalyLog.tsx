import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, FileSpreadsheet, Trash2 } from 'lucide-react';
import type { AnomalyEvent, IncidentStatus } from '../types';

interface AnomalyLogProps {
  anomalies: AnomalyEvent[];
  onUpdateStatus: (id: string, status: IncidentStatus) => void;
  onClearLog: () => void;
}

export const AnomalyLog: React.FC<AnomalyLogProps> = ({
  anomalies,
  onUpdateStatus,
  onClearLog
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

  const filteredAnomalies = anomalies.filter((a) => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  // CSV Exporter
  const exportToCSV = () => {
    if (anomalies.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Feed Name', 'Anomaly Type', 'Energy Score', 'Threshold', 'Severity', 'Status', 'Location'];
    const rows = anomalies.map(a => [
      a.id,
      a.timestamp,
      a.feedName,
      a.anomalyType,
      a.energyScore,
      a.threshold,
      a.severity,
      a.status,
      `"${a.locationLabel}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `JEPA_Inspection_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="revolut-card p-6 flex flex-col gap-4">
      {/* Log Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[rgba(255,255,255,0.12)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-[rgba(226,59,74,0.15)] text-[#ff6b78]">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base font-display">
              Inspection Log & Incident Feed ({filteredAnomalies.length})
            </h3>
            <p className="text-xs text-[#8d969e] font-sans">
              Real-time audit trail of detected representation anomalies
            </p>
          </div>
        </div>

        {/* Filters & CSV Export Toolbar */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.12)] rounded-full px-3 py-1.5 text-white focus:outline-none"
          >
            <option value="all">SEVERITY: ALL</option>
            <option value="critical">CRITICAL</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.12)] rounded-full px-3 py-1.5 text-white focus:outline-none"
          >
            <option value="all">STATUS: ALL</option>
            <option value="unreviewed">UNREVIEWED</option>
            <option value="confirmed">CONFIRMED</option>
            <option value="false_alarm">FALSE ALARM</option>
          </select>

          <button
            onClick={exportToCSV}
            disabled={anomalies.length === 0}
            className="btn-revolut-outline text-xs py-1.5 px-3.5 disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1" />
            CSV Export
          </button>

          <button
            onClick={onClearLog}
            className="p-2 rounded-full bg-[#0a0a0a] text-[#8d969e] border border-[rgba(255,255,255,0.12)] hover:text-[#ff6b78] transition"
            title="Clear Log History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#0a0a0a] text-[#8d969e] uppercase tracking-wider sticky top-0 border-b border-[rgba(255,255,255,0.12)]">
            <tr>
              <th className="py-3 px-4">Snapshot</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Defect Category</th>
              <th className="py-3 px-4">JEPA Latent Err</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
            {filteredAnomalies.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#8d969e] italic font-sans">
                  No anomaly incidents logged matching current filters.
                </td>
              </tr>
            ) : (
              filteredAnomalies.map((item) => (
                <tr key={item.id} className="hover:bg-[#0a0a0a]/60 transition">
                  {/* Thumbnail */}
                  <td className="py-2.5 px-4">
                    {item.snapshotUrl ? (
                      <button
                        onClick={() => setSelectedSnapshot(item.snapshotUrl!)}
                        className="w-10 h-7 rounded-md overflow-hidden border border-[rgba(255,255,255,0.12)] hover:border-[#494fdf] transition"
                      >
                        <img src={item.snapshotUrl} alt="Snapshot" className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <span className="text-[#5c5e60]">—</span>
                    )}
                  </td>

                  {/* Timestamp & Feed */}
                  <td className="py-2.5 px-4">
                    <div className="text-white font-semibold">{item.timestamp}</div>
                    <div className="text-[10px] text-[#8d969e]">{item.feedName}</div>
                  </td>

                  {/* Defect Category */}
                  <td className="py-2.5 px-4">
                    <span className="text-white font-medium">{item.anomalyType}</span>
                    <div className="text-[10px] text-[#8d969e]">{item.locationLabel}</div>
                  </td>

                  {/* Energy Score */}
                  <td className="py-2.5 px-4">
                    <span className="font-bold text-[#ff6b78]">{(item.energyScore * 100).toFixed(1)}%</span>
                  </td>

                  {/* Severity Badge */}
                  <td className="py-2.5 px-4">
                    <span
                      className={`revolut-pill-badge uppercase text-[10px] ${
                        item.severity === 'critical' ? 'badge-danger font-bold' :
                        item.severity === 'high' ? 'badge-warning font-bold' :
                        'badge-cobalt'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>

                  {/* Incident Status */}
                  <td className="py-2.5 px-4">
                    <span className={`revolut-pill-badge text-[10px] ${
                      item.status === 'confirmed' ? 'badge-teal' :
                      item.status === 'false_alarm' ? 'bg-[#0a0a0a] text-[#8d969e]' :
                      'badge-warning animate-pulse'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onUpdateStatus(item.id, 'confirmed')}
                        className="p-1.5 rounded-full bg-[rgba(0,168,126,0.15)] text-[#40dfb3] hover:bg-[rgba(0,168,126,0.3)] transition"
                        title="Mark Confirmed Defect"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onUpdateStatus(item.id, 'false_alarm')}
                        className="p-1.5 rounded-full bg-[#0a0a0a] text-[#8d969e] border border-[rgba(255,255,255,0.12)] hover:text-white transition"
                        title="Mark False Alarm"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Snapshot Preview Modal */}
      {selectedSnapshot && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div className="revolut-card p-6 max-w-2xl w-full flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.12)] pb-3">
              <h4 className="font-semibold text-white font-display text-base">JEPA Snapshot Latent Capture</h4>
              <button onClick={() => setSelectedSnapshot(null)} className="text-[#8d969e] hover:text-white font-mono">✕ CLOSE</button>
            </div>
            <img src={selectedSnapshot} alt="Snapshot Preview" className="w-full rounded-[16px] border border-[rgba(255,255,255,0.12)]" />
          </div>
        </div>
      )}
    </div>
  );
};
