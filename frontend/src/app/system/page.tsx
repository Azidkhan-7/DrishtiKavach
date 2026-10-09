'use client';

import React, { useState } from 'react';
import SensorRigScene, { ComponentInspectionData } from '@/components/3d/SensorRigScene';
import { useTelemetry } from '@/lib/telemetryContext';
import { Cpu, ShieldCheck, Zap, AlertTriangle, Layers, Radio, Activity, CheckCircle2 } from 'lucide-react';

const HARDWARE_CATALOG: ComponentInspectionData[] = [
  {
    id: 'esp32',
    name: 'ESP32-S3 Microcontroller',
    purpose: 'Dual-core Tensilica Xtensa LX7 @ 240MHz, 512KB SRAM. Ingests raw GPIO interrupts and dispatches Wi-Fi telemetry frames.',
    gpio: 'Core Bus (3.3V Logic Levels)',
    voltage: '3.3V VCC / 5V USB VBUS',
    status: 'ONLINE (Wi-Fi 802.11 b/g/n)',
    latestValue: 'FreeRTOS Heap: 198 kB free'
  },
  {
    id: 'dht11',
    name: 'DHT11 Environmental Sensor',
    purpose: 'Measures ambient dry-bulb temperature (NTC thermistor) and relative humidity (resistive polymer substrate).',
    gpio: 'DATA → GPIO 4 (1-Wire Serial with 4.7kΩ Pull-Up)',
    voltage: '3.3V VCC (Nominal)',
    status: 'CONNECTED',
    latestValue: '25.3 °C / 58.4 %RH'
  },
  {
    id: 'jsnsr04t',
    name: 'JSN-SR04T Waterproof Ultrasonic Transducer',
    purpose: '40 kHz sealed acoustic sounding transducer. Measures time-of-flight for distance (20 cm to 450 cm envelope).',
    gpio: 'TRIG → GPIO 5 | ECHO → GPIO 18 (via 5V→3.3V Level Shifter)',
    voltage: '5.0V VCC (External 5V rail required)',
    status: 'CONNECTED',
    latestValue: '74.2 cm'
  },
  {
    id: 'green_led',
    name: 'System Status LED (Green)',
    purpose: 'Actuates in real-time to signal nominal telemetry packet arrival and verified baseline consistency.',
    gpio: 'ANODE → GPIO 32 (via 330Ω Current Limiter)',
    voltage: '3.3V Logic Output',
    status: 'ACTIVE / PULSING',
    latestValue: 'Digital State: HIGH'
  },
  {
    id: 'red_led',
    name: 'Anomaly Indicator LED (Red)',
    purpose: 'Trips immediately when statistical confidence exceeds detection threshold or when sensor dropout occurs.',
    gpio: 'ANODE → GPIO 22 (via 330Ω Current Limiter)',
    voltage: '3.3V Logic Output',
    status: 'STANDBY',
    latestValue: 'Digital State: LOW'
  },
  {
    id: 'buzzer',
    name: 'Piezo Acoustic Annunciator (Buzzer)',
    purpose: 'High-frequency resonance transducer for audible alert on persistent signal aberration or zero-pulse echo.',
    gpio: 'SIGNAL → GPIO 23 (PWM / Square wave drive)',
    voltage: '3.3V Logic Output',
    status: 'IDLE',
    latestValue: 'Frequency: 0 Hz'
  },
  {
    id: 'phone_imu',
    name: 'Inertial Reference Unit (Phone IMU)',
    purpose: 'Tri-axis gravitational and jerk baseline for cross-sensor correlation with ultrasonic acoustic shifts.',
    gpio: 'Virtual Sensor Gateway (REST / WebSocket)',
    voltage: 'Internal Battery',
    status: 'SYNCHRONIZED',
    latestValue: '|a| = 0.995 g'
  },
  {
    id: 'bmp280',
    name: 'BMP280 Barometric Pressure Sensor',
    purpose: 'Measures absolute barometric pressure and temperature to correct ultrasonic time-of-flight acoustic drift.',
    gpio: 'SDA → GPIO 21 | SCL → GPIO 22',
    voltage: '3.3V Logic',
    status: 'CONNECTED',
    latestValue: '1013.25 hPa'
  },
  {
    id: 'ldr',
    name: 'Photoresistor (LDR)',
    purpose: 'Analog ambient light intensity measurement for detecting physical tampering or enclosure breaches.',
    gpio: 'AOUT → GPIO 34 (ADC with 10kΩ divider)',
    voltage: '3.3V Voltage Divider',
    status: 'CONNECTED',
    latestValue: '68% (Bright)'
  }
];

