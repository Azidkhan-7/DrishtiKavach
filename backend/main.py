import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time

from app.models import (
    SensorTelemetry,
    SystemTrustResponse,
    FaultInjectionRequest,
    AnomalyEvent
)
from app.simulator import simulator

# Background simulator loop
async def simulation_background_worker():
    while True:
        try:
            # If in SIMULATION mode or no real hardware sent within last 6 seconds
            if simulator.mode == "SIMULATION" or (time.time() - simulator.last_hardware_ts > 6.0):
                simulator.generate_simulation_point()
        except Exception as e:
            print(f"Error in simulation loop: {e}")
        await asyncio.sleep(0.8) # 1.25 Hz nominal telemetry rate

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background telemetry generator
    task = asyncio.create_task(simulation_background_worker())
    # Prime initial 10 points
    for _ in range(12):
        simulator.generate_simulation_point()
    yield
    task.cancel()

app = FastAPI(
    title="SENSOR TRUST API",
    description="Continuous Intelligence for Physical Sensors - Telemetry & Metrology Diagnostics API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def get_health():
    return {
        "status": "HEALTHY",
        "service": "SENSOR TRUST Metrology & Diagnostics Engine",
        "version": "1.0.0",
        "mode": simulator.mode,
        "device_id": simulator.device_id,
        "active_fault": simulator.active_fault,
        "uptime_sec": time.time()
    }

@app.get("/api/latest")
def get_latest_telemetry():
    if not simulator.latest_telemetry:
        simulator.generate_simulation_point()
    return {
        "telemetry": simulator.latest_telemetry,
        "trust": simulator.latest_trust,
        "active_fault": simulator.active_fault,
        "mode": simulator.mode
    }

@app.get("/api/history")
def get_history(limit: int = 60):
    hist = list(simulator.history)
    return hist[-limit:]

@app.get("/api/events")
def get_events(limit: int = 20):
    evts = list(simulator.events)
    # Return reverse chronological order
    return evts[::-1][:limit]

@app.get("/api/trust")
def get_trust():
    if not simulator.latest_trust:
        simulator.generate_simulation_point()
    return simulator.latest_trust

@app.post("/api/telemetry")
def receive_telemetry(payload: SensorTelemetry):
    """
    Accepts incoming physical telemetry from ESP32 or external sensor gateway.
    Payload pins:
    - DHT11: GPIO 4
    - JSN-SR04T: TRIG GPIO 5, ECHO GPIO 18 (via level shifter)
    - LEDs: GPIO 32 (Green), GPIO 22 (Red)
    - Buzzer: GPIO 23
    """
    simulator.receive_hardware_telemetry(payload)
    return {
        "status": "ACCEPTED",
        "mode": "LIVE_HARDWARE",
        "device_id": payload.device_id,
        "received_at": time.time()
    }

@app.post("/api/fault")
def inject_fault(req: FaultInjectionRequest):
    """
    Controls fault injection in the stream:
    - spike: sudden ultrasonic jump (e.g. 74 cm -> 312 cm)
    - drift: continuous ramp
    - freeze: identical repeated reading (0 jitter)
    - noise: high gaussian acoustic variance
    - dropout: 0 cm / timeout
    - reset: restores nominal physical baseline
    """
    res = simulator.inject_fault(req)
    # Generate immediate point reflecting the change
    simulator.generate_simulation_point()
    return res

@app.post("/api/demo")
async def trigger_demo():
    """
    Triggers the automated 1-click demonstration sequence:
    1. Normal baseline (high trust)
    2. Inject Spike (74 cm -> 312 cm)
    3. Anomaly detected & trust drops to ~48%
    4. Plain-English reasoning displayed
    5. Return to normal & gradual recovery
    """
    if simulator.demo_active:
        return {"status": "ALREADY_RUNNING", "message": "Demo sequence currently in progress."}

    asyncio.create_task(simulator.run_demo_sequence())
    return {
        "status": "INITIATED",
        "message": "Demo sequence started. Observe Live Telemetry and Fault Lab."
    }

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = {
                "telemetry": simulator.latest_telemetry.model_dump() if simulator.latest_telemetry else None,
                "trust": simulator.latest_trust,
                "active_fault": simulator.active_fault,
                "mode": simulator.mode,
                "timestamp": time.time()
            }
            await websocket.send_json(data)
            await asyncio.sleep(0.75) # 1.33 Hz push rate
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket client disconnected: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
