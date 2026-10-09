'use client';

import React, { useState } from 'react';
import { useTelemetry } from '@/lib/telemetryContext';
import { AnomalyEventItem } from '@/lib/types';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  FileText,
  Activity,
  Layers,
  HelpCircle,
  TrendingDown
} from 'lucide-react';

export default function AnalysisPage() {
  const { events, telemetry, trust } = useTelemetry();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // If no events in list yet, show fallback sample dossier for immediate exploration
  const activeEvent: AnomalyEventItem =
    events.find((e) => e.event_id === selectedEventId) ||
    events[0] || {
      event_id: 'evt-sample-01',
      timestamp: 1720000000,
      sensor: 'Ultrasonic (JSN-SR04T)',
      anomaly_type: 'Sudden spike',
      severity: 'HIGH',
      confidence: 84.5,
      evidence: [
        'Reading (312.4 cm) deviated by 5.8σ from rolling baseline (74.2 cm).',
        'Cross-sensor inertial check indicates zero physical platform displacement (|a| = 0.992g).',
        'High rate-of-change velocity (+238 cm/s) exceeds maximum physical dynamics.',
        'Ambient temperature and humidity remained stationary.'
      ],
      assessment: 'Likely sensor anomaly or acoustic multipath reflection rather than physical rig displacement.',
      previous_trust: 96.0,
      new_trust: 44.5,
      raw_reading: 312.4,
      baseline_value: 74.2
    };

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0').slice(0, 2);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Page Header */}
      <div className="border-b border-technical pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-amber)] uppercase tracking-wider mb-2">
          <span>03 // ANOMALY ANALYSIS & EXPLAINABILITY</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-[var(--text-primary)] mb-3">
          Metrological Anomaly Workspace
        </h1>
        <p className="text-sm font-sans text-[var(--text-muted)] max-w-2xl leading-relaxed">
          Transparent, deterministic statistical audit logs. Understand precisely why a reading was flagged and how cross-sensor corroboration separated physical movement from sensor failure.
        </p>
      </div>

      {/* Main Workspace Split: Left Dossier / Right Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Active Anomaly Dossier */}
        <div className="lg:col-span-7 bg-[var(--bg-secondary)] border border-technical rounded-lg p-6 shadow-md flex flex-col justify-between">
          <div>
            
            {/* Dossier Header */}
            <div className="flex items-center justify-between pb-4 border-b border-technical text-xs font-mono">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--accent-amber)]" />
                <span className="text-[var(--text-primary)] font-semibold uppercase">
                  DIAGNOSTIC DOSSIER #{activeEvent.event_id.slice(-8)}
                </span>
              </div>
              <span className="text-[var(--text-muted)]">
                LOGGED: {formatTime(activeEvent.timestamp)}
              </span>
            </div>

            {/* Anomaly Badge & Headline */}
            <div className="my-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--state-untrusted)]/15 border border-[var(--state-untrusted)]/40 text-[var(--state-untrusted)] uppercase">
                  ANOMALY DETECTED
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  SEVERITY: <strong className="text-[var(--text-primary)]">{activeEvent.severity}</strong>
                </span>
              </div>

              <h2 className="font-display text-3xl text-[var(--text-primary)] mb-1">
                {activeEvent.anomaly_type}
              </h2>
              <p className="text-xs font-mono text-[var(--accent-cyan)]">
                TARGET SENSOR: {activeEvent.sensor}
              </p>
            </div>

            {/* Confidence & Trust Delta Matrix */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded bg-[var(--bg-tertiary)] border border-technical text-xs font-mono mb-6">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">STATISTICAL CONFIDENCE</span>
                <span className="text-lg font-semibold text-[var(--accent-amber)]">
                  {activeEvent.confidence.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">READING VS BASELINE</span>
                <span className="text-lg font-semibold text-[var(--text-primary)]">
                  {activeEvent.raw_reading.toFixed(1)} <span className="text-xs text-[var(--text-muted)] font-normal">vs {activeEvent.baseline_value.toFixed(1)}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">TRUST SCORE IMPACT</span>
                <div className="flex items-center gap-1.5 text-lg font-semibold text-[var(--state-degraded)]">
                  <TrendingDown className="w-4 h-4 text-[var(--state-untrusted)]" />
                  <span>{activeEvent.previous_trust.toFixed(0)}% → {activeEvent.new_trust.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Evidence Checklist */}
            <div className="mb-6">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--accent-amber)] mb-3 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                <span>SUPPORTING EVIDENCE ({activeEvent.evidence.length} FACTORS)</span>
              </h3>
              <div className="space-y-2.5">
                {activeEvent.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded bg-[var(--bg-primary)] border border-technical/80">
                    <span className="text-[11px] font-mono text-[var(--accent-amber)] font-bold shrink-0 mt-0.5">
                      0{i+1}
                    </span>
                    <span className="text-xs font-sans text-[var(--text-primary)] leading-relaxed">
                      {ev}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrological Assessment Verdict */}
            <div className="p-4 rounded bg-[var(--bg-primary)] border border-technical-strong">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                METROLOGICAL ASSESSMENT
              </span>
              <p className="text-xs font-mono text-[var(--text-primary)] leading-relaxed">
                &quot;{activeEvent.assessment}&quot;
              </p>
              <div className="mt-3 pt-2 border-t border-technical/50 flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
                <HelpCircle className="w-3 h-3 text-[var(--accent-cyan)] shrink-0" />
                <span>Probabilistic assessment intended as engineering aid, not claim of absolute truth.</span>
              </div>
            </div>

          </div>

          <div className="mt-6 pt-4 border-t border-technical text-[10px] font-mono text-[var(--text-muted)] flex justify-between">
            <span>DETECTOR: STATISTICAL KERNEL v1.0</span>
            <span>MODEL: ZERO BLACK-BOX / DETERMINISTIC</span>
          </div>
        </div>

        {/* Right Column: Event Timeline */}
        <div className="lg:col-span-5 bg-[var(--bg-secondary)] border border-technical rounded-lg p-6 shadow-md flex flex-col justify-between">
          <div>
            
            <div className="flex items-center justify-between pb-4 border-b border-technical text-xs font-mono">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="text-[var(--text-primary)] font-semibold uppercase">
                  EVENT CHRONOLOGY ({events.length})
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">REVERSE CHRONO</span>
            </div>

            <div className="my-4 space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="text-center py-12 text-xs font-mono text-[var(--text-muted)]">
                  <ShieldCheck className="w-8 h-8 text-[var(--state-normal)] mx-auto mb-2 opacity-60" />
                  No anomalies recorded. System operating within nominal baseline.
                </div>
              ) : (
                events.map((evt) => {
                  const isSelected = evt.event_id === activeEvent.event_id;
                  return (
                    <div
                      key={evt.event_id}
                      onClick={() => setSelectedEventId(evt.event_id)}
                      className={`p-3 rounded border text-xs font-mono cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[var(--bg-tertiary)] border-[var(--accent-amber)] shadow-sm'
                          : 'bg-[var(--bg-primary)] border-technical hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-[var(--accent-amber)] font-medium">
                          {formatTime(evt.timestamp)}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded border uppercase ${
                            evt.severity === 'CRITICAL' || evt.severity === 'HIGH'
                              ? 'text-[var(--state-untrusted)] border-[var(--state-untrusted)]/30 bg-[var(--state-untrusted)]/10'
                              : 'text-[var(--state-watch)] border-[var(--state-watch)]/30 bg-[var(--state-watch)]/10'
                          }`}
                        >
                          {evt.severity}
                        </span>
                      </div>
                      
                      <div className="font-semibold text-[var(--text-primary)] mb-1">
                        {evt.anomaly_type}
                      </div>

                      <div className="text-[11px] text-[var(--text-muted)] flex justify-between">
                        <span>{evt.sensor}</span>
                        <span>CONF: {evt.confidence.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          <div className="pt-4 border-t border-technical text-[11px] font-mono text-[var(--text-muted)]">
            Click any chronological event to populate full evidence dossier.
          </div>
        </div>

      </div>

    </div>
  );
}
