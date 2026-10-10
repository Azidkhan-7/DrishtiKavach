'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { TelemetryPoint, SystemTrustState, AnomalyEventItem } from './types';
import { LocalFault, simulateTelemetry } from './localSimulation';

interface TelemetryContextValue {
  telemetry: TelemetryPoint;
  trust: SystemTrustState;
  history: TelemetryPoint[];
  events: AnomalyEventItem[];
  activeFault: string | null;
  isDemoRunning: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  injectFault: (faultType: string, targetSensor?: string, magnitude?: number) => Promise<void>;
  runDemo: () => Promise<void>;
  resetFaults: () => Promise<void>;
}

const DEFAULT_TELEMETRY: TelemetryPoint = {
  device_id: 'esp32-01',
  temperature: 25.4,
  humidity: 58.6,
  distance: 74.2,
  ax: 0.02,
  ay: 0.03,
  az: 0.99,
  source: 'SIMULATION',
  timestamp: 1720000000,
  trust_score: 96.5,
  trust_level: 'NORMAL'
};

const DEFAULT_TRUST: SystemTrustState = {
  system_trust_score: 96.5,
  system_status: 'NORMAL',
  mode: 'SIMULATION',
  device_id: 'esp32-01',
  last_updated: 1720000000,
  sensors: {
    distance: {
      sensor_id: 'distance',
      sensor_name: 'Ultrasonic (JSN-SR04T)',
      trust_score: 97.2,
      status: 'NORMAL',
      current_value: 74.2,
      unit: 'cm',
      gpio: 18,
      baseline_deviation: 74.0,
      noise_index: 0.45,
      notes: 'Nominal acoustic return'
    },
    temperature: {
      sensor_id: 'temperature',
      sensor_name: 'Temperature (DHT11)',
      trust_score: 96.8,
      status: 'NORMAL',
      current_value: 25.4,
      unit: '°C',
      gpio: 4,
      baseline_deviation: 25.2,
      noise_index: 0.12,
      notes: 'Thermal baseline consistent'
    },
    humidity: {
      sensor_id: 'humidity',
      sensor_name: 'Humidity (DHT11)',
      trust_score: 95.9,
      status: 'NORMAL',
      current_value: 58.6,
      unit: '% RH',
      gpio: 4,
      baseline_deviation: 58.0,
      noise_index: 0.22,
      notes: 'Normal hygrometric stability'
    },
    accelerometer: {
      sensor_id: 'accelerometer',
      sensor_name: 'Tri-Axis IMU (Phone/MPU)',
      trust_score: 96.0,
      status: 'NORMAL',
      current_value: 0.995,
      unit: 'g',
      gpio: null,
      baseline_deviation: 1.0,
      noise_index: 0.012,
      notes: 'Gravitational vector stable (1.0g)'
    }
  }
};

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? (BACKEND_BASE ? `${BACKEND_BASE.replace(/^http/, 'ws')}/ws/telemetry` : '');

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [telemetry, setTelemetry] = useState<TelemetryPoint>(DEFAULT_TELEMETRY);
  const [trust, setTrust] = useState<SystemTrustState>(DEFAULT_TRUST);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [events, setEvents] = useState<AnomalyEventItem[]>([]);
  const [activeFault, setActiveFault] = useState<string | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const wsRef = useRef<WebSocket | null>(null);
  const telemetryRef = useRef(DEFAULT_TELEMETRY);
  const trustRef = useRef(DEFAULT_TRUST);
  const localFaultRef = useRef<LocalFault | null>(null);
  const usingBackendRef = useRef(false);
  const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Sync theme to HTML class
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Fetch initial history and events
  const fetchState = useCallback(async () => {
    if (!BACKEND_BASE) return;
    try {
      const [latestRes, histRes, evtsRes] = await Promise.all([
        fetch(`${BACKEND_BASE}/api/latest`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${BACKEND_BASE}/api/history?limit=40`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${BACKEND_BASE}/api/events?limit=15`, { signal: AbortSignal.timeout(5000) })
      ]);

      if (!latestRes.ok) throw new Error('Telemetry backend unavailable');
      if (latestRes.ok) {
        const lData = await latestRes.json();
        if (!lData.telemetry || !lData.trust) throw new Error('Invalid telemetry response');
        telemetryRef.current = lData.telemetry;
        trustRef.current = lData.trust;
        setTelemetry(lData.telemetry);
        setTrust(lData.trust);
        usingBackendRef.current = true;
        localFaultRef.current = null;
        setActiveFault(lData.active_fault || null);
      }
      if (histRes.ok) {
        const hData = await histRes.json();
        setHistory(hData);
      }
      if (evtsRes.ok) {
        const eData = await evtsRes.json();
        setEvents(eData);
      }
    } catch {
      usingBackendRef.current = false;
    }
  }, []);

  // Local tick fallback
  const simulateLocalTick = useCallback(() => {
    const snapshot = simulateTelemetry(telemetryRef.current, trustRef.current, localFaultRef.current);
    telemetryRef.current = snapshot.telemetry;
    trustRef.current = snapshot.trust;
    if (!snapshot.activeFault) localFaultRef.current = null;
    setTelemetry(snapshot.telemetry);
    setTrust(snapshot.trust);
    setActiveFault(snapshot.activeFault);
    setHistory(previous => [...previous.slice(-39), snapshot.telemetry]);
  }, []);

  // Setup WebSocket connection with automatic reconnect
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let disposed = false;

    const connectWs = () => {
      if (disposed || !WS_BASE) return;
      try {
        const ws = new WebSocket(WS_BASE);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[SENSOR TRUST] WebSocket telemetry stream linked.');
        };

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.telemetry) {
              usingBackendRef.current = true;
              localFaultRef.current = null;
              telemetryRef.current = data.telemetry;
              setTelemetry(data.telemetry);
              setHistory(h => [...h.slice(-39), data.telemetry]);
            }
            if (data.trust) {
              trustRef.current = data.trust;
              setTrust(data.trust);
            }
            setActiveFault(data.active_fault || null);
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

        ws.onclose = () => {
          usingBackendRef.current = false;
          if (!disposed) reconnectTimer = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        if (!disposed) reconnectTimer = setTimeout(connectWs, 3000);
      }
    };

    connectWs();
    const initialTimer = setTimeout(() => {
      simulateLocalTick();
      fetchState();
    }, 0);

    // Periodic events fetch
    const pollInterval = setInterval(fetchState, 2500);
    const simulationInterval = setInterval(() => {
      if (!usingBackendRef.current) simulateLocalTick();
    }, 750);

    return () => {
      disposed = true;
      clearTimeout(initialTimer);
      clearTimeout(reconnectTimer);
      clearInterval(pollInterval);
      clearInterval(simulationInterval);
      demoTimersRef.current.forEach(clearTimeout);
      demoTimersRef.current = [];
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchState, simulateLocalTick]);

  const injectFault = useCallback(async (faultType: string, targetSensor = 'distance', magnitude?: number) => {
    try {
      if (!BACKEND_BASE) throw new Error('Browser simulation enabled');
      const res = await fetch(`${BACKEND_BASE}/api/fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          fault_type: faultType,
          target_sensor: targetSensor,
          magnitude: magnitude ?? (faultType === 'spike' ? 238.0 : undefined),
          duration_seconds: 15.0
        })
      });
      if (!res.ok) throw new Error('Fault injection unavailable');
      if (res.ok) {
        setActiveFault(faultType);
        fetchState();
      }
    } catch {
      usingBackendRef.current = false;
      const timestamp = Date.now() / 1000;
      const previousTrust = trustRef.current.sensors.distance.trust_score;
      localFaultRef.current = faultType === 'reset' ? null : {
        type: faultType,
        startedAt: timestamp,
        expiresAt: timestamp + 15,
        magnitude: magnitude ?? 238,
        frozenValue: telemetryRef.current.distance,
      };
      simulateLocalTick();
      if (faultType !== 'reset') {
        const event: AnomalyEventItem = {
          event_id: crypto.randomUUID(),
          timestamp,
          sensor: 'Ultrasonic (JSN-SR04T)',
          anomaly_type: faultType,
          severity: faultType === 'dropout' ? 'CRITICAL' : 'HIGH',
          confidence: 100,
          evidence: [`Browser simulation injected a ${faultType} fault; no hardware reading was used.`],
          assessment: 'Simulated distance anomaly. The stationary IMU provides an independent reference.',
          previous_trust: previousTrust,
          new_trust: trustRef.current.sensors.distance.trust_score,
          raw_reading: telemetryRef.current.distance,
          baseline_value: 74.2,
        };
        setEvents(previous => [event, ...previous].slice(0, 20));
      }
    }
  }, [fetchState, simulateLocalTick]);

  const resetFaults = useCallback(async () => {
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
    setIsDemoRunning(false);
    await injectFault('reset');
  }, [injectFault]);

  const runDemo = useCallback(async () => {
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
    setIsDemoRunning(true);
    try {
      if (!BACKEND_BASE) throw new Error('Browser simulation enabled');
      const response = await fetch(`${BACKEND_BASE}/api/demo`, { method: 'POST', signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('Demo backend unavailable');
    } catch {
      // Offline fallback sequence
      await injectFault('reset');
      demoTimersRef.current.push(setTimeout(async () => {
        await injectFault('spike', 'distance', 238);
        demoTimersRef.current.push(setTimeout(async () => {
          await injectFault('reset');
          setIsDemoRunning(false);
        }, 5000));
      }, 3000));
      return;
    }

    demoTimersRef.current.push(setTimeout(() => {
      setIsDemoRunning(false);
      fetchState();
    }, 12000));
  }, [injectFault, fetchState]);

  return (
    <TelemetryContext.Provider
      value={{
        telemetry,
        trust,
        history,
        events,
        activeFault,
        isDemoRunning,
        theme,
        toggleTheme,
        injectFault,
        runDemo,
        resetFaults
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used within a TelemetryProvider');
  return ctx;
}
