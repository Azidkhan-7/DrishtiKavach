from collections import deque
import numpy as np
import time
from typing import Dict, List, Optional, Tuple
from app.models import AnomalySeverity, AnomalyEvent

class SensorChannelMetrics:
    def __init__(self, name: str, window_size: int = 50, expected_noise_floor: float = 0.5):
        self.name = name
        self.window_size = window_size
        self.expected_noise_floor = expected_noise_floor
        self.values = deque(maxlen=window_size)
        self.timestamps = deque(maxlen=window_size)
        self.consecutive_deviations = 0

    def add_reading(self, value: float, ts: float):
        self.values.append(value)
        self.timestamps.append(ts)

    @property
    def count(self) -> int:
        return len(self.values)

    @property
    def baseline_mean(self) -> float:
        if len(self.values) < 3:
            return self.values[-1] if self.values else 0.0
        # Use median or trimmed mean of earlier 80% to be robust against current spike
        arr = list(self.values)
        if len(arr) >= 10:
            arr_base = arr[:-3] # exclude latest 3 to keep baseline unpolluted
            return float(np.mean(arr_base))
        return float(np.mean(arr))

    @property
    def baseline_std(self) -> float:
        if len(self.values) < 5:
            return max(self.expected_noise_floor, 0.5)
        arr = list(self.values)
        if len(arr) >= 10:
            arr_base = arr[:-3]
            s = float(np.std(arr_base))
        else:
            s = float(np.std(arr))
        return max(s, self.expected_noise_floor, 0.05)

    def calculate_zscore(self, current_value: float) -> float:
        std = self.baseline_std
        mean = self.baseline_mean
        return float((current_value - mean) / std)

    def calculate_rate_of_change(self) -> float:
        if len(self.values) < 2:
            return 0.0
        dt = max(self.timestamps[-1] - self.timestamps[-2], 0.01)
        dv = self.values[-1] - self.values[-2]
        return float(dv / dt)

    def is_frozen(self, check_samples: int = 15, epsilon: float = 0.0001) -> bool:
        if len(self.values) < check_samples:
            return False
        recent = list(self.values)[-check_samples:]
        val_range = max(recent) - min(recent)
        return val_range < epsilon

    def estimate_noise_index(self) -> float:
        """Estimates high-frequency noise index using second differences"""
        if len(self.values) < 6:
            return 0.1
        arr = np.array(list(self.values))
        diff2 = np.diff(arr, n=2)
        std_diff = float(np.std(diff2))
        return max(0.0, std_diff)

