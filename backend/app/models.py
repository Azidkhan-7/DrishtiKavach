from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import time

class TrustLevel(str, Enum):
    NORMAL = "NORMAL"
    WATCH = "WATCH"
    DEGRADED = "DEGRADED"
    UNTRUSTED = "UNTRUSTED"

class AnomalySeverity(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class SensorTelemetry(BaseModel):
    device_id: str = "esp32-01"
    temperature: float = Field(..., description="DHT11 temperature in Celsius")
    humidity: float = Field(..., description="DHT11 relative humidity percentage")
    distance: float = Field(..., description="JSN-SR04T ultrasonic distance in cm")
    ax: float = Field(0.0, description="Accelerometer X (g)")
    ay: float = Field(0.0, description="Accelerometer Y (g)")
    az: float = Field(1.0, description="Accelerometer Z (g)")
    source: str = Field("SIMULATION", description="LIVE_HARDWARE | SIMULATION")
    timestamp: float = Field(default_factory=time.time)

class DrishtikavachItem(BaseModel):
    sensor_id: str
    sensor_name: str
    trust_score: float # 0 to 100
    status: TrustLevel
    current_value: float
    unit: str
    gpio: Optional[int] = None
    baseline_deviation: float = 0.0
    noise_index: float = 0.0
    notes: str = ""

class SystemTrustResponse(BaseModel):
    system_trust_score: float
    system_status: TrustLevel
    mode: str # LIVE_HARDWARE | SIMULATION | STALE_DATA | DISCONNECTED
    device_id: str
    last_updated: float
    sensors: Dict[str, DrishtikavachItem]

class AnomalyEvent(BaseModel):
    event_id: str
    timestamp: float
    sensor: str # Ultrasonic, Temperature, Humidity, Accelerometer
    anomaly_type: str # Sudden spike, Offset drift, Frozen reading, Increased noise, Signal dropout
    severity: AnomalySeverity
    confidence: float # percentage 0-100
    evidence: List[str]
    assessment: str
    previous_trust: float
    new_trust: float
    raw_reading: float
    baseline_value: float

class FaultInjectionRequest(BaseModel):
    fault_type: str # "spike" | "drift" | "freeze" | "noise" | "dropout" | "reset"
    target_sensor: str = "distance" # "distance" | "temperature" | "humidity" | "imu"
    magnitude: Optional[float] = None
    duration_seconds: Optional[float] = 15.0

class DemoStepResponse(BaseModel):
    step: int
    step_name: str
    description: str
    duration_ms: int
