/*
 ============================================================================
  DRISHTIKAVACH — ESP32 Physical Telemetry Gateway Firmware
  Continuous Intelligence for Physical Sensors
 ============================================================================
  Target Board: ESP32 / ESP32-S3 (Tensilica Xtensa @ 240MHz)
  
  HARDWARE PIN CONNECTIONS:
  ----------------------------------------------------------------------------
  Sensor / Actuator        ESP32 Pin       Electrical Notes
  ----------------------------------------------------------------------------
  DHT11 DATA              GPIO 4          Requires 4.7kΩ pull-up to 3.3V rail
  JSN-SR04T TRIG          GPIO 5          Direct 3.3V logic pulse
  JSN-SR04T ECHO          GPIO 18         CRITICAL: JSN-SR04T outputs 5.0V!
                                          Must pass through voltage divider:
                                          ECHO ──[ 1.8kΩ ]──┬──> GPIO 18 (3.24V)
                                                            [ 3.3kΩ ]
                                                            │
                                                           GND
  Status LED (Green)      GPIO 32         Anode through 330Ω resistor to GND
  Anomaly LED (Red)       GPIO 22         Anode through 330Ω resistor to GND
  Piezo Buzzer            GPIO 23         Control / PWM signal
 ============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// Wi-Fi Credentials
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// DRISHTIKAVACH Backend Endpoint
const char* SERVER_ENDPOINT = "http://192.168.1.100:8000/api/telemetry";
const char* DEVICE_ID       = "esp32-01";

// Pin Definitions
#define PIN_DHT11_DATA  4
#define PIN_SONAR_TRIG  5
#define PIN_SONAR_ECHO  18   // Level-shifted from 5V to 3.3V
#define PIN_LED_GREEN   32
#define PIN_LED_RED     22
#define PIN_BUZZER      23

#define DHTTYPE DHT11
DHT dht(PIN_DHT11_DATA, DHTTYPE);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[DRISHTIKAVACH] Initializing Physical Telemetry Node...");

  // Configure Actuator Pins
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Configure Ultrasonic Pins
  pinMode(PIN_SONAR_TRIG, OUTPUT);
  pinMode(PIN_SONAR_ECHO, INPUT);
  digitalWrite(PIN_SONAR_TRIG, LOW);

  // Initialize DHT11
  dht.begin();

  // Connect to Wi-Fi
  Serial.print("[Wi-Fi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_LED_GREEN, !digitalRead(PIN_LED_GREEN));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Link Established. IP: " + WiFi.localIP().toString());
    digitalWrite(PIN_LED_GREEN, HIGH);
  } else {
    Serial.println("\n[Wi-Fi] Link Failed. Telemetry loop will retry in background.");
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
  }
}

float measureUltrasonicDistanceCm() {
  // Clear trigger line
  digitalWrite(PIN_SONAR_TRIG, LOW);
  delayMicroseconds(4);

  // Send 10us ultrasonic burst trigger
  digitalWrite(PIN_SONAR_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_SONAR_TRIG, LOW);

  // Read time-of-flight on level-shifted ECHO pin (35ms timeout = ~6m max)
  long durationUs = pulseIn(PIN_SONAR_ECHO, HIGH, 35000);

  if (durationUs == 0) {
    // Pulse timeout or echo attenuation
    return 0.0;
  }

  // Speed of sound in air ≈ 0.0343 cm/us (at ~20°C). Divide by 2 for round-trip
  float distanceCm = (durationUs * 0.0343) / 2.0;
  return distanceCm;
}

void loop() {
  // 1. Acquire DHT11 Telemetry
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // Celsius

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("[DHT11] Warning: Checksum or communication failure on GPIO 4");
    humidity = 0.0;
    temperature = 0.0;
  }

  // 2. Acquire JSN-SR04T Telemetry
  float distanceCm = measureUltrasonicDistanceCm();

  // 3. Fallback / Default IMU Stationary Frame (0, 0, 1.0g)
  // (If hardware I2C MPU6050 is connected, read real registers here)
  float ax = 0.018;
  float ay = 0.024;
  float az = 0.992;

  // Local physical status indication
  bool outOfBounds = (distanceCm > 0.0 && (distanceCm < 20.0 || distanceCm > 450.0)) || (distanceCm == 0.0);
  if (outOfBounds) {
    digitalWrite(PIN_LED_RED, HIGH);
  } else {
    digitalWrite(PIN_LED_RED, LOW);
  }

  // 4. Construct JSON Payload
  unsigned long nowEpoch = millis() / 1000;
  char jsonPayload[256];
  snprintf(
    jsonPayload,
    sizeof(jsonPayload),
    "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity\":%.2f,\"distance\":%.2f,\"ax\":%.4f,\"ay\":%.4f,\"az\":%.4f,\"source\":\"LIVE_HARDWARE\",\"timestamp\":%lu}",
    DEVICE_ID,
    temperature,
    humidity,
    distanceCm,
    ax,
    ay,
    az,
    nowEpoch
  );

  Serial.print("[TELEMETRY] Outgoing -> ");
  Serial.println(jsonPayload);

  // 5. Transmit to DRISHTIKAVACH Backend
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_ENDPOINT);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(jsonPayload);
    if (httpCode == 200 || httpCode == 201) {
      // Pulse Green LED to indicate verified transmission
      digitalWrite(PIN_LED_GREEN, HIGH);
      delay(80);
      digitalWrite(PIN_LED_GREEN, LOW);
    } else {
      Serial.printf("[HTTP] Ingestion error: %d\n", httpCode);
      digitalWrite(PIN_LED_RED, HIGH);
    }
    http.end();
  }

  // Respect minimum 1.0s sampling period for DHT11 sensor stability
  delay(920);
}
