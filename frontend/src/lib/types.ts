export type TrustLevel = 'NORMAL' | 'WATCH' | 'DEGRADED' | 'UNTRUSTED';

export type SystemMode = 'LIVE_HARDWARE' | 'SIMULATION' | 'STALE_DATA' | 'DISCONNECTED';

export interface TelemetryPoint {
  device_id: string;
  temperature: number;
  humidity: number;
  distance: number;
  ax: number;
  ay: number;
  az: number;
  source: string;
  timestamp: number;
  trust_score?: number;
  trust_level?: TrustLevel;
  has_anomaly?: boolean;
  anomaly_type?: string | null;
}

export interface SensorTrustItem {
  sensor_id: string;
  sensor_name: string;
  trust_score: number;
  status: TrustLevel;
  current_value: number;
  unit: string;
  gpio?: number | null;
  baseline_deviation: number;
  noise_index: number;
  notes: string;
}

export interface SystemTrustState {
  system_trust_score: number;
  system_status: TrustLevel;
  mode: SystemMode;
  device_id: string;
  last_updated: number;
  sensors: Record<string, SensorTrustItem>;
}

export interface AnomalyEventItem {
  event_id: string;
  timestamp: number;
  sensor: string;
  anomaly_type: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence: number;
  evidence: string[];
  assessment: string;
  previous_trust: number;
  new_trust: number;
  raw_reading: number;
  baseline_value: number;
}
