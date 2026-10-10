'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SensorRigScene, { ComponentInspectionData } from '@/components/3d/SensorRigScene';
import { useTelemetry } from '@/lib/telemetryContext';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Radio,
  Zap,
  Sliders,
  Layers,
  ChevronRight,
  AlertTriangle,
  Flame,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export default function HomePage() {
  const { telemetry, trust, theme, injectFault, activeFault } = useTelemetry();
  const [selectedComp, setSelectedComp] = useState<ComponentInspectionData | null>(null);

  return (
    <div className="w-full flex flex-col bg-tech-grid">
      
      {/* 01 HERO SECTION */}
      <section className="relative min-h-[70vh] flex flex-col justify-between border-b border-technical overflow-hidden px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Eyebrow & Status */}
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--accent-amber)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-amber)] animate-pulse" />
            <span className="tracking-widest uppercase">PHYSICAL SENSOR INTELLIGENCE / MVP</span>
          </div>
          <div className="text-[var(--text-muted)] hidden sm:block">
            STATION: RIG-LAB-01 // TENSILICA XTENSA ESP32
          </div>
        </div>

        {/* Hero Centered Layout */}
        <div className="max-w-4xl mx-auto w-full text-center flex flex-col items-center justify-center my-auto py-20 z-10">
          <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl tracking-tight text-[var(--text-primary)] leading-[1.0] mb-6 drop-shadow-sm">
            DRISHTI<br />
            <span className="italic font-normal text-[var(--accent-amber)]">KAVACH</span>
          </h1>

          <h2 className="font-display text-2xl sm:text-3xl text-[var(--text-secondary)] mb-6 font-normal">
            Know when your sensors can be trusted.
          </h2>

          <p className="text-base font-sans text-[var(--text-muted)] leading-relaxed mb-10 max-w-2xl">
            Monitor continuous telemetry, detect anomalous physical behaviour, and understand why a reading may not be trustworthy through statistical cross-sensor corroboration.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/system"
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[var(--accent-amber)] text-[var(--bg-primary)] text-sm font-mono font-semibold tracking-wider hover:opacity-90 transition-opacity shadow-lg"
            >
              <span>EXPLORE SYSTEM</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/live"
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-technical text-[var(--text-primary)] text-sm font-mono tracking-wider transition-colors shadow-sm"
            >
              <span>VIEW LIVE TELEMETRY</span>
            </Link>
          </div>
        </div>

        {/* Bottom Hero Ribbon */}
        <div className="max-w-7xl mx-auto w-full pt-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[var(--text-muted)] border-t border-technical/60 gap-2">
          <div className="flex items-center gap-4">
            <span>SAMPLING RATE: 1.25 Hz</span>
            <span>•</span>
            <span>DEVICE: esp32-01</span>
            <span>•</span>
            <span className="text-[var(--state-normal)]">HEALTH: OK</span>
          </div>
          <div className="flex items-center gap-2">
            <span>CORE CYCLE:</span>
            <span className="text-[var(--text-primary)] font-medium">SENSE → CHECK → CORRELATE → ASSESS → EXPLAIN</span>
          </div>
        </div>

      </section>

      {/* 01.5 3D DIGITAL TWIN */}
      <section className="relative w-full border-b border-technical bg-[var(--bg-primary)] py-16">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-10">
             <span className="text-xs font-mono text-[var(--accent-amber)] tracking-widest uppercase block mb-3">
               INTERACTIVE 3D DIGITAL TWIN
             </span>
             <h2 className="font-display text-4xl text-[var(--text-primary)]">
               Explore the Metrology Rig
             </h2>
             <p className="text-sm text-[var(--text-muted)] font-mono mt-4 border border-technical inline-block px-4 py-2 rounded-full bg-[var(--bg-secondary)]/50">
               DRAG TO ROTATE 360° // CLICK COMPONENT TO INSPECT
             </p>
           </div>
           
           <div className="border border-technical rounded-xl bg-[var(--bg-secondary)]/40 p-2 shadow-2xl backdrop-blur-sm relative">
             <SensorRigScene
                theme={theme}
                onSelectComponent={(c) => setSelectedComp(c)}
                telemetry={telemetry}
             />

             {/* Component Inspection Modal Overlay if clicked */}
             {selectedComp && (
               <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-30 p-5 rounded-lg bg-[var(--bg-primary)]/95 border border-[var(--accent-amber)] backdrop-blur-xl shadow-2xl animate-fadeIn">
                 <div className="flex items-start justify-between">
                   <div>
                     <span className="text-[10px] font-mono text-[var(--accent-amber)] uppercase tracking-wider block">
                       HARDWARE INSPECTION
                     </span>
                     <h4 className="font-display text-xl text-[var(--text-primary)] mt-1">
                       {selectedComp.name}
                     </h4>
                   </div>
                   <button
                     onClick={() => setSelectedComp(null)}
                     className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 border border-technical rounded transition-colors"
                   >
                     CLOSE
                   </button>
                 </div>
                 <p className="text-sm text-[var(--text-secondary)] my-4 leading-relaxed">
                   {selectedComp.purpose}
                 </p>
                 <div className="grid grid-cols-2 gap-4 text-[11px] font-mono mt-4 pt-4 border-t border-technical">
                   <div>
                     <span className="text-[var(--text-muted)] block mb-1">CONNECTION</span>
                     <span className="text-[var(--text-primary)] font-semibold">{selectedComp.gpio}</span>
                   </div>
                   <div>
                     <span className="text-[var(--text-muted)] block mb-1">POWER</span>
                     <span className="text-[var(--text-primary)]">{selectedComp.voltage}</span>
                   </div>
                   <div>
                     <span className="text-[var(--text-muted)] block mb-1">STATUS</span>
                     <span className="text-[var(--state-normal)]">{selectedComp.status}</span>
                   </div>
                   <div>
                     <span className="text-[var(--text-muted)] block mb-1">READING</span>
                     <span className="text-[var(--accent-amber)] text-sm">{selectedComp.latestValue}</span>
                   </div>
                 </div>
               </div>
             )}
           </div>
        </div>
      </section>

      {/* 02 THE PROBLEM */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-technical">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono text-[var(--accent-amber)] tracking-widest uppercase block mb-2">
              02 // THE PROBLEM
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--text-primary)] mb-4">
              Sensor data can fail without the physical world failing.
            </h2>
            <p className="text-sm font-sans text-[var(--text-muted)] leading-relaxed">
              In industrial telemetry, automated controls often make dangerous assumptions: that raw digital readings reflect objective ground truth. In reality, physical sensors suffer electrical noise, acoustic multipath, capacitive drift, and register lockups while the monitored system is completely unchanged.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Offset Drift',
                badge: 'SLOW BIAS',
                desc: 'Gradual calibration wander caused by thermal dissipation or aging capacitive substrate, producing false trends.'
              },
              {
                title: 'Sudden Spikes',
                badge: 'MULTIPATH',
                desc: 'Acoustic reflections or transient inductive voltage drops that inject single-frame 200cm jumps without device displacement.'
              },
              {
                title: 'Increased Noise',
                badge: 'DEGRADED SNR',
                desc: 'Ground loops or RF interference on unshielded jumper wires elevating high-frequency variance above baseline.'
              },
              {
                title: 'Frozen Values',
                badge: 'ADC LOCKUP',
                desc: 'Microcontroller register stall or repeated buffer cache where variance drops to absolute zero while ambient conditions change.'
              },
              {
                title: 'Intermittent Dropout',
                badge: 'TIMEOUT',
                desc: 'Acoustic pulse absorption or loose breadboard jumpers returning zero-duration echo or 1-Wire parity corruption.'
              },
              {
                title: 'Cross-Signal Deception',
                badge: 'UNILATERAL TRIP',
                desc: 'A single sensor triggering a system-wide emergency halt while adjacent inertial and thermal sensors confirm stationary stability.'
              }
            ].map((item, i) => (
              <div key={i} className="bg-[var(--bg-secondary)] border border-technical rounded p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-technical">
                      {item.badge}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-muted)]">0{i+1}</span>
                  </div>
                  <h3 className="font-mono text-base font-semibold text-[var(--text-primary)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* 03 THE PHYSICAL SYSTEM */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-technical bg-[var(--bg-secondary)]/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-mono text-[var(--accent-amber)] tracking-widest uppercase block mb-2">
                03 // THE PHYSICAL HARDWARE
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-[var(--text-primary)]">
                Instrumentation Rig & Pin Specification
              </h2>
            </div>
            <Link
              href="/system"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--accent-amber)] hover:underline"
            >
              <span>INSPECT INTERACTIVE 3D RIG</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'ESP32 Module',
                role: 'Compute Node & Gateway',
                pins: 'GPIO 4, 5, 18, 22, 23, 32',
                spec: '240 MHz Dual Core / 802.11 b/g/n',
                voltage: '3.3V Logic Bus'
              },
              {
                name: 'DHT11 Sensor',
                role: 'Thermal & Relative Humidity',
                pins: 'DATA → GPIO 4',
                spec: '0–50°C (±2°C), 20–90% RH (±5%)',
                voltage: '3.3V Power'
              },
              {
                name: 'JSN-SR04T Sensor',
                role: 'Waterproof Ultrasonic Sounding',
                pins: 'TRIG → GPIO 5 | ECHO → GPIO 18*',
                spec: '20–450 cm Envelope / 40 kHz Pulse',
                voltage: '5.0V VCC (Level Shifted)'
              },
              {
                name: 'Actuators & Phone IMU',
                role: 'LEDs, Buzzer & Inertial Frame',
                pins: 'LEDs: 32/22 | BUZ: 23 | IMU: Frame',
                spec: 'Buzzer PWM @ 2.4kHz / 6-Axis Accelerometer',
                voltage: 'Direct Active Drive'
              },
              {
                name: 'BMP280 Sensor',
                role: 'Barometric Pressure & Temp',
                pins: 'I2C: SDA 21 / SCL 22',
                spec: '300-1100 hPa (±1 hPa)',
                voltage: '3.3V Logic'
              },
              {
                name: 'Photoresistor (LDR)',
                role: 'Ambient Light Intensity',
                pins: 'AOUT → GPIO 34 (ADC)',
                spec: 'Analog Resistance (10kΩ divider)',
                voltage: '3.3V Logic'
              }
            ].map((hw, idx) => (
              <div key={idx} className="bg-[var(--bg-secondary)] border border-technical rounded p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[var(--accent-amber)] block mb-1">
                    0{idx+1} // METROLOGY UNIT
                  </span>
                  <h4 className="font-display text-lg text-[var(--text-primary)] mb-1">
                    {hw.name}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mb-3">{hw.role}</p>
                </div>
                <div className="pt-3 border-t border-technical/60 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">ROUTING:</span>
                    <span className="text-[var(--text-primary)] font-medium">{hw.pins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">SIGNAL:</span>
                    <span className="text-[var(--text-secondary)]">{hw.spec}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">RAIL:</span>
                    <span className="text-[var(--accent-cyan)]">{hw.voltage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded bg-[var(--bg-tertiary)] border border-technical flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--state-watch)] shrink-0 mt-0.5" />
            <div className="text-xs font-mono text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">ELECTRICAL SAFETY NOTE:</strong> The JSN-SR04T operates from a 5V VCC rail and outputs a 5V logic echo pulse. Connecting this directly to an ESP32 3.3V GPIO pin will degrade or destroy the internal protection diodes. Our architecture places a fast resistive voltage divider / 74LVC level shifter between ECHO and GPIO 18.
            </div>
          </div>
        </div>
      </section>


      {/* 04 HOW TRUST IS EVALUATED */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-technical">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono text-[var(--accent-amber)] tracking-widest uppercase block mb-2">
              04 // METROLOGY PIPELINE
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--text-primary)] mb-4">
              How Trust is Evaluated: Sense to Explain
            </h2>
            <p className="text-sm font-sans text-[var(--text-muted)] leading-relaxed">
              Trust is not an arbitrary machine-learning score. It is a deterministic, multi-stage statistical audit grounded in physical law and cross-sensor corroboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                name: 'SENSE',
                title: 'High-Rate Acquisition',
                desc: 'ESP32 ingests raw pulses and serial packets from GPIO 4, 5, 18 with microsecond timestamping.'
              },
              {
                step: '02',
                name: 'CHECK',
                title: 'Physical Bounds & Z-Score',
                desc: 'Telemetry is checked against hardware envelopes (20-450cm) and rolling baseline distribution (μ, σ).'
              },
              {
                step: '03',
                name: 'CORRELATE',
                title: 'Cross-Sensor Verification',
                desc: 'Ultrasonic step changes are cross-referenced with phone IMU accelerometer vectors to detect device movement vs. sensor error.'
              },
              {
                step: '04',
                name: 'ASSESS',
                title: '0–100% Trust Scoring',
                desc: 'Multi-factor penalization maps signal health into Normal (90-100), Watch (70-89), Degraded (40-69), or Untrusted (0-39).'
              },
              {
                step: '05',
                name: 'EXPLAIN',
                title: 'Plain-English Dossier',
                desc: 'Deterministic generation of human-readable evidence points explaining why a reading was or was not trusted.'
              }
            ].map((p, idx) => (
              <div key={idx} className="bg-[var(--bg-secondary)] border border-technical rounded p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs font-mono">
                    <span className="text-[var(--accent-amber)] font-bold">{p.step}</span>
                    <span className="text-[var(--text-muted)] tracking-wider">{p.name}</span>
                  </div>
                  <h4 className="font-mono text-sm font-semibold text-[var(--text-primary)] mb-2">
                    {p.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* 05 LIVE SYSTEM PREVIEW & FAULT LAB PREVIEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-technical bg-[var(--bg-secondary)]/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-5">
            <span className="text-xs font-mono text-[var(--accent-amber)] tracking-widest uppercase block mb-2">
              05 & 06 // LIVE PREVIEW & FAULT LAB
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--text-primary)] mb-4">
              Real-time Instrumentation & Fault Injection
            </h2>
            <p className="text-sm font-sans text-[var(--text-muted)] leading-relaxed mb-6">
              Test how the anomaly engine instantly detects sudden distance spikes, frozen register lockups, and thermal drifts. Observe trust score penalization and plain-English diagnosis dossiers live.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--state-normal)]" />
                <span>Zero opaque black-box machine learning models</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--state-normal)]" />
                <span>Deterministic Z-score + rolling persistence filters</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--state-normal)]" />
                <span>Hardware-agnostic telemetry abstraction layer</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/fault-lab"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[var(--accent-amber)] text-[var(--bg-primary)] text-xs font-mono font-semibold tracking-wider hover:opacity-90"
              >
                <span>OPEN FAULT LAB</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/analysis"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[var(--bg-secondary)] border border-technical text-[var(--text-primary)] text-xs font-mono tracking-wider hover:bg-[var(--bg-tertiary)]"
              >
                <span>VIEW ANOMALY DOSSIER</span>
              </Link>
            </div>
          </div>

          {/* Interactive Live Cards Preview */}
          <div className="lg:col-span-7 bg-[var(--bg-secondary)] border border-technical rounded-lg p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-technical text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--state-normal)] animate-pulse" />
                <span className="text-[var(--text-primary)] font-semibold">LIVE STREAM STATUS</span>
              </div>
              <span className="text-[var(--text-muted)]">STATION: esp32-01</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
              <div className="p-3 rounded bg-[var(--bg-tertiary)] border border-technical">
                <span className="text-[10px] font-mono text-[var(--text-muted)] block">ULTRASONIC DISTANCE</span>
                <div className="text-xl font-mono font-semibold text-[var(--text-primary)] mt-1">
                  {telemetry.distance.toFixed(1)} <span className="text-xs font-normal text-[var(--text-muted)]">cm</span>
                </div>
                <div className="text-[10px] font-mono text-[var(--state-normal)] mt-1">GPIO 18 (LEVEL SHIFTED)</div>
              </div>

              <div className="p-3 rounded bg-[var(--bg-tertiary)] border border-technical">
                <span className="text-[10px] font-mono text-[var(--text-muted)] block">TEMPERATURE (DHT11)</span>
                <div className="text-xl font-mono font-semibold text-[var(--text-primary)] mt-1">
                  {telemetry.temperature.toFixed(1)} <span className="text-xs font-normal text-[var(--text-muted)]">°C</span>
                </div>
                <div className="text-[10px] font-mono text-[var(--accent-cyan)] mt-1">GPIO 4 (1-WIRE)</div>
              </div>

              <div className="p-3 rounded bg-[var(--bg-tertiary)] border border-technical">
                <span className="text-[10px] font-mono text-[var(--text-muted)] block">SYSTEM TRUST</span>
                <div className="text-xl font-mono font-semibold text-[var(--accent-amber)] mt-1">
                  {trust.system_trust_score.toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">{trust.system_status}</div>
              </div>
            </div>

            {/* Quick Fault Trigger Buttons */}
            <div className="pt-4 border-t border-technical flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-mono text-[var(--text-muted)]">QUICK FAULT TRIGGER:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => injectFault('spike')}
                  className="px-3 py-1.5 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border border-technical text-xs font-mono text-[var(--state-watch)] hover:border-[var(--state-watch)] transition-colors"
                >
                  ⚡ Inject Spike (+238cm)
                </button>
                <button
                  onClick={() => injectFault('reset')}
                  className="px-3 py-1.5 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border border-technical text-xs font-mono text-[var(--state-normal)] hover:border-[var(--state-normal)] transition-colors"
                >
                  ↺ Reset Nominal
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* 07 ARCHITECTURE TEASER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-technical">
        <div className="max-w-7xl mx-auto text-center max-w-3xl">
          <span className="text-xs font-mono text-[var(--accent-amber)] tracking-widest uppercase block mb-2">
            07 // ARCHITECTURE OVERVIEW
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--text-primary)] mb-4">
            Unified Metrological Architecture
          </h2>
          <p className="text-sm font-sans text-[var(--text-muted)] leading-relaxed mb-8">
            From raw GPIO pulses to plain-English operator dossiers: explore the full 7-tier pipeline decoupling physical hardware from algorithmic validation.
          </p>
          <Link
            href="/architecture"
            className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-technical-strong text-xs font-mono tracking-wider text-[var(--text-primary)]"
          >
            <span>VIEW COMPLETE INTERACTIVE ARCHITECTURE</span>
            <ArrowRight className="w-4 h-4 text-[var(--accent-amber)]" />
          </Link>
        </div>
      </section>

      {/* 08 FINAL CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)]/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="font-display text-2xl sm:text-3xl text-[var(--text-primary)] mb-2">
              Ready to verify physical sensor data?
            </h3>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Connect your ESP32 hardware via Wi-Fi or run deterministic physical simulation.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/live"
              className="px-5 py-2.5 rounded bg-[var(--accent-amber)] text-[var(--bg-primary)] text-xs font-mono font-semibold tracking-wider hover:opacity-90"
            >
              LAUNCH LIVE TELEMETRY →
            </Link>
            <Link
              href="/fault-lab"
              className="px-5 py-2.5 rounded bg-[var(--bg-primary)] border border-technical text-[var(--text-primary)] text-xs font-mono tracking-wider hover:bg-[var(--bg-secondary)]"
            >
              OPEN FAULT LAB
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
