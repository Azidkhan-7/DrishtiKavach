'use client';

import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Radio,
  Server,
  Activity,
  ShieldCheck,
  FileText,
  Monitor,
  ChevronDown,
  ArrowDown,
  CheckCircle2
} from 'lucide-react';

interface ArchLayer {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  tech: string[];
  responsibilities: string[];
  io: { in: string; out: string };
}

const ARCH_LAYERS: ArchLayer[] = [
  {
    id: 'physical_sensors',
    number: '01',
    title: 'Physical Transducer Layer',
    subtitle: 'DHT11, JSN-SR04T, LEDs, Buzzer, Phone IMU',
    description: 'Hardware sensors deployed in physical environment. Sounding transducer JSN-SR04T emits 40kHz acoustic burst; DHT11 samples humidity & temperature; phone IMU provides 6-axis gravitational reference.',
    tech: ['JSN-SR04T (40kHz Sealed Piezo)', 'DHT11 NTC + Polymer', 'BMI160 / Phone IMU', 'Discrete LEDs & Buzzer'],
    responsibilities: [
      'Acoustic echo transit time measurement (20-450cm envelope)',
      '1-Wire serial transmission with 40-bit packet structure',
      'Continuous 1.0g gravitational inertial reference',
      'Hardware level shifting on GPIO 18 ECHO line (5.0V → 3.3V)'
    ],
    io: {
      in: 'Physical air pressure, temperature, acoustic echoes',
      out: 'Analog pulses, microsecond square waves, 1-wire bitstream'
    }
  },
  {
    id: 'edge_microcontroller',
    number: '02',
    title: 'Edge Compute Node (ESP32)',
    subtitle: 'FreeRTOS Dual-Core Tensilica @ 240MHz',
    description: 'High-speed microcontroller reading microsecond GPIO timer interrupts. Decodes single-wire parity, computes echo distance ($d = v_{sound} \cdot t / 2$), and coordinates local status LEDs.',
    tech: ['ESP32-S3', 'FreeRTOS Tasks', 'Hardware Timers / DMA', 'Wi-Fi 802.11 b/g/n'],
    responsibilities: [
      'Non-blocking GPIO polling and timer interrupt capture',
      'DHT11 parity checksum calculation (40th bit verification)',
      'Acoustic velocity thermal correction ($v = 331.3 + 0.606 \cdot T$)',
      'Local alarm actuation via GPIO 22 Red LED & GPIO 23 Buzzer'
    ],
    io: {
      in: 'GPIO 4, 5, 18 interrupts',
      out: 'Structured JSON telemetry frame'
    }
  },
  {
    id: 'transmission_layer',
    number: '03',
    title: 'Network & Transmission Pipeline',
    subtitle: 'Low-Latency Wi-Fi Gateway',
    description: 'Bi-directional network transport connecting edge ESP32 to central intelligence server. Telemetry transmitted over HTTP POST / WebSocket with millisecond timestamps.',
    tech: ['Wi-Fi 2.4GHz', 'HTTP/1.1 REST', 'RFC 6455 WebSockets', 'JSON Payload'],
    responsibilities: [
      'Resilient connection handling with auto-reconnect backoff',
      'Standardized telemetry packet schema enforcement',
      'Hardware gateway authentication & device ID routing',
      'Stale connection detection (>6s timeout trip)'
    ],
    io: {
      in: 'ESP32 Wi-Fi packets',
      out: 'Authenticated ingestion stream'
    }
  },
  {
    id: 'ingestion_backend',
    number: '04',
    title: 'Data Ingestion & Routing (FastAPI)',
    subtitle: 'Asynchronous Python Server Hub',
    description: 'High-throughput async ASGI engine. Handles incoming telemetry from real ESP32 devices or simulated physical generators, maintaining historical ring buffers and broadcasting to clients.',
    tech: ['FastAPI', 'Uvicorn ASGI', 'Pydantic V2', 'NumPy Ring Buffers'],
    responsibilities: [
      'Decouples frontend from physical hardware state',
      'Maintains 200-sample historical memory buffer',
      'Manages simulation mode when hardware is disconnected',
      'Dispatches telemetry at 1.25 Hz to connected browser clients'
    ],
    io: {
      in: 'POST /api/telemetry or Simulation Generator',
      out: 'Standardized TelemetryPoint memory objects'
    }
  },
  {
    id: 'anomaly_engine',
    number: '05',
    title: 'Deterministic Anomaly Engine',
    subtitle: 'Transparent Statistical Kernel',
    description: 'Pure deterministic statistical filter. Replaces opaque black-box machine learning with explainable rolling baselines, Z-scores ($|z| > 3.2$), rate-of-change velocity clamps, and second-difference noise estimation.',
    tech: ['NumPy Vectorized Math', 'Rolling Mean/Std (μ, σ)', 'Z-Score Analysis', 'Cross-Sensor Correlator'],
    responsibilities: [
      'Dynamic rolling baseline tracking with trimmed median filters',
      'Multi-sample persistence filtering (rejecting single false spikes)',
      'Zero-variance detector (stuck / frozen ADC register)',
      'Cross-sensor correlation (ultrasonic delta vs. IMU inertial motion)'
    ],
    io: {
      in: 'TelemetryPoint time-series stream',
      out: 'AnomalyEvent objects with severity & confidence'
    }
  },
  {
    id: 'trust_engine',
    number: '06',
    title: 'Continuous Trust Evaluation Engine',
    subtitle: 'Multi-Factor Integrity Scoring',
    description: 'Translates raw statistical metrics into an intuitive, bounded 0–100% Trust Score. Classifies channels into Normal (90-100), Watch (70-89), Degraded (40-69), or Untrusted (0-39).',
    tech: ['Empirical Penalization Matrix', 'Weighted Channel Aggregation', 'Classification Heuristics'],
    responsibilities: [
      'Calculates per-drishtikavach based on baseline delta & noise',
      'Applies severe penalty on out-of-range dropouts and frozen registers',
      'Computes system-level composite trust score',
      'Enforces responsible non-absolute confidence bounds'
    ],
    io: {
      in: 'Statistical anomaly deviations & noise indexes',
      out: 'SystemTrustResponse with trust scores and statuses'
    }
  },
  {
    id: 'explanation_engine',
    number: '07',
    title: 'Plain-English Explainability Engine',
    subtitle: 'Human-Centric Evidence Dossiers',
    description: 'Synthesizes plain-English explanations explaining exactly why a reading was flagged or degraded. Completely strips fake AI buzzwords in favor of clean physical and metrological reasoning.',
    tech: ['Rule-Based Evidence Synthesizer', 'Metrological Provenance Generator'],
    responsibilities: [
      'Generates 4-point supporting evidence checklists per anomaly',
      'Explains physical incongruence between ultrasonic and accelerometer',
      'Clarifies confidence levels and probabilistic engineering margins',
      'Compiles chronological event log'
    ],
    io: {
      in: 'Anomaly findings & cross-sensor comparison',
      out: 'Plain-English AnomalyEvent dossier'
    }
  },
  {
    id: 'web_dashboard',
    number: '08',
    title: 'Editorial Web Instrumentation UI',
    subtitle: 'Next.js 15, Three.js 3D CAD Twin, SVG Charts',
    description: 'Scientific instrumentation interface. Features 3D procedural hardware twin, real-time SVG sparkline charts, interactive fault injection laboratory, and dual dark/light laboratory themes.',
    tech: ['Next.js App Router', 'React 19', 'Three.js WebGL', 'Tailwind CSS', 'WebSockets'],
    responsibilities: [
      'Renders interactive 3D digital twin with component raycasting',
      'Displays real-time time-series instrumentation charts',
      'Provides interactive fault lab (spike, drift, freeze, noise, dropout)',
      '1-click automated demonstration sequence orchestrator'
    ],
    io: {
      in: 'WebSocket /ws/telemetry stream',
      out: 'Human operator interaction & decision support'
    }
  }
];

