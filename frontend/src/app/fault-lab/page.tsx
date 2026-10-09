'use client';

import React, { useState } from 'react';
import { useTelemetry } from '@/lib/telemetryContext';
import TelemetryChart from '@/components/charts/TelemetryChart';
import {
  Flame,
  TrendingUp,
  Snowflake,
  Volume2,
  Unplug,
  RotateCcw,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

export default function FaultLabPage() {
  const {
    telemetry,
    trust,
    history,
    activeFault,
    injectFault,
    resetFaults,
    runDemo,
    isDemoRunning
  } = useTelemetry();

  const [lastActionFeedback, setLastActionFeedback] = useState<string | null>(null);

  const handleInject = async (type: string, title: string) => {
    await injectFault(type);
    setLastActionFeedback(`Triggered ${title}: Observing telemetry adaptation...`);
  };

  const handleReset = async () => {
    await resetFaults();
    setLastActionFeedback('Restored physical nominal baseline. Trust recovering...');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Page Header */}
      <div className="border-b border-technical pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-amber)] uppercase tracking-wider mb-2">
            <span>04 // CONTROLLED EXPERIMENTATION BENCH</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-[var(--text-primary)] mb-3">
            FAULT LAB
          </h1>
          <p className="text-sm font-sans text-[var(--text-muted)] max-w-2xl leading-relaxed">
            Test whether the system can distinguish abnormal data from normal environmental change.
          </p>
        </div>

        {/* 1-Click Demo Launcher */}
        <button
          onClick={runDemo}
          disabled={isDemoRunning}
          className={`px-5 py-2.5 rounded text-xs font-mono border flex items-center gap-2 transition-all ${
            isDemoRunning
              ? 'bg-[var(--accent-amber)]/20 border-[var(--accent-amber)] text-[var(--accent-amber)] animate-pulse'
              : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border-technical hover:border-[var(--accent-amber)] text-[var(--text-primary)]'
          }`}
        >
          <Play className={`w-3.5 h-3.5 ${isDemoRunning ? 'animate-spin' : 'text-[var(--accent-amber)]'}`} />
          <span>{isDemoRunning ? 'RUNNING AUTOMATED DEMO...' : 'RUN 1-CLICK DEMO'}</span>
        </button>
      </div>

      {/* Fault Injection Console Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        
        {/* 1. Inject Spike */}
        <div className="bg-[var(--bg-secondary)] border border-technical rounded-lg p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--accent-amber)] border border-technical">
                TRANSIENT STEP
              </span>
              <Zap className="w-4 h-4 text-[var(--accent-amber)]" />
            </div>
            <h3 className="font-mono text-base font-semibold text-[var(--text-primary)] mb-2">
              Inject Spike
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Simulates a sudden ultrasonic jump (74 cm → 312 cm) caused by multipath bounce or false echo reflections.
            </p>
          </div>
          <button
            onClick={() => handleInject('spike', 'Ultrasonic Sudden Spike')}
            className={`w-full py-2 px-3 rounded text-xs font-mono border transition-all ${
              activeFault === 'spike'
                ? 'bg-[var(--state-untrusted)]/20 border-[var(--state-untrusted)] text-[var(--state-untrusted)] font-bold'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border-technical text-[var(--text-primary)]'
            }`}
          >
            {activeFault === 'spike' ? '⚡ SPIKE ACTIVE IN STREAM' : 'TRIGGER SPIKE (+238 cm)'}
          </button>
        </div>

        {/* 2. Simulate Drift */}
        <div className="bg-[var(--bg-secondary)] border border-technical rounded-lg p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--state-watch)] border border-technical">
                RAMP BIAS
              </span>
              <TrendingUp className="w-4 h-4 text-[var(--state-watch)]" />
            </div>
            <h3 className="font-mono text-base font-semibold text-[var(--text-primary)] mb-2">
              Simulate Drift
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Slow continuous offset drift mimicking temperature-induced transducer expansion or sensor aging.
            </p>
          </div>
          <button
            onClick={() => handleInject('drift', 'Continuous Offset Drift')}
            className={`w-full py-2 px-3 rounded text-xs font-mono border transition-all ${
              activeFault === 'drift'
                ? 'bg-[var(--state-watch)]/20 border-[var(--state-watch)] text-[var(--state-watch)] font-bold'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border-technical text-[var(--text-primary)]'
            }`}
          >
            {activeFault === 'drift' ? '📈 DRIFT RAMP ACTIVE' : 'SIMULATE DRIFT (+0.85 cm/s)'}
          </button>
        </div>

        {/* 3. Freeze Reading */}
        <div className="bg-[var(--bg-secondary)] border border-technical rounded-lg p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--accent-cyan)] border border-technical">
                ZERO VARIANCE
              </span>
              <Snowflake className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <h3 className="font-mono text-base font-semibold text-[var(--text-primary)] mb-2">
              Freeze Reading
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Locks data to an invariant value without natural micro-jitter, exposing ADC bus lockup or driver stall.
            </p>
          </div>
          <button
            onClick={() => handleInject('freeze', 'Stuck / Frozen Register')}
            className={`w-full py-2 px-3 rounded text-xs font-mono border transition-all ${
              activeFault === 'freeze'
                ? 'bg-[var(--accent-cyan)]/20 border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-bold'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border-technical text-[var(--text-primary)]'
            }`}
          >
            {activeFault === 'freeze' ? '❄ REGISTER FROZEN' : 'FREEZE READING (0 JITTER)'}
          </button>
        </div>

        {/* 4. Add Noise */}
        <div className="bg-[var(--bg-secondary)] border border-technical rounded-lg p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[#a855f7] border border-technical">
                HIGH SNR
              </span>
              <Volume2 className="w-4 h-4 text-[#a855f7]" />
            </div>
            <h3 className="font-mono text-base font-semibold text-[var(--text-primary)] mb-2">
              Add Noise
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Injects high-amplitude acoustic and electrical jitter (σ = 18.5 cm) on the ECHO wire.
            </p>
          </div>
          <button
            onClick={() => handleInject('noise', 'Elevated High-Frequency Noise')}
            className={`w-full py-2 px-3 rounded text-xs font-mono border transition-all ${
              activeFault === 'noise'
                ? 'bg-purple-500/20 border-purple-500 text-purple-400 font-bold'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border-technical text-[var(--text-primary)]'
            }`}
          >
            {activeFault === 'noise' ? '〰 NOISE INJECTED' : 'ADD HIGH NOISE'}
          </button>
        </div>

        {/* 5. Simulate Dropout */}
        <div className="bg-[var(--bg-secondary)] border border-technical rounded-lg p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--state-untrusted)] border border-technical">
                ZERO ECHO
              </span>
              <Unplug className="w-4 h-4 text-[var(--state-untrusted)]" />
            </div>
            <h3 className="font-mono text-base font-semibold text-[var(--text-primary)] mb-2">
              Simulate Dropout
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Sets ultrasonic distance to 0.0 cm / timeout, testing out-of-range detection and rapid trust collapse.
            </p>
          </div>
          <button
            onClick={() => handleInject('dropout', 'Acoustic Pulse Dropout')}
            className={`w-full py-2 px-3 rounded text-xs font-mono border transition-all ${
              activeFault === 'dropout'
                ? 'bg-[var(--state-untrusted)]/20 border-[var(--state-untrusted)] text-[var(--state-untrusted)] font-bold'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border-technical text-[var(--text-primary)]'
            }`}
          >
            {activeFault === 'dropout' ? '✕ DROPOUT ACTIVE' : 'SIMULATE DROPOUT (0.0 cm)'}
          </button>
        </div>

        {/* 6. Restore Baseline */}
        <div className="bg-[var(--bg-secondary)] border border-technical rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--state-normal)] border border-technical">
                SYSTEM RECOVERY
              </span>
              <RotateCcw className="w-4 h-4 text-[var(--state-normal)]" />
            </div>
            <h3 className="font-mono text-base font-semibold text-[var(--text-primary)] mb-2">
              Reset Nominal
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Clears all injected conditions and allows rolling baselines to gradually recover toward high trust (96%+).
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-2 px-3 rounded text-xs font-mono border bg-[var(--state-normal)]/10 hover:bg-[var(--state-normal)]/20 border-[var(--state-normal)]/40 text-[var(--state-normal)] font-semibold transition-all"
          >
            ↺ RESTORE NOMINAL BASELINE
          </button>
        </div>

      </div>

      {/* Real-time System Reaction & Demonstration Panel */}
      <div className="bg-[var(--bg-secondary)] border border-technical rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-technical text-xs font-mono">
          <span className="text-[var(--text-primary)] font-semibold uppercase">
            LIVE METROLOGY SYSTEM REACTION
          </span>
          <span className="text-[var(--text-muted)]">
            STATUS: {activeFault ? `FAULT [${activeFault.toUpperCase()}] ACTIVE` : 'NOMINAL BASELINE'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          
          {/* Delta Box */}
          <div className="p-4 rounded bg-[var(--bg-tertiary)] border border-technical">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
              TRANSDUCER READING
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-mono font-semibold text-[var(--text-primary)]">
                {telemetry.distance.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">cm</span>
              {activeFault === 'spike' && (
                <span className="text-xs font-mono text-[var(--state-untrusted)] font-bold">
                  (74 cm → 312 cm)
                </span>
              )}
            </div>
            <div className="mt-2 text-[10px] font-mono text-[var(--text-muted)]">
              REF: 74.2 cm baseline
            </div>
          </div>

          {/* System Trust Impact */}
          <div className="p-4 rounded bg-[var(--bg-tertiary)] border border-technical">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
              COMPOSITE TRUST SCORE
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-mono font-semibold ${
                trust.system_status === 'NORMAL' ? 'text-[var(--state-normal)]' :
                trust.system_status === 'WATCH' ? 'text-[var(--state-watch)]' :
                'text-[var(--state-untrusted)]'
              }`}>
                {trust.system_trust_score.toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                [{trust.system_status}]
              </span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[var(--text-muted)]">
              {activeFault === 'spike' ? 'Trust penalized: 96% → 48%' : 'Multi-factor statistical weight'}
            </div>
          </div>

          {/* Plain-English Reason */}
          <div className="p-4 rounded bg-[var(--bg-tertiary)] border border-technical flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                METROLOGICAL REASONING
              </span>
              <p className="text-xs font-mono text-[var(--text-primary)] mt-2 leading-relaxed">
                {activeFault === 'spike'
                  ? '"Reading deviates sharply (+238cm) from recent sensor baseline while platform IMU remains stationary."'
                  : activeFault === 'drift'
                  ? '"Observed continuous unidirectional drift inconsistent with stable thermal surroundings."'
                  : activeFault === 'freeze'
                  ? '"Identical invariant value across consecutive frames indicates ADC register stall."'
                  : activeFault === 'noise'
                  ? '"Elevated high-frequency jitter indicates degraded acoustic signal-to-noise ratio."'
                  : activeFault === 'dropout'
                  ? '"Reading breached valid physical envelope of JSN-SR04T (20-450cm)."'
                  : '"Telemetry tracking nominal physical baseline. System operating in verified envelope."'}
              </p>
            </div>
          </div>

        </div>

        {/* Live Chart within Fault Lab */}
        <div>
          <TelemetryChart
            title="Active Waveform Response to Injected Perturbations"
            dataKey="distance"
            data={history}
            unit="cm"
            color="var(--accent-amber)"
            baseline={74.2}
            height={160}
            precision={1}
          />
        </div>
      </div>

    </div>
  );
}
