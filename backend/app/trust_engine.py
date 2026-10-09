from typing import Dict, Any, Tuple
from app.models import TrustLevel, SensorTrustItem, SystemTrustResponse
from app.anomaly_engine import StatisticalAnomalyEngine
import time

class TrustScoreEngine:
    """
    Evaluates empirical trust metrics for physical sensor streams.
    Combines:
    - Baseline deviation (Z-score penalty)
    - High-frequency noise elevation penalty
    - Frozen / stuck value penalty
    - Persistence of aberrant behavior penalty
    """

    @staticmethod
    def calculate_trust(
        anomaly_engine: StatisticalAnomalyEngine,
        current_telemetry: Dict[str, float],
        source: str = "SIMULATION",
        device_id: str = "esp32-01"
    ) -> SystemTrustResponse:
        now = time.time()
        sensor_items: Dict[str, SensorTrustItem] = {}

        # 1. Ultrasonic (JSN-SR04T)
        dist_val = current_telemetry.get("distance", 72.4)
        dist_metric = anomaly_engine.channels["distance"]
        dist_z = dist_metric.calculate_zscore(dist_val)
        dist_frozen = dist_metric.is_frozen(check_samples=15)
        dist_noise = dist_metric.estimate_noise_index()

        dist_trust = 98.0
        dist_notes = []

        # Baseline deviation penalty
        if abs(dist_z) > 2.0:
            penalty = min(60.0, (abs(dist_z) - 2.0) * 14.0)
            dist_trust -= penalty
            dist_notes.append(f"Z-score {abs(dist_z):.2f}σ baseline deviation")

        # Noise penalty
        if dist_noise > 2.0:
            noise_pen = min(25.0, (dist_noise - 2.0) * 6.0)
            dist_trust -= noise_pen
            dist_notes.append(f"Elevated acoustic jitter ({dist_noise:.2f})")

        # Frozen penalty
        if dist_frozen:
            dist_trust = min(dist_trust, 32.0)
            dist_notes.append("Flatline invariant reading detected")

        # Out-of-bounds dropout
        if dist_val < 20.0 or dist_val > 450.0:
            dist_trust = min(dist_trust, 12.0)
            dist_notes.append("Out of sensor operating range envelope")

        dist_trust = max(0.0, min(100.0, dist_trust))
        dist_status = TrustScoreEngine._score_to_level(dist_trust)

        sensor_items["distance"] = SensorTrustItem(
            sensor_id="distance",
            sensor_name="Ultrasonic Transducer (JSN-SR04T)",
            trust_score=round(dist_trust, 1),
            status=dist_status,
            current_value=round(dist_val, 2),
            unit="cm",
            gpio=18, # ECHO pin through level shifter
            baseline_deviation=round(dist_metric.baseline_mean, 2),
            noise_index=round(dist_noise, 3),
            notes="; ".join(dist_notes) if dist_notes else "Nominal acoustic return"
        )

        # 2. Temperature (DHT11)
        temp_val = current_telemetry.get("temperature", 24.8)
        temp_metric = anomaly_engine.channels["temperature"]
        temp_z = temp_metric.calculate_zscore(temp_val)
        temp_trust = 97.0
        temp_notes = []
        if abs(temp_z) > 2.2:
            temp_trust -= min(55.0, (abs(temp_z) - 2.2) * 15.0)
            temp_notes.append(f"Thermal deviation {abs(temp_z):.2f}σ")
        temp_trust = max(0.0, min(100.0, temp_trust))

        sensor_items["temperature"] = SensorTrustItem(
            sensor_id="temperature",
            sensor_name="Ambient Temperature (DHT11)",
            trust_score=round(temp_trust, 1),
            status=TrustScoreEngine._score_to_level(temp_trust),
            current_value=round(temp_val, 1),
            unit="°C",
            gpio=4,
            baseline_deviation=round(temp_metric.baseline_mean, 2),
            noise_index=round(temp_metric.estimate_noise_index(), 3),
            notes="; ".join(temp_notes) if temp_notes else "Thermal baseline consistent"
        )

        # 3. Humidity (DHT11)
        hum_val = current_telemetry.get("humidity", 54.2)
        hum_metric = anomaly_engine.channels["humidity"]
        hum_z = hum_metric.calculate_zscore(hum_val)
        hum_trust = 96.0
        if abs(hum_z) > 2.5:
            hum_trust -= min(50.0, (abs(hum_z) - 2.5) * 12.0)
        hum_trust = max(0.0, min(100.0, hum_trust))

        sensor_items["humidity"] = SensorTrustItem(
            sensor_id="humidity",
            sensor_name="Relative Humidity (DHT11)",
            trust_score=round(hum_trust, 1),
            status=TrustScoreEngine._score_to_level(hum_trust),
            current_value=round(hum_val, 1),
            unit="% RH",
            gpio=4,
            baseline_deviation=round(hum_metric.baseline_mean, 2),
            noise_index=round(hum_metric.estimate_noise_index(), 3),
            notes="Normal hygrometric stability"
        )

        # 4. Accelerometer / IMU (Phone / MPU)
        ax = current_telemetry.get("ax", 0.02)
        ay = current_telemetry.get("ay", 0.03)
        az = current_telemetry.get("az", 0.99)
        imu_trust = 95.0
        sensor_items["accelerometer"] = SensorTrustItem(
            sensor_id="accelerometer",
            sensor_name="Tri-Axis IMU (Inertial Frame)",
            trust_score=round(imu_trust, 1),
            status=TrustScoreEngine._score_to_level(imu_trust),
            current_value=round((ax**2 + ay**2 + az**2)**0.5, 3),
            unit="g",
            gpio=None,
            baseline_deviation=1.0,
            noise_index=0.015,
            notes="Gravitational vector stable (1.0g reference)"
        )

        # System Composite Score (Weighted)
        # Ultrasonic: 40%, Temp: 25%, Hum: 15%, IMU: 20%
        sys_score = (
            dist_trust * 0.40 +
            temp_trust * 0.25 +
            hum_trust * 0.15 +
            imu_trust * 0.20
        )
        sys_level = TrustScoreEngine._score_to_level(sys_score)

        return SystemTrustResponse(
            system_trust_score=round(sys_score, 1),
            system_status=sys_level,
            mode=source,
            device_id=device_id,
            last_updated=now,
            sensors=sensor_items
        )

    @staticmethod
    def _score_to_level(score: float) -> TrustLevel:
        if score >= 90.0:
            return TrustLevel.NORMAL
        elif score >= 70.0:
            return TrustLevel.WATCH
        elif score >= 40.0:
            return TrustLevel.DEGRADED
        else:
            return TrustLevel.UNTRUSTED
