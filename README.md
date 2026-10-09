# SENSOR TRUST
> **Tagline:** *"Continuous intelligence for physical sensors."*
> **Core Architecture:** `SENSE → CHECK → CORRELATE → ASSESS → EXPLAIN`

---

## 1. Overview

**SENSOR TRUST** is a production-quality metrological instrumentation platform engineered to evaluate the empirical veracity of physical sensor data. Rather than assuming digital sensor packets represent ground truth, SENSOR TRUST continuously monitors data streams to detect:
- **Offset Drift**: Thermal dissipation or capacitive aging.
- **Sudden Spikes**: Acoustic multipath reflections or transient inductive glitches.
- **Increased Noise**: Degraded SNR from ground loops or unshielded jumpers.
- **Frozen Readings**: ADC register lockups and driver cache stalls ($0\sigma$ variance).
- **Intermittent Dropouts**: Zero-pulse echo returns or single-wire CRC parity corruptions.
- **Cross-Signal Incongruence**: Unilateral sensor spikes contradicted by inertial stillness.

Built with an industrial, scientific editorial aesthetic inspired by laboratory instrumentation and metrological research journals, SENSOR TRUST replaces opaque "black-box" machine learning with a **transparent statistical anomaly engine** and **plain-English diagnostic dossiers**.

---

## 2. Hardware Pin Reference & Level Shifting

| Component | Physical Pin / Line | ESP32 GPIO | Electrical Specification & Wiring Notes |
| :--- | :--- | :--- | :--- |
| **DHT11** | `DATA` | **GPIO 4** | 3.3V Logic. Requires a **4.7kΩ pull-up resistor** to 3.3V rail. Min 1.0s sampling interval. |
| **JSN-SR04T** | `TRIG` | **GPIO 5** | Direct 3.3V logic trigger pulse (10µs). |
| **JSN-SR04T** | `ECHO` | **GPIO 18** | **CRITICAL SAFETY NOTE**: JSN-SR04T requires 5.0V VCC and outputs a 5.0V echo square wave. Connecting this directly to the ESP32 GPIO will damage silicon diodes. You **must** route the signal through a level-shifting voltage divider: |
| | | | `JSN-SR04T ECHO (5V) ──[ 1.8kΩ ]──┬──> ESP32 GPIO 18 (3.24V)`<br>`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ 3.3kΩ ]`<br>`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│`<br>`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;GND` |
| **Status LED (Green)** | `ANODE` | **GPIO 32** | 3.3V Logic. Series 330Ω current limiting resistor. Pulses upon valid telemetry ingestion. |
| **Anomaly LED (Red)** | `ANODE` | **GPIO 22** | 3.3V Logic. Series 330Ω current limiting resistor. Trips when trust score degrades. |
| **Piezo Buzzer** | `SIGNAL` | **GPIO 23** | 3.3V Logic. High-frequency acoustic annunciator. |
| **Phone IMU** | Virtual Gateway | *N/A* | 6-Axis accelerometer ($a_x, a_y, a_z$) providing 1.0g gravitational inertial reference. |

---

## 3. The 5-Stage Verification Pipeline

```
┌─────────┐      ┌─────────┐      ┌─────────────┐      ┌──────────┐      ┌───────────┐
│  SENSE  │ ───> │  CHECK  │ ───> │  CORRELATE  │ ───> │  ASSESS  │ ───> │  EXPLAIN  │
└─────────┘      └─────────┘      └─────────────┘      └──────────┘      └───────────┘
 1.25Hz GPIO      Bounds (20-      Cross-Sensor         0–100% Trust       Plain-English
 Ingestion        450cm) & Z-      Inertial Check:      Penalization:      4-Point
 Buffer           Score (|z|>3.2)  IMU vs. Sonar        Normal/Watch/...   Evidence Dossier
```

1. **SENSE**: Dual-core ESP32 or continuous physical simulator captures floating-point telemetry with microsecond timestamps.
2. **CHECK**: Statistical channel metrics evaluate rolling baseline ($\mu, \sigma$), dynamic $Z$-score ($z = \frac{x - \mu}{\sigma}$), rate-of-change velocity, high-frequency second-difference noise index, and zero-variance stuck register detection.
3. **CORRELATE**: Compares ultrasonic distance shifts against accelerometer magnitude ($|\mathbf{a}| = \sqrt{a_x^2 + a_y^2 + a_z^2}$). If distance jumps by 200cm while $|\mathbf{a}| \approx 1.0\text{g}$ with zero jerk, the system confirms an acoustic multipath anomaly rather than physical platform displacement.
4. **ASSESS**: Computes a multi-factor 0–100% Trust Score with heuristic classification bands:
   - `NORMAL`: **90% – 100%**
   - `WATCH`: **70% – 89%**
   - `DEGRADED`: **40% – 69%**
   - `UNTRUSTED`: **0% – 39%**