export default function ArchitecturePage() {
  const [selectedLayer, setSelectedLayer] = useState<ArchLayer>(ARCH_LAYERS[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Page Header */}
      <div className="border-b border-technical pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-amber)] uppercase tracking-wider mb-2">
          <span>05 // FULL-STACK SYSTEM TOPOLOGY</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-[var(--text-primary)] mb-3">
          System Architecture
        </h1>
        <p className="text-sm font-sans text-[var(--text-muted)] max-w-2xl leading-relaxed">
          From physical 40 kHz acoustic transducers to plain-English operator dossiers: inspect the 8-tier metrological pipeline. Click any tier to examine engineering specifications.
        </p>
      </div>

      {/* Interactive Topology Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Left Column: Stack Pipeline */}
        <div className="lg:col-span-6 space-y-3">
          {ARCH_LAYERS.map((layer, index) => {
            const isSelected = layer.id === selectedLayer.id;
            return (
              <div key={layer.id} className="relative">
                <div
                  onClick={() => setSelectedLayer(layer)}
                  className={`p-4 rounded border text-xs font-mono cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[var(--bg-secondary)] border-[var(--accent-amber)] shadow-lg'
                      : 'bg-[var(--bg-secondary)]/50 border-technical hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs ${
                      isSelected ? 'bg-[var(--accent-amber)] text-[var(--bg-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                    }`}>
                      {layer.number}
                    </span>
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)] text-sm">
                        {layer.title}
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {layer.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                    isSelected ? 'border-[var(--accent-amber)] text-[var(--accent-amber)]' : 'border-technical text-[var(--text-muted)]'
                  }`}>
                    {isSelected ? 'ACTIVE' : 'INSPECT'}
                  </span>
                </div>

                {/* Downward Connector Arrow */}
                {index < ARCH_LAYERS.length - 1 && (
                  <div className="flex justify-center my-1 text-[var(--text-muted)]/40">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Layer Detailed Specification */}
        <div className="lg:col-span-6 bg-[var(--bg-secondary)] border border-technical rounded-lg p-6 shadow-xl sticky top-24 h-fit">
          <div className="flex items-center justify-between pb-4 border-b border-technical text-xs font-mono">
            <span className="text-[var(--accent-amber)] uppercase font-semibold">
              TIER {selectedLayer.number} SPECIFICATION
            </span>
            <span className="text-[var(--text-muted)]">ID: {selectedLayer.id}</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl text-[var(--text-primary)] mt-4 mb-1">
            {selectedLayer.title}
          </h2>
          <p className="text-xs font-mono text-[var(--accent-cyan)] mb-4">
            {selectedLayer.subtitle}
          </p>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
            {selectedLayer.description}
          </p>

          {/* Tech Badges */}
          <div className="mb-6">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block mb-2">
              CORE TECHNOLOGIES & PROTOCOLS
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedLayer.tech.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)] border border-technical text-[10px] font-mono text-[var(--text-primary)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Responsibilities */}
          <div className="mb-6">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block mb-2">
              ENGINEERING RESPONSIBILITIES
            </span>
            <ul className="space-y-2 text-xs font-mono text-[var(--text-secondary)]">
              {selectedLayer.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--state-normal)] shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* I/O Interface */}
          <div className="p-4 rounded bg-[var(--bg-tertiary)] border border-technical text-xs font-mono space-y-2">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">INPUT INTERFACE</span>
              <span className="text-[var(--text-primary)]">{selectedLayer.io.in}</span>
            </div>
            <div className="pt-2 border-t border-technical/50">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">OUTPUT INTERFACE</span>
              <span className="text-[var(--accent-amber)]">{selectedLayer.io.out}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