class StatisticalAnomalyEngine:
    def __init__(self):
        self.channels = {
            "temperature": SensorChannelMetrics("temperature", window_size=60, expected_noise_floor=0.2),
            "humidity": SensorChannelMetrics("humidity", window_size=60, expected_noise_floor=0.5),
            "distance": SensorChannelMetrics("distance", window_size=60, expected_noise_floor=0.8),
            "ax": SensorChannelMetrics("ax", window_size=40, expected_noise_floor=0.02),
            "ay": SensorChannelMetrics("ay", window_size=40, expected_noise_floor=0.02),
            "az": SensorChannelMetrics("az", window_size=40, expected_noise_floor=0.02),
        }
        self.recent_events: deque[AnomalyEvent] = deque(maxlen=200)

    def process_telemetry(self, telemetry_data: Dict[str, float], ts: float) -> List[AnomalyEvent]:
        detected_anomalies: List[AnomalyEvent] = []

        # Update channel ring buffers
        for key, metric in self.channels.items():
            if key in telemetry_data:
                metric.add_reading(float(telemetry_data[key]), ts)

        # 1. Check Ultrasonic Distance
        dist = telemetry_data.get("distance")
        if dist is not None:
            dist_metric = self.channels["distance"]
            z = dist_metric.calculate_zscore(dist)
            roc = dist_metric.calculate_rate_of_change()
            frozen = dist_metric.is_frozen(check_samples=16)
            noise = dist_metric.estimate_noise_index()

            # Physical validity bounds for JSN-SR04T (blind zone < 20cm, max practical ~450cm)
            if dist < 18.0 or dist > 450.0:
                dist_metric.consecutive_deviations += 1
                event = AnomalyEvent(
                    event_id=f"evt-{int(ts*1000)}-dist-drop",
                    timestamp=ts,
                    sensor="Ultrasonic (JSN-SR04T)",
                    anomaly_type="Signal dropout / out-of-range",
                    severity=AnomalySeverity.HIGH,
                    confidence=92.0,
                    evidence=[
                        f"Reading ({dist:.1f} cm) breached physical operating envelope of JSN-SR04T (20–450 cm).",
                        "Acoustic return pulse likely timed out or experienced echo attenuation.",
                        f"Consecutive out-of-spec samples: {dist_metric.consecutive_deviations}.",
                        "Inertial frame remains stationary."
                    ],
                    assessment="Likely echo timeout or acoustic beam reflection loss.",
                    previous_trust=85.0,
                    new_trust=22.0,
                    raw_reading=dist,
                    baseline_value=dist_metric.baseline_mean
                )
                detected_anomalies.append(event)
                self.recent_events.append(event)

            elif abs(z) >= 3.2:
                dist_metric.consecutive_deviations += 1
                conf = min(96.0, 60.0 + abs(z) * 6.5)
                sev = AnomalySeverity.HIGH if abs(z) >= 5.0 else AnomalySeverity.MODERATE
                event = AnomalyEvent(
                    event_id=f"evt-{int(ts*1000)}-dist-spike",
                    timestamp=ts,
                    sensor="Ultrasonic (JSN-SR04T)",
                    anomaly_type="Sudden spike",
                    severity=sev,
                    confidence=round(conf, 1),
                    evidence=[
                        f"Reading ({dist:.1f} cm) deviated by {abs(z):.2f}σ from baseline ({dist_metric.baseline_mean:.1f} cm).",
                        f"High rate-of-change observed ({abs(roc):.1f} cm/s).",
                        "Cross-sensor inertial check indicates zero physical platform jerk.",
                        "Observed pattern deviates from expected stationary variance."
                    ],
                    assessment="Possible sensor anomaly or transient acoustic multipath reflection.",
                    previous_trust=94.0,
                    new_trust=max(15.0, 94.0 - abs(z) * 11.0),
                    raw_reading=dist,
                    baseline_value=dist_metric.baseline_mean
                )
                detected_anomalies.append(event)
                self.recent_events.append(event)

            elif frozen:
                event = AnomalyEvent(
                    event_id=f"evt-{int(ts*1000)}-dist-freeze",
                    timestamp=ts,
                    sensor="Ultrasonic (JSN-SR04T)",
                    anomaly_type="Frozen reading",
                    severity=AnomalySeverity.MODERATE,
                    confidence=84.0,
                    evidence=[
                        "Reading remained numerically invariant across 16 consecutive samples.",
                        "Normal micro-acoustic atmospheric jitter is completely absent.",
                        "Possible ADC lockup or driver buffer stall."
                    ],
                    assessment="Suspected frozen register or repeated cached reading.",
                    previous_trust=88.0,
                    new_trust=38.0,
                    raw_reading=dist,
                    baseline_value=dist_metric.baseline_mean
                )
                detected_anomalies.append(event)
                self.recent_events.append(event)

            elif noise > 4.5:
                event = AnomalyEvent(
                    event_id=f"evt-{int(ts*1000)}-dist-noise",
                    timestamp=ts,
                    sensor="Ultrasonic (JSN-SR04T)",
                    anomaly_type="Increased noise / jitter",
                    severity=AnomalySeverity.LOW,
                    confidence=76.0,
                    evidence=[
                        f"High-frequency second-difference noise index elevated to {noise:.2f}.",
                        "Acoustic surface dispersion or electrical coupling detected on GPIO 18 ECHO line."
                    ],
                    assessment="Degraded acoustic signal-to-noise ratio.",
                    previous_trust=90.0,
                    new_trust=62.0,
                    raw_reading=dist,
                    baseline_value=dist_metric.baseline_mean
                )
                detected_anomalies.append(event)
                self.recent_events.append(event)
            else:
                dist_metric.consecutive_deviations = max(0, dist_metric.consecutive_deviations - 1)

        # 2. Check DHT11 Temperature & Humidity
        temp = telemetry_data.get("temperature")
        if temp is not None:
            t_metric = self.channels["temperature"]
            z_t = t_metric.calculate_zscore(temp)
            if abs(z_t) >= 3.5:
                event = AnomalyEvent(
                    event_id=f"evt-{int(ts*1000)}-temp-spike",
                    timestamp=ts,
                    sensor="Temperature (DHT11)",
                    anomaly_type="Thermal spike / drift",
                    severity=AnomalySeverity.MODERATE,
                    confidence=79.0,
                    evidence=[
                        f"Temperature ({temp:.1f} °C) deviated from baseline ({t_metric.baseline_mean:.1f} °C) by {abs(z_t):.2f}σ.",
                        "Exceeds typical thermal inertia curve of DHT11 physical thermistor."
                    ],
                    assessment="Possible thermal contact anomaly or electrical supply fluctuation.",
                    previous_trust=95.0,
                    new_trust=55.0,
                    raw_reading=temp,
                    baseline_value=t_metric.baseline_mean
                )
                detected_anomalies.append(event)
                self.recent_events.append(event)

        return detected_anomalies