5. **EXPLAIN**: Translates statistical deviations into plain-English evidence dossiers with confidence ratings and responsible engineering caveats (no opaque AI buzzwords).

---

## 4. Quick Start: Running the MVP

### Prerequisites
- Python 3.10+ (with `fastapi`, `uvicorn`, `numpy`, `pydantic`)
- Node.js 18+ & npm

### Starting the Backend (FastAPI)
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### Starting the Frontend (Next.js)
```bash
cd frontend
npm install
npm run build
npm run start -- -p 3001
# Or for live hot-reload development:
npm run dev -- -p 3001
```
- Web Application: `http://localhost:3001`

---

## 5. Major Views & Routes

- **`/` (Overview)**: Cinematic editorial hero with interactive 3D digital twin of the hardware rig, The Problem breakdown, Sense-to-Explain pipeline, and live preview.
- **`/system` (Hardware Explorer)**: 3D CAD visualization with component raycast selector, pinout inspector, electrical schematics, and level-shifting circuit diagrams.
- **`/live` (Live Instrumentation)**: High-density metrology dashboard with real-time SVG sparkline charts, trust score breakdown gauges, and channel health tables.
- **`/analysis` (Anomaly Workspace)**: Diagnostic dossiers with plain-English evidence points, confidence ratings, and chronological event timeline.
- **`/fault-lab` (Interactive Fault Lab)**: Controls for `[ Inject Spike ]`, `[ Simulate Drift ]`, `[ Freeze Reading ]`, `[ Add Noise ]`, and `[ Simulate Dropout ]`, complete with live before/after reaction telemetry.
- **`/architecture` (System Topology)**: Interactive 8-tier full-stack block diagram tracing data flow from physical air transducers to operator UI.

---

## 6. Simulation vs. Live Hardware Mode

The frontend automatically detects whether real hardware or simulation telemetry is active:
- **`SIMULATION`**: Active when no physical ESP32 is transmitting. Generates realistic physics with micro-jitter, thermal inertia, and responds immediately to fault injection controls.
- **`LIVE HARDWARE`**: Automatically engaged the moment an ESP32 POSTs to `/api/telemetry`.
- **`STALE DATA`**: Triggered if no hardware frame is received within 6.0 seconds.

---

## 7. Connecting Real ESP32 Hardware

1. Open `firmware/sensor_trust_esp32.ino` in the Arduino IDE or PlatformIO.
2. Update your Wi-Fi credentials:
   ```cpp
   const char* WIFI_SSID     = "Your_SSID";
   const char* WIFI_PASSWORD = "Your_Password";
   ```
3. Set your server endpoint IP (e.g. `http://192.168.1.100:8000/api/telemetry`).
4. Wire the hardware according to the table in Section 2 (ensuring the voltage divider is on GPIO 18).
5. Flash the firmware. The ESP32 will immediately begin streaming real telemetry to the platform.

### Telemetry Payload Format (`POST /api/telemetry`)
```json
{
  "device_id": "esp32-01",
  "temperature": 25.4,
  "humidity": 58.2,
  "distance": 74.2,
  "ax": 0.018,
  "ay": 0.024,
  "az": 0.992,
  "source": "LIVE_HARDWARE",
  "timestamp": 1720000000
}
```

---

## 8. API Endpoints

- `GET /api/health`: Subsystem health, active mode, fault state, and uptime.
- `GET /api/latest`: Most recent telemetry frame and computed trust metrics.
- `GET /api/history?limit=60`: Rolling time-series history ring buffer.
- `GET /api/events?limit=20`: Chronological anomaly event dossiers.
- `GET /api/trust`: Detailed channel-by-channel trust score breakdown.
- `POST /api/telemetry`: Ingestion endpoint for ESP32 hardware packets.
- `POST /api/fault`: Injects simulated faults (`spike`, `drift`, `freeze`, `noise`, `dropout`, `reset`).
- `POST /api/demo`: Triggers the automated 1-click 12-second hackathon demonstration sequence.
- `WebSocket /ws/telemetry`: High-frequency (1.25 Hz) continuous streaming socket.

---

## 9. Future ML & Deep Learning Integration Points

The modular engine (`backend/app/anomaly_engine.py`) exposes clean hooks to swap or augment the statistical kernel with advanced models:
1. **Isolation Forest**: Ingesting high-dimensional vectors $(\Delta d, \Delta T, |\mathbf{a}|)$.
2. **One-Class SVM**: Modeling nonlinear nominal manifold envelopes.
3. **Autoencoder Reconstruction Loss**: High-frequency temporal vibration anomaly detection.
4. **Bayesian State Estimation / Kalman Filters**: Optimal sensor fusion across redundant distance channels.
