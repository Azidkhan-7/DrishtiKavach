'use client';

import React from 'react';
import { useTelemetry } from '@/lib/telemetryContext';
import TelemetryChart from '@/components/charts/TelemetryChart';
import TrustGauge from '@/components/trust/TrustGauge';
import { Activity, ShieldCheck, AlertTriangle, Radio, RefreshCw, Cpu, Database } from 'lucide-react';

export default function LiveTelemetryPage() {
  const { telemetry, trust, history, activeFault, resetFaults } = useTelemetry();

  const isConnected = trust.mode !== 'DISCONNECTED';
  const accelMag = Math.sqrt(
    telemetry.ax * telemetry.ax +
    telemetry.ay * telemetry.ay +
    telemetry.az * telemetry.az
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Instrumentation Masthead */}
      <div className="bg-[var(--bg-secondary)] border border-technical rounded-lg p-5 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-technical">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--state-normal)] animate-ping" />
              <h1 className="font-display text-2xl sm:text-3xl text-[var(--text-primary)]">
                Live Telemetry & Metrology Stream
              </h1>
            </div>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              CONTINUOUS INGESTION FROM PHYSICAL SENSORS & ACCELEROMETER INERTIAL REFERENCE
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded bg-[var(--bg-tertiary)] border border-technical text-xs font-mono flex items-center gap-2">
              <span className="text-[var(--text-muted)]">SYSTEM STATUS:</span>
              <span className="text-[var(--state-normal)] font-semibold flex items-center gap-1">
                ● {isConnected ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded bg-[var(--bg-tertiary)] border border-technical text-xs font-mono flex items-center gap-2">
              <span className="text-[var(--text-muted)]">MODE:</span>
              <span className="text-[var(--accent-amber)] font-medium">{trust.mode}</span>
            </div>
          </div>
        </div>

        {/* Real-time Subsystem Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">TARGET DEVICE</span>
            <span className="text-[var(--text-primary)] font-semibold">{trust.device_id}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">COMPOSITE TRUST</span>
            <span className="text-[var(--accent-amber)] font-semibold">
              {trust.system_trust_score.toFixed(1)}% ({trust.system_status})
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">ULTRASONIC DISTANCE</span>
            <span className="text-[var(--text-primary)] font-semibold">
              {telemetry.distance.toFixed(1)} cm
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">TEMPERATURE / RH</span>
            <span className="text-[var(--text-primary)] font-semibold">
              {telemetry.temperature.toFixed(1)}°C / {telemetry.humidity.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">INERTIAL MAG |a|</span>
            <span className="text-[var(--text-primary)] font-semibold">
              {accelMag.toFixed(3)} g
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">ACTIVE FAULT INJECTION</span>
            <span className={activeFault ? 'text-[var(--state-untrusted)] font-bold animate-pulse' : 'text-[var(--text-muted)]'}>
              {activeFault ? activeFault.toUpperCase() : 'NOMINAL (NONE)'}
            </span>
          </div>
        </div>
      </div>

      {/* Drishtikavach Section Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl sm:text-2xl text-[var(--text-primary)]">
            Drishtikavach Integrity Matrices
          </h2>
          <p className="text-xs font-mono text-[var(--text-muted)]">
            Trust score is an indicator of data consistency and sensor behaviour. Not a claim of absolute truth.
          </p>
        </div>
        {activeFault && (
          <button
            onClick={resetFaults}
            className="self-start sm:self-auto px-3 py-1 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--state-watch)] text-xs font-mono text-[var(--state-watch)] flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET ALL FAULTS</span>
          </button>
        )}
      </div>

      {/* Drishtikavach Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {trust.sensors.distance && <TrustGauge item={trust.sensors.distance} />}
        {trust.sensors.temperature && <TrustGauge item={trust.sensors.temperature} />}
        {trust.sensors.humidity && <TrustGauge item={trust.sensors.humidity} />}
        {trust.sensors.accelerometer && <TrustGauge item={trust.sensors.accelerometer} />}
      </div>

      {/* Live Time-Series Charts Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-[var(--text-primary)]">
              Real-Time Instrumentation Waveforms
            </h2>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Continuous 40-sample rolling ring buffer with physical baseline reference and anomaly event flags.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[var(--state-normal)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--state-normal)] animate-ping" />
            SYNCHRONIZED (1.25 Hz)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TelemetryChart
            title="Ultrasonic Sounding Distance (JSN-SR04T)"
            dataKey="distance"
            data={history}
            unit="cm"
            color="var(--accent-amber)"
            baseline={74.2}
            height={150}
            precision={1}
          />

          <TelemetryChart
            title="Ambient Temperature (DHT11 GPIO 4)"
            dataKey="temperature"
            data={history}
            unit="°C"
            color="var(--accent-cyan)"
            baseline={25.3}
            height={150}
            precision={2}
          />

          <TelemetryChart
            title="Relative Humidity (DHT11 GPIO 4)"
            dataKey="humidity"
            data={history}
            unit="% RH"
            color="var(--state-normal)"
            baseline={58.4}
            height={150}
            precision={1}
          />

          <TelemetryChart
            title="Inertial Gravity Vector Z (Phone IMU)"
            dataKey="az"
            data={history}
            unit="g"
            color="#a855f7"
            baseline={0.99}
            height={150}
            precision={3}
          />
        </div>
      </div>

      {/* Instrumentation Details Table */}
      <div className="bg-[var(--bg-secondary)] border border-technical rounded-lg p-5">
        <h3 className="font-mono text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wider">
          Telemetry Channel Specifications
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-technical text-[var(--text-muted)]">
                <th className="pb-2">CHANNEL</th>
                <th className="pb-2">PHYSICAL PIN</th>
                <th className="pb-2">VALUE</th>
                <th className="pb-2">NOISE FLOOR</th>
                <th className="pb-2">SIGNAL STATUS</th>
                <th className="pb-2">TRUST RATING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-technical/40 text-[var(--text-secondary)]">
              <tr>
                <td className="py-2.5 font-medium text-[var(--text-primary)]">JSN-SR04T Distance</td>
                <td className="py-2.5 text-[var(--accent-cyan)]">GPIO 5 (TRIG) / GPIO 18 (ECHO)</td>
                <td className="py-2.5 font-semibold text-[var(--text-primary)]">{telemetry.distance.toFixed(1)} cm</td>
                <td className="py-2.5">0.45 cm</td>
                <td className="py-2.5 text-[var(--state-normal)]">ACQUISITION ACTIVE</td>
                <td className="py-2.5 font-semibold text-[var(--accent-amber)]">{trust.sensors.distance?.trust_score.toFixed(1)}%</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-[var(--text-primary)]">DHT11 Temperature</td>
                <td className="py-2.5 text-[var(--accent-cyan)]">GPIO 4 (1-Wire Serial)</td>
                <td className="py-2.5 font-semibold text-[var(--text-primary)]">{telemetry.temperature.toFixed(1)} °C</td>
                <td className="py-2.5">0.08 °C</td>
                <td className="py-2.5 text-[var(--state-normal)]">ACQUISITION ACTIVE</td>
                <td className="py-2.5 font-semibold text-[var(--accent-amber)]">{trust.sensors.temperature?.trust_score.toFixed(1)}%</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-[var(--text-primary)]">DHT11 Humidity</td>
                <td className="py-2.5 text-[var(--accent-cyan)]">GPIO 4 (1-Wire Serial)</td>
                <td className="py-2.5 font-semibold text-[var(--text-primary)]">{telemetry.humidity.toFixed(1)} % RH</td>
                <td className="py-2.5">0.15 %</td>
                <td className="py-2.5 text-[var(--state-normal)]">ACQUISITION ACTIVE</td>
                <td className="py-2.5 font-semibold text-[var(--accent-amber)]">{trust.sensors.humidity?.trust_score.toFixed(1)}%</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-[var(--text-primary)]">Inertial Frame (IMU)</td>
                <td className="py-2.5 text-[var(--text-muted)]">Virtual Gateway</td>
                <td className="py-2.5 font-semibold text-[var(--text-primary)]">ax: {telemetry.ax.toFixed(3)}, ay: {telemetry.ay.toFixed(3)}, az: {telemetry.az.toFixed(3)}</td>
                <td className="py-2.5">0.008 g</td>
                <td className="py-2.5 text-[var(--state-normal)]">CALIBRATED</td>
                <td className="py-2.5 font-semibold text-[var(--accent-amber)]">{trust.sensors.accelerometer?.trust_score.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
