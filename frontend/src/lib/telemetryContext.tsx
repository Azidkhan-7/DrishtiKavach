'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { TelemetryPoint, SystemTrustState, AnomalyEventItem } from './types';

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

const BACKEND_BASE = 'http://127.0.0.1:8000';
const WS_BASE = 'ws://127.0.0.1:8000/ws/telemetry';

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [telemetry, setTelemetry] = useState<TelemetryPoint>(DEFAULT_TELEMETRY);
  const [trust, setTrust] = useState<SystemTrustState>(DEFAULT_TRUST);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [events, setEvents] = useState<AnomalyEventItem[]>([]);
  const [activeFault, setActiveFault] = useState<string | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const wsRef = useRef<WebSocket | null>(null);

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
    try {
      const [latestRes, histRes, evtsRes] = await Promise.all([
        fetch(`${BACKEND_BASE}/api/latest`),
        fetch(`${BACKEND_BASE}/api/history?limit=40`),
        fetch(`${BACKEND_BASE}/api/events?limit=15`)
      ]);

      if (latestRes.ok) {
        const lData = await latestRes.json();
        if (lData.telemetry) setTelemetry(lData.telemetry);
        if (lData.trust) setTrust(lData.trust);
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
      // Backend not yet reachable - fallback to simulated local ticks
      simulateLocalTick();
    }
  }, []);

  // Local tick fallback
  const simulateLocalTick = useCallback(() => {
    setTelemetry(prev => {
      const jitter = (Math.random() - 0.5) * 0.4;
      const newDist = Math.max(20, Math.min(400, prev.distance + jitter));
      const pt: TelemetryPoint = {
        ...prev,
        distance: Number(newDist.toFixed(2)),
        temperature: Number((25.3 + Math.sin(Date.now() / 20000) * 0.3).toFixed(2)),
        humidity: Number((58.4 + Math.cos(Date.now() / 25000) * 0.5).toFixed(2)),
        timestamp: Date.now() / 1000
      };
      setHistory(h => [...h.slice(-39), pt]);
      return pt;
    });
  }, []);

  // Setup WebSocket connection with automatic reconnect
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;

    const connectWs = () => {
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
              setTelemetry(data.telemetry);
              setHistory(h => [...h.slice(-39), data.telemetry]);
            }
            if (data.trust) {
              setTrust(data.trust);
            }
            setActiveFault(data.active_fault || null);
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        reconnectTimer = setTimeout(connectWs, 3000);
      }
    };

    connectWs();
    fetchState();

    // Periodic events fetch
    const pollInterval = setInterval(() => {
      fetch(`${BACKEND_BASE}/api/events?limit=15`)
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setEvents(d); })
        .catch(() => {});
    }, 2500);

    return () => {
      clearTimeout(reconnectTimer);
      clearInterval(pollInterval);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchState]);

  const injectFault = useCallback(async (faultType: string, targetSensor = 'distance', magnitude?: number) => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fault_type: faultType,
          target_sensor: targetSensor,
          magnitude: magnitude ?? (faultType === 'spike' ? 238.0 : undefined),
          duration_seconds: 15.0
        })
      });
      if (res.ok) {
        setActiveFault(faultType);
        fetchState();
      }
    } catch {
      // Local fallback for offline mode
      setActiveFault(faultType);
    }
  }, [fetchState]);

  const resetFaults = useCallback(async () => {
    try {
      await fetch(`${BACKEND_BASE}/api/fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fault_type: 'reset' })
      });
      setActiveFault(null);
      fetchState();
    } catch {
      setActiveFault(null);
    }
  }, [fetchState]);

  const runDemo = useCallback(async () => {
    setIsDemoRunning(true);
    try {
      await fetch(`${BACKEND_BASE}/api/demo`, { method: 'POST' });
    } catch {
      // Offline fallback sequence
      await injectFault('reset');
      setTimeout(async () => {
        await injectFault('spike', 'distance', 238);
        setTimeout(async () => {
          await injectFault('reset');
          setIsDemoRunning(false);
        }, 5000);
      }, 3000);
      return;
    }

    setTimeout(() => {
      setIsDemoRunning(false);
      fetchState();
    }, 12000);
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
