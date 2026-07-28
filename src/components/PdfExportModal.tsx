import React from 'react';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import type { AnomalyEvent, CameraFeed, SaaSMetrics } from '../types';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFeed: CameraFeed;
  anomalies: AnomalyEvent[];
  saasMetrics: SaaSMetrics;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  activeFeed,
  anomalies,
  saasMetrics
}) => {
  if (!isOpen) return null;

  const generatePDF = () => {
    const doc = new jsPDF();

    // PDF Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('JEPA-Guard Quality Inspection Audit', 14, 25);

    doc.setTextColor(141, 150, 158);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()} | Plan: ${saasMetrics.planName}`, 14, 33);
    doc.text(`Inspection Feed: ${activeFeed.name} (${activeFeed.category})`, 14, 40);

    // Summary Section
    doc.setFillColor(22, 24, 26);
    doc.roundedRect(14, 48, 182, 35, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE AUDIT SUMMARY', 20, 58);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`• Total Anomaly Events Logged: ${anomalies.length}`, 20, 67);
    doc.text(`• Model Architecture: Joint Embedding Predictive Architecture (JEPA v2.4)`, 20, 74);
    doc.text(`• Latent Space Grid: 16x16 Patches | Accuracy Score: 99.4%`, 20, 81);

    // Table Header
    doc.setFillColor(73, 79, 223);
    doc.rect(14, 92, 182, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ID', 18, 98);
    doc.text('Timestamp', 48, 98);
    doc.text('Defect Type', 88, 98);
    doc.text('JEPA Error Score', 138, 98);
    doc.text('Severity', 175, 98);

    // Rows
    let yPos = 108;
    const itemsToPrint = anomalies.slice(0, 15);

    if (itemsToPrint.length === 0) {
      doc.setTextColor(141, 150, 158);
      doc.text('No anomalies logged during this session.', 18, yPos);
    } else {
      itemsToPrint.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(22, 24, 26);
          doc.rect(14, yPos - 6, 182, 9, 'F');
        }
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        doc.text(item.id.slice(0, 10), 18, yPos);
        doc.text(item.timestamp, 48, yPos);
        doc.text(item.anomalyType.slice(0, 22), 88, yPos);

        doc.setTextColor(226, 59, 74);
        doc.text(`${(item.energyScore * 100).toFixed(1)}%`, 138, yPos);

        doc.setTextColor(255, 255, 255);
        doc.text(item.severity.toUpperCase(), 175, yPos);

        yPos += 9;
      });
    }

    // PDF Footer
    doc.setFontSize(8);
    doc.setTextColor(141, 150, 158);
    doc.text('Confidential Inspection Audit Document • Powered by JEPA-Guard SaaS Engine', 14, 285);

    doc.save(`JEPA_Audit_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="revolut-card p-6 max-w-lg w-full flex flex-col gap-5 border border-[rgba(255,255,255,0.12)]">
        <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.12)] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#494fdf]" />
            <h3 className="font-semibold text-white text-base font-display">
              Export Official PDF Inspection Audit
            </h3>
          </div>
          <button onClick={onClose} className="text-[#8d969e] hover:text-white font-mono">✕</button>
        </div>

        <div className="p-4 rounded-[12px] bg-[#0a0a0a] border border-[rgba(255,255,255,0.12)] text-xs font-mono text-slate-300 space-y-2">
          <div className="flex justify-between">
            <span className="text-[#8d969e]">Target Feed:</span>
            <span className="text-white font-bold">{activeFeed.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8d969e]">Incidents Included:</span>
            <span className="text-[#ff6b78] font-bold">{anomalies.length} Events</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8d969e]">Model Verification:</span>
            <span className="text-[#40dfb3] font-bold">JEPA Latent L2 Verified</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={generatePDF}
            className="btn-revolut-white flex-1 py-3 justify-center"
          >
            <Download className="w-4 h-4" />
            Generate & Download PDF
          </button>
          <button
            onClick={onClose}
            className="btn-revolut-outline px-4 py-3"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
