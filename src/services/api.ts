import type { SaaSMetrics } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export interface BackendStatus {
  status: string;
  engine: string;
  framework: string;
  device: string;
  cuda_available: boolean;
  version: string;
}

export interface InferenceResult {
  success: boolean;
  inference_time_ms: number;
  max_energy_score: number;
  average_energy: number;
  threshold: number;
  is_anomaly: boolean;
  bounding_box: { x: number; y: number; w: number; h: number } | null;
  energy_map: number[][];
  defect_type: string;
}

export const apiService = {
  // Health check to verify FastAPI Python server connection
  async checkBackendStatus(): Promise<BackendStatus | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/status`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      return null;
    }
  },

  // Analyze frame using PyTorch JEPA backend
  async analyzeFrame(
    imageBase64?: string,
    feedId?: string,
    energyThreshold: number = 0.45,
    sensitivity: number = 2.5
  ): Promise<InferenceResult | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imageBase64 || '',
          feed_id: feedId || 'feed-1',
          energy_threshold: energyThreshold,
          sensitivity: sensitivity
        })
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      return null;
    }
  },

  // Inject synthetic defect into PyTorch server
  async injectDefect(defectType: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inject-defect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defect_type: defectType })
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  // Clear defect state
  async clearDefect(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/clear-defect`, {
        method: 'POST'
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  // Upgrade SaaS Plan via API
  async upgradeSaaSPlan(planName: string, monthlyFee: number, maxStreams: number): Promise<Partial<SaaSMetrics> | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/saas/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_name: planName, monthly_fee: monthlyFee, max_streams: maxStreams })
      });
      if (!response.ok) return null;
      const data = await response.json();
      return {
        planName: planName as any,
        monthlyFee,
        maxStreams,
        apiKey: data.api_key
      };
    } catch (e) {
      return null;
    }
  }
};
