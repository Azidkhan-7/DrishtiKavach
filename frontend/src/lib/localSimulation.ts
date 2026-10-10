import type { SystemTrustState, TelemetryPoint, TrustLevel } from './types';

export interface LocalFault {
  type: string;
  startedAt: number;
  expiresAt: number;
  magnitude: number;
  frozenValue: number;
}

export function simulateTelemetry(
  previous: TelemetryPoint,
  previousTrust: SystemTrustState,
  fault: LocalFault | null,
  timestamp = Date.now() / 1000,
) {
  let distance = 74.2 + Math.sin(timestamp / 30) * 0.3 + (Math.random() - 0.5) * 0.4;
  const activeFault = fault && timestamp < fault.expiresAt ? fault : null;

  switch (activeFault?.type) {
    case 'spike':
      distance += activeFault.magnitude;
      break;
    case 'drift':
      distance += (timestamp - activeFault.startedAt) * 0.85;
      break;
    case 'freeze':
      distance = activeFault.frozenValue;
      break;
    case 'noise':
      distance += (Math.random() - 0.5) * 64;
      break;
    case 'dropout':
      distance = 0;
      break;
  }

  const score = activeFault
    ? ({ spike: 48, drift: 65, freeze: 35, noise: 58, dropout: 12 }[activeFault.type] ?? 65)
    : Math.min(97.2, previousTrust.sensors.distance.trust_score + 3);
  const status: TrustLevel = score >= 85 ? 'NORMAL' : score >= 70 ? 'WATCH' : score >= 40 ? 'DEGRADED' : 'UNTRUSTED';
  const temperature = Number((25.3 + Math.sin(timestamp / 20) * 0.3).toFixed(2));
  const humidity = Number((58.4 + Math.cos(timestamp / 25) * 0.5).toFixed(2));
  const systemScore = Number(((score + 96.8 + 95.9 + 96) / 4).toFixed(1));
  const telemetry: TelemetryPoint = {
    ...previous,
    distance: Number(Math.max(0, distance).toFixed(2)),
    temperature,
    humidity,
    source: 'SIMULATION',
    timestamp,
    trust_score: systemScore,
    trust_level: status,
    has_anomaly: Boolean(activeFault),
    anomaly_type: activeFault?.type ?? null,
  };
  const trust: SystemTrustState = {
    ...previousTrust,
    system_trust_score: systemScore,
    system_status: status,
    mode: 'SIMULATION',
    last_updated: timestamp,
    sensors: {
      ...previousTrust.sensors,
      distance: {
        ...previousTrust.sensors.distance,
        current_value: telemetry.distance,
        trust_score: score,
        status,
        baseline_deviation: Number(Math.abs(telemetry.distance - 74.2).toFixed(2)),
        noise_index: activeFault?.type === 'noise' ? 18.5 : 0.45,
        notes: activeFault ? `Browser simulation: ${activeFault.type} fault injected` : 'Browser simulation: nominal acoustic return',
      },
      temperature: { ...previousTrust.sensors.temperature, current_value: temperature },
      humidity: { ...previousTrust.sensors.humidity, current_value: humidity },
    },
  };

  return { telemetry, trust, activeFault: activeFault?.type ?? null };
}
