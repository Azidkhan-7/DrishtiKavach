'use client';

import React from 'react';
import { TelemetryPoint } from '@/lib/types';

interface TelemetryChartProps {
  title: string;
  dataKey: keyof TelemetryPoint;
  data: TelemetryPoint[];
  unit: string;
  color?: string;
  baseline?: number;
  height?: number;
  warningThreshold?: number;
  precision?: number;
}

export default function TelemetryChart({
  title,
  dataKey,
  data,
  unit,
  color = '#e5a950',
  baseline,
  height = 120,
  precision = 1
}: TelemetryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="w-full bg-[var(--bg-secondary)] border border-technical rounded p-3 flex items-center justify-center text-xs font-mono text-[var(--text-muted)]"
        style={{ height }}
      >
        Awaiting telemetry frames...
      </div>
    );
  }

  const values = data.map((d) => Number(d[dataKey]) || 0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const currentVal = values[values.length - 1];

  // Dynamic range with padding
  const padding = Math.max((maxVal - minVal) * 0.15, 1.0);
  const yMin = minVal - padding;
  const yMax = maxVal + padding;
  const yRange = Math.max(yMax - yMin, 0.001);

  // SVG Coordinates
  const width = 480;
  const svgHeight = height;

  const points = values.map((val, idx) => {
    const x = (idx / Math.max(values.length - 1, 1)) * (width - 24) + 12;
    const y = svgHeight - 16 - ((val - yMin) / yRange) * (svgHeight - 32);
    return { x, y, val, anomaly: data[idx]?.has_anomaly };
  });

  const polylineStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Baseline Y line
  const baselineY =
    baseline !== undefined
      ? svgHeight - 16 - ((baseline - yMin) / yRange) * (svgHeight - 32)
      : null;

  return (
    <div className="w-full bg-[var(--bg-secondary)] border border-technical rounded p-3 relative flex flex-col justify-between">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs font-mono mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[var(--text-secondary)] font-medium uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {baseline !== undefined && (
            <span className="text-[10px] text-[var(--text-muted)]">
              REF: {baseline.toFixed(precision)} {unit}
            </span>
          )}
          <span className="font-semibold text-[var(--text-primary)]">
            {currentVal.toFixed(precision)} {unit}
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full relative overflow-hidden" style={{ height: svgHeight - 30 }}>
        <svg
          viewBox={`0 0 ${width} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Subtle Grid Guidelines */}
          <line
            x1="12"
            y1={svgHeight * 0.25}
            x2={width - 12}
            y2={svgHeight * 0.25}
            stroke="var(--grid-line)"
            strokeDasharray="2,2"
          />
          <line
            x1="12"
            y1={svgHeight * 0.5}
            x2={width - 12}
            y2={svgHeight * 0.5}
            stroke="var(--grid-line)"
            strokeDasharray="2,2"
          />
          <line
            x1="12"
            y1={svgHeight * 0.75}
            x2={width - 12}
            y2={svgHeight * 0.75}
            stroke="var(--grid-line)"
            strokeDasharray="2,2"
          />

          {/* Reference Baseline Guide */}
          {baselineY !== null && baselineY >= 0 && baselineY <= svgHeight && (
            <line
              x1="12"
              y1={baselineY}
              x2={width - 12}
              y2={baselineY}
              stroke="var(--text-muted)"
              strokeOpacity="0.4"
              strokeDasharray="4,4"
            />
          )}

          {/* Sparkline Path */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />

          {/* Anomaly markers */}
          {points.map((p, i) =>
            p.anomaly ? (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill="var(--state-untrusted)" fillOpacity="0.8" />
                <circle cx={p.x} cy={p.y} r="7" stroke="var(--state-untrusted)" strokeWidth="1" fill="none" />
              </g>
            ) : null
          )}

          {/* Current reading pulse dot */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="3.5"
              fill={color}
              className="animate-pulse"
            />
          )}
        </svg>
      </div>

      {/* Footer scale bounds */}
      <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)] mt-1 border-t border-technical/50 pt-1">
        <span>MIN: {minVal.toFixed(precision)}</span>
        <span>WINDOW: 40 SAMPLES</span>
        <span>MAX: {maxVal.toFixed(precision)}</span>
      </div>
    </div>
  );
}
