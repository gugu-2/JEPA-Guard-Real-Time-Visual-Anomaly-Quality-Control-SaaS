export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'unreviewed' | 'confirmed' | 'false_alarm';

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
}

export interface AnomalyEvent {
  id: string;
  timestamp: string;
  frameIndex: number;
  energyScore: number; // 0.0 - 1.0
  threshold: number;
  anomalyType: string;
  locationLabel: string;
  boundingBox: BoundingBox;
  severity: SeverityLevel;
  status: IncidentStatus;
  feedId: string;
  feedName: string;
  snapshotUrl?: string;
  latentPatchCoords?: { gx: number; gy: number };
}

export type FeedType = 
  | 'synthetic_conveyor'
  | 'synthetic_pcb'
  | 'synthetic_bottle'
  | 'synthetic_security'
  | 'webcam'
  | 'custom_video';

export interface CameraFeed {
  id: string;
  name: string;
  type: FeedType;
  category: 'Industrial Manufacturing' | 'Electronics QC' | 'Pharma Packaging' | 'Security & Surveillance';
  status: 'active' | 'paused' | 'offline';
  fps: number;
  resolution: string;
  totalInspected: number;
  anomaliesDetected: number;
  baselineEnergy: number;
  thumbnailUrl?: string;
}

export interface JepaConfig {
  contextPatchGrid: number; // e.g. 16x16
  latentDimension: number;  // e.g. 512
  predictorDepth: number;   // e.g. 6 layers
  energyThreshold: number;  // 0.25 - 0.85
  sensitivity: number;      // 1.0 - 5.0
  heatmapOpacity: number;   // 0.1 - 0.9
  heatmapBlur: number;       // 0 - 20px
  soundAlarmEnabled: boolean;
  autoRecordIncident: boolean;
  showPatchGrid: boolean;
  showBoundingBoxes: boolean;
}

export interface SaaSMetrics {
  planName: 'Starter' | 'Pro Enterprise' | 'Scale Heavy';
  monthlyFee: number;
  activeStreams: number;
  maxStreams: number;
  inspections24h: number;
  accuracyRate: number;
  estimatedLaborSavingsUSD: number;
  apiKey: string;
}