export default function SystemPage() {
  const { telemetry, theme } = useTelemetry();
  const [selectedComp, setSelectedComp] = useState<ComponentInspectionData>(HARDWARE_CATALOG[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Header */}
      <div className="border-b border-technical pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-amber)] uppercase tracking-wider mb-2">
          <span>01 // PHYSICAL SYSTEM EXPLORER</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-[var(--text-primary)] mb-3">
          Hardware Rig & Wiring Specification
        </h1>
        <p className="text-sm font-sans text-[var(--text-muted)] max-w-2xl leading-relaxed">
          Interactive digital twin of the laboratory instrumentation assembly. Click any hardware component to inspect GPIO pin bindings, electrical interfaces, and real-time register states.
        </p>
      </div>

      {/* Main Grid: 3D Scene + Component Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Left: 3D Scene */}
        <div className="lg:col-span-8 bg-[var(--bg-secondary)] border border-technical rounded-lg p-2 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-technical text-[10px] font-mono text-[var(--text-muted)]">
            <span className="text-[var(--state-normal)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--state-normal)] animate-ping" />
              VIEWPORT: 3D CAD VISUALIZER (THREE.JS)
            </span>
            <span>CLICK TO FOCUS COMPONENT</span>
          </div>
          
          <SensorRigScene
            theme={theme}
            selectedComponent={selectedComp.id}
            onSelectComponent={(c) => c && setSelectedComp(c)}
            telemetry={telemetry}
            compact={false}
          />
        </div>

        {/* Right: Selected Component Detailed Dossier */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-[var(--bg-secondary)] border border-technical rounded-lg p-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-technical text-xs font-mono">
              <span className="text-[var(--accent-amber)] uppercase font-semibold">SELECTED NODE</span>
              <span className="text-[var(--text-muted)]">ID: {selectedComp.id}</span>
            </div>

            <h3 className="font-display text-2xl text-[var(--text-primary)] mt-4 mb-2">
              {selectedComp.name}
            </h3>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
              {selectedComp.purpose}
            </p>

            <div className="space-y-4 pt-4 border-t border-technical/60 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">ELECTRICAL PIN / BUS</span>
                <span className="text-[var(--text-primary)] font-semibold">{selectedComp.gpio}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">POWER ENVELOPE</span>
                <span className="text-[var(--accent-cyan)]">{selectedComp.voltage}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">SUBSYSTEM STATUS</span>
                <span className="text-[var(--state-normal)]">{selectedComp.status}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">LIVE TELEMETRY</span>
                <span className="text-[var(--accent-amber)] font-medium">{selectedComp.latestValue}</span>
              </div>
            </div>
          </div>

          {/* Quick Component Switcher Pills */}
          <div className="mt-8 pt-4 border-t border-technical">
            <span className="text-[10px] font-mono text-[var(--text-muted)] block mb-2">QUICK SELECT:</span>
            <div className="flex flex-wrap gap-1.5">
              {HARDWARE_CATALOG.map((hw) => (
                <button
                  key={hw.id}
                  onClick={() => setSelectedComp(hw)}
                  className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                    selectedComp.id === hw.id
                      ? 'bg-[var(--accent-amber)] text-[var(--bg-primary)] border-[var(--accent-amber)] font-semibold'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-technical hover:text-[var(--text-primary)]'
                  }`}
                >
                  {hw.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Schematic Notes & Level Shifting Critical Warning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-technical">
        
        <div className="p-6 rounded bg-[var(--bg-secondary)] border border-technical">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--state-watch)] mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold uppercase">LEVEL SHIFTING ARCHITECTURE (GPIO 18)</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
            The JSN-SR04T waterproof ultrasonic module is powered from a 5.0V VCC rail to provide sufficient acoustic drive to its piezo transducer. Consequently, its ECHO pin produces a 5.0V square-wave pulse. Connecting a 5.0V signal directly to an ESP32 GPIO pin exceeds its absolute maximum input voltage (3.6V) and will degrade the silicon over time.
          </p>
          <div className="p-3 rounded bg-[var(--bg-tertiary)] border border-technical font-mono text-[11px] text-[var(--text-primary)]">
            <code>
              JSN-SR04T ECHO (5V) ──[ 1.8kΩ ]──┬──&gt; ESP32 GPIO 18 (3.24V max)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ 3.3kΩ ]<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;GND (Common Ground)
            </code>
          </div>
        </div>

        <div className="p-6 rounded bg-[var(--bg-secondary)] border border-technical">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-cyan)] mb-3">
            <Layers className="w-4 h-4" />
            <span className="font-semibold uppercase">1-WIRE PROTOCOL (DHT11 GPIO 4)</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
            The DHT11 uses an asynchronous single-bus bidirectionally timed pulse protocol. The ESP32 pulls the DATA line low for 18ms to initiate a capture, followed by a 40-bit transmission from the sensor (16-bit humidity, 16-bit temperature, 8-bit CRC checksum).
          </p>
          <ul className="text-xs font-mono text-[var(--text-secondary)] space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--state-normal)]" />
              <span>4.7kΩ pull-up resistor required between DATA and 3.3V rail.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--state-normal)]" />
              <span>Minimum 1.0s sampling interval respected to prevent self-heating.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--state-normal)]" />
              <span>Checksum bit verified before sending to statistical anomaly buffer.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
}
