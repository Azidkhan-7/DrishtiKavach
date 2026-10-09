import asyncio
import math
import random
import time
from collections import deque
from typing import Dict, Any, List, Optional
from app.models import SensorTelemetry, AnomalyEvent, FaultInjectionRequest
from app.anomaly_engine import StatisticalAnomalyEngine
from app.trust_engine import TrustScoreEngine
from app.cross_sensor import CrossSensorCorrelator

class TelemetrySimulator:
    def __init__(self):
        self.anomaly_engine = StatisticalAnomalyEngine()
        self.history: deque[Dict[str, Any]] = deque(maxlen=200)
        self.events: deque[AnomalyEvent] = deque(maxlen=100)

        # Baseline physical state
        self.base_distance = 74.2
        self.base_temp = 25.3
        self.base_hum = 58.4
        self.base_ax = 0.02
        self.base_ay = 0.03
        self.base_az = 0.99

        # Active fault state
        self.active_fault: Optional[str] = None
        self.fault_expiry: float = 0.0
        self.fault_magnitude: float = 0.0
        self.fault_frozen_val: Optional[float] = None
        self.fault_drift_accumulator: float = 0.0

        # Mode and hardware state
        self.mode = "SIMULATION" # "SIMULATION" | "LIVE_HARDWARE"
        self.last_hardware_ts: float = 0.0
        self.device_id = "esp32-01"

        # Demo sequence state
        self.demo_active = False
        self.demo_step = 0

        # Latest computed telemetry & trust
        self.latest_telemetry: Optional[SensorTelemetry] = None
        self.latest_trust: Optional[Dict[str, Any]] = None

    def inject_fault(self, req: FaultInjectionRequest):
        if req.fault_type == "reset":
            self.active_fault = None
            self.fault_expiry = 0.0
            self.fault_frozen_val = None
            self.fault_drift_accumulator = 0.0
            return {"status": "reset", "message": "All injected faults cleared."}

        self.active_fault = req.fault_type
        self.fault_expiry = time.time() + (req.duration_seconds or 15.0)
        self.fault_magnitude = req.magnitude if req.magnitude is not None else 238.0
        self.fault_drift_accumulator = 0.0

        if req.fault_type == "freeze":
            self.fault_frozen_val = self.base_distance + random.uniform(-0.5, 0.5)

        return {
            "status": "injected",
            "fault_type": req.fault_type,
            "target": req.target_sensor,
            "duration": req.duration_seconds
        }

    def receive_hardware_telemetry(self, t: SensorTelemetry):
        self.mode = "LIVE_HARDWARE"
        self.last_hardware_ts = time.time()
        self.device_id = t.device_id
        t.source = "LIVE_HARDWARE"
        self._process_point(t)

    def generate_simulation_point(self) -> SensorTelemetry:
        now = time.time()

        # Check fault expiry
        if self.active_fault and now > self.fault_expiry:
            self.active_fault = None
            self.fault_frozen_val = None
            self.fault_drift_accumulator = 0.0

        # Natural slow ambient fluctuation
        time_sec = now
        temp_wander = math.sin(time_sec / 45.0) * 0.4
        hum_wander = -math.cos(time_sec / 50.0) * 0.8
        dist_wander = math.sin(time_sec / 30.0) * 0.3

        curr_temp = self.base_temp + temp_wander + random.gauss(0, 0.08)
        curr_hum = self.base_hum + hum_wander + random.gauss(0, 0.15)
        curr_dist = self.base_distance + dist_wander + random.gauss(0, 0.25)

        # Baseline IMU stationary with subtle micro-tremor
        ax = self.base_ax + random.gauss(0, 0.008)
        ay = self.base_ay + random.gauss(0, 0.008)
        az = self.base_az + random.gauss(0, 0.006)

        # Apply active faults
        if self.active_fault == "spike":
            curr_dist += self.fault_magnitude # 74.2 -> 312.2 cm
            # IMU remains stationary to test cross-sensor reasoning!

        elif self.active_fault == "drift":
            self.fault_drift_accumulator += 0.85
            curr_dist += self.fault_drift_accumulator

        elif self.active_fault == "freeze":
            if self.fault_frozen_val is not None:
                curr_dist = self.fault_frozen_val # Exact identical value without variance

        elif self.active_fault == "noise":
            curr_dist += random.gauss(0, 18.5)

        elif self.active_fault == "dropout":
            curr_dist = 0.0 # Timeout / zero-pulse echo

        t = SensorTelemetry(
            device_id=self.device_id,
            temperature=round(curr_temp, 2),
            humidity=round(curr_hum, 2),
            distance=round(curr_dist, 2),
            ax=round(ax, 4),
            ay=round(ay, 4),
            az=round(az, 4),
            source="SIMULATION",
            timestamp=now
        )
        self._process_point(t)
        return t

    def _process_point(self, t: SensorTelemetry):
        ts = t.timestamp
        raw_dict = {
            "temperature": t.temperature,
            "humidity": t.humidity,
            "distance": t.distance,
            "ax": t.ax,
            "ay": t.ay,
            "az": t.az
        }

        # 1. Run statistical anomaly detection
        anomalies = self.anomaly_engine.process_telemetry(raw_dict, ts)

        # 2. Run cross-sensor reasoning
        if len(self.history) >= 2:
            prev = self.history[-1]
            delta_dist = t.distance - prev["distance"]
            correl = CrossSensorCorrelator.evaluate_distance_vs_motion(
                delta_distance=delta_dist,
                ax=t.ax, ay=t.ay, az=t.az,
                prev_ax=prev["ax"], prev_ay=prev["ay"], prev_az=prev["az"]
            )
            # Augment anomaly evidence with cross-sensor conclusion
            for anom in anomalies:
                if "Ultrasonic" in anom.sensor and correl["finding"] == "ACOUSTIC_ANOMALY_CONFIRMED":
                    anom.evidence.append(f"Cross-sensor check: {correl['reasoning']}")

        # 3. Compute trust scores
        current_mode = self.mode
        if self.mode == "LIVE_HARDWARE" and (time.time() - self.last_hardware_ts > 6.0):
            current_mode = "STALE_DATA"

        trust_resp = TrustScoreEngine.calculate_trust(
            self.anomaly_engine,
            raw_dict,
            source=current_mode,
            device_id=self.device_id
        )

        # 4. Store latest point in ring buffer
        self.latest_telemetry = t
        self.latest_trust = trust_resp.model_dump()
        record = {
            **t.model_dump(),
            "trust_score": trust_resp.system_trust_score,
            "trust_level": trust_resp.system_status.value,
            "has_anomaly": len(anomalies) > 0,
            "anomaly_type": anomalies[0].anomaly_type if anomalies else None
        }
        self.history.append(record)

        for a in anomalies:
            self.events.append(a)

    async def run_demo_sequence(self):
        """
        Executes a 12-second automated demo sequence:
        1. Normal baseline (high trust ~96%)
        2. Spike injection (312 cm) -> Anomaly detected -> Trust drops to ~48%
        3. Recovery back to normal -> Trust restores
        """
        self.demo_active = True
        try:
            # Step 1: Normal state for 3 seconds
            self.inject_fault(FaultInjectionRequest(fault_type="reset"))
            await asyncio.sleep(3.0)

            # Step 2: Inject Sudden Ultrasonic Spike (74cm -> 312cm)
            self.inject_fault(FaultInjectionRequest(
                fault_type="spike",
                target_sensor="distance",
                magnitude=238.0,
                duration_seconds=5.0
            ))
            await asyncio.sleep(5.0)

            # Step 3: Return to normal and let baseline recover
            self.inject_fault(FaultInjectionRequest(fault_type="reset"))
            await asyncio.sleep(4.0)

        finally:
            self.demo_active = False

# Global singleton
simulator = TelemetrySimulator()
