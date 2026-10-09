import math
from typing import Dict, Any, Tuple

class CrossSensorCorrelator:
    """
    Correlates multiple physical sensor channels to establish plausible physical causality.
    Distinguishes sensor artifacts from genuine physical environmental events.
    """

    @staticmethod
    def evaluate_distance_vs_motion(
        delta_distance: float,
        ax: float,
        ay: float,
        az: float,
        prev_ax: float = 0.0,
        prev_ay: float = 0.0,
        prev_az: float = 1.0
    ) -> Dict[str, Any]:
        """
        Evaluates whether an ultrasonic delta is physically corroborated by accelerometer motion.
        """
        accel_mag = math.sqrt(ax*ax + ay*ay + az*az)
        prev_accel_mag = math.sqrt(prev_ax*prev_ax + prev_ay*prev_ay + prev_az*prev_az)
        accel_jerk = abs(accel_mag - prev_accel_mag)

        is_stationary = accel_jerk < 0.08 and abs(accel_mag - 1.0) < 0.12
        is_large_distance_change = abs(delta_distance) > 15.0 # cm

        if is_large_distance_change and is_stationary:
            return {
                "corroborated": False,
                "confidence_of_sensor_fault": 0.88,
                "reasoning": (
                    f"Distance shifted by {delta_distance:+.1f} cm while tri-axis IMU indicated "
                    f"the platform remained completely stationary (|a|={accel_mag:.2f}g, jerk={accel_jerk:.3f}g). "
                    "Incongruent with physical sensor displacement."
                ),
                "finding": "ACOUSTIC_ANOMALY_CONFIRMED"
            }
        elif is_large_distance_change and not is_stationary:
            return {
                "corroborated": True,
                "confidence_of_sensor_fault": 0.25,
                "reasoning": (
                    f"Distance delta ({delta_distance:+.1f} cm) accompanied by physical inertial acceleration "
                    f"(|a|={accel_mag:.2f}g). Reading likely reflects actual physical displacement of sensor rig."
                ),
                "finding": "PHYSICAL_MOTION_CORROBORATED"
            }
        else:
            return {
                "corroborated": True,
                "confidence_of_sensor_fault": 0.05,
                "reasoning": "Distance variation and inertial readings remain within nominal ambient envelopes.",
                "finding": "NOMINAL_STABILITY"
            }

    @staticmethod
    def evaluate_temperature_humidity_coherence(
        temp: float,
        humidity: float,
        baseline_temp: float,
        baseline_humidity: float
    ) -> Dict[str, Any]:
        delta_t = temp - baseline_temp
        delta_h = humidity - baseline_humidity

        # If temperature spikes drastically (>6 deg C) but humidity doesn't shift, flag thermistor anomaly
        if abs(delta_t) > 6.0 and abs(delta_h) < 1.0:
            return {
                "coherent": False,
                "finding": "THERMAL_DISCONNECT",
                "reasoning": (
                    f"Temperature shifted by {delta_t:+.1f}°C abruptly without concurrent psychrometric "
                    f"humidity change ({delta_h:+.1f}% RH). Typical of single-wire DHT11 packet glitch."
                )
            }
        return {
            "coherent": True,
            "finding": "COHERENT_ENVIRONMENT",
            "reasoning": "Thermal and hygrometric telemetry track plausible environmental bounds."
        }
