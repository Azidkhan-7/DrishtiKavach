'use client';

import React from 'react';
import { DrishtikavachItem, TrustLevel } from '@/lib/types';
import { ShieldCheck, AlertCircle, AlertTriangle, ShieldX } from 'lucide-react';

interface TrustGaugeProps {
  item: DrishtikavachItem;
}

export default function TrustGauge({ item }: TrustGaugeProps) {
  const getStatusBadge = (status: TrustLevel) => {
    switch (status) {
      case 'NORMAL':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-[var(--state-normal)]" />,
          color: 'text-[var(--state-normal)]',
          bg: 'bg-[var(--state-normal)]/10',
          border: 'border-[var(--state-normal)]/30'
        };
      case 'WATCH':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-[var(--state-watch)]" />,
          color: 'text-[var(--state-watch)]',
          bg: 'bg-[var(--state-watch)]/10',
          border: 'border-[var(--state-watch)]/30'
        };
      case 'DEGRADED':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[var(--state-degraded)]" />,
          color: 'text-[var(--state-degraded)]',
          bg: 'bg-[var(--state-degraded)]/10',
          border: 'border-[var(--state-degraded)]/30'
        };
      case 'UNTRUSTED':
      default:
        return {
          icon: <ShieldX className="w-3.5 h-3.5 text-[var(--state-untrusted)]" />,
          color: 'text-[var(--state-untrusted)]',
          bg: 'bg-[var(--state-untrusted)]/10',
          border: 'border-[var(--state-untrusted)]/30'
        };
    }
  };

  const badge = getStatusBadge(item.status);

  return (
    <div className="bg-[var(--bg-secondary)] border border-technical rounded p-4 flex flex-col justify-between">
      {/* Sensor Title & GPIO */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
            {item.gpio !== null && item.gpio !== undefined ? `GPIO ${item.gpio}` : 'VIRTUAL BUS'}
          </span>
          <h4 className="font-mono text-sm font-medium text-[var(--text-primary)]">
            {item.sensor_name}
          </h4>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${badge.bg} ${badge.border} ${badge.color}`}>
          {badge.icon}
          <span className="font-semibold">{item.status}</span>
        </div>
      </div>

      {/* Trust Score & Current Value readout */}
      <div className="grid grid-cols-2 gap-4 my-2 py-2 border-y border-technical/60">
        <div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] block">TRUST SCORE</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-2xl font-mono font-semibold ${badge.color}`}>
              {item.trust_score.toFixed(1)}%
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] block">CURRENT VALUE</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-mono font-semibold text-[var(--text-primary)]">
              {item.current_value}
            </span>
            <span className="text-xs font-mono text-[var(--text-secondary)]">{item.unit}</span>
          </div>
        </div>
      </div>

      {/* Trust Score Progress Bar */}
      <div className="w-full bg-[var(--bg-tertiary)] h-1.5 rounded-full overflow-hidden my-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(4, Math.min(100, item.trust_score))}%`,
            backgroundColor:
              item.status === 'NORMAL'
                ? 'var(--state-normal)'
                : item.status === 'WATCH'
                ? 'var(--state-watch)'
                : item.status === 'DEGRADED'
                ? 'var(--state-degraded)'
                : 'var(--state-untrusted)'
          }}
        />
      </div>

      {/* Diagnostics details */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1">
        <span>REF: {item.baseline_deviation} {item.unit}</span>
        <span>NOISE: {item.noise_index}</span>
      </div>

      {/* Explanatory annotation */}
      <div className="mt-2 pt-2 border-t border-technical/40 text-[11px] font-mono text-[var(--text-secondary)] leading-relaxed">
        {item.notes}
      </div>
    </div>
  );
}
