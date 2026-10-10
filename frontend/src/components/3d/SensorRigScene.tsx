'use client';

import React, { useRef, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Grid } from '@react-three/drei';
import { RotateCcw, Play, Pause } from 'lucide-react';

export interface ComponentInspectionData {
  id: string;
  name: string;
  purpose: string;
  gpio: string;
  voltage: string;
  status: string;
  latestValue: string;
}

export interface SensorRigSceneProps {
  theme?: 'dark' | 'light';
  selectedComponent?: string | null;
  onSelectComponent?: (comp: ComponentInspectionData | null) => void;
  telemetry?: {
    distance?: number;
    temperature?: number;
    humidity?: number;
    ax?: number;
    ay?: number;
    az?: number;
  };
  compact?: boolean;
}

const HARDWARE_COMPONENTS: Record<string, ComponentInspectionData> = {
  esp32: {
    id: 'esp32',
    name: 'ESP32 Microcontroller',
    purpose: 'Dual-core Tensilica Xtensa @ 240MHz, 2.4GHz Wi-Fi telemetry ingestion & GPIO scheduler',
    gpio: 'Core Bus (3.3V Logic)',
    voltage: '3.3V / 5V USB VBUS',
    status: 'ONLINE (Wi-Fi Connected)',
    latestValue: 'FreeRTOS Heap: 198 kB free'
  },
  dht11: {
    id: 'dht11',
    name: 'DHT11 Environmental Sensor',
    purpose: 'Capacitive relative humidity sensor & NTC thermistor single-wire serial stream',
    gpio: 'DATA → GPIO 4',
    voltage: '3.3V VCC',
    status: 'CONNECTED',
    latestValue: '25.3 °C / 58.4 %RH'
  },
  jsnsr04t: {
    id: 'jsnsr04t',
    name: 'JSN-SR04T Waterproof Ultrasonic',
    purpose: 'Sealed transducer for distance sounding (20cm - 450cm envelope) via transit time',
    gpio: 'TRIG → GPIO 5 | ECHO → GPIO 18 (via 5V→3.3V Level Shifter)',
    voltage: '5.0V VCC (Level Shifted to 3.3V Logic)',
    status: 'CONNECTED',
    latestValue: '74.2 cm'
  },
  green_led: {
    id: 'green_led',
    name: 'Green Telemetry Status LED',
    purpose: 'Indicates verified sensor consistency and active packet transmission',
    gpio: 'ANODE → GPIO 32 (via 330Ω Resistor)',
    voltage: '3.3V Logic',
    status: 'ACTIVE / PULSING',
    latestValue: 'State: HIGH (Normal)'
  },
  red_led: {
    id: 'red_led',
    name: 'Red Anomaly Alert LED',
    purpose: 'Actuates immediately upon statistical confidence of sensor aberration / dropout',
    gpio: 'ANODE → GPIO 22 (via 330Ω Resistor)',
    voltage: '3.3V Logic',
    status: 'STANDBY',
    latestValue: 'State: LOW (No Fault)'
  },
  buzzer: {
    id: 'buzzer',
    name: 'Piezo Acoustic Transducer (Buzzer)',
    purpose: 'Audible resonance annunciator for critical telemetry trips and hardware dropouts',
    gpio: 'CONTROL → GPIO 23',
    voltage: '3.3V / PWM',
    status: 'IDLE',
    latestValue: 'PWM: 0 Hz'
  },
  phone_imu: {
    id: 'phone_imu',
    name: 'Inertial Reference Unit (Phone IMU)',
    purpose: 'Tri-axis gravitational and jerk baseline for cross-sensor correlation with ultrasonic',
    gpio: 'Virtual Sensor Gateway (REST / WebSocket)',
    voltage: 'Internal Battery',
    status: 'SYNCHRONIZED',
    latestValue: '|a| = 0.992 g'
  },
  bmp280: {
    id: 'bmp280',
    name: 'BMP280 Barometric Pressure Sensor',
    purpose: 'Measures absolute barometric pressure and temperature',
    gpio: 'SDA → GPIO 21 | SCL → GPIO 22',
    voltage: '3.3V Logic',
    status: 'CONNECTED',
    latestValue: '1013.25 hPa'
  },
  ldr: {
    id: 'ldr',
    name: 'Photoresistor (LDR)',
    purpose: 'Analog ambient light intensity measurement',
    gpio: 'AOUT → GPIO 34 (ADC)',
    voltage: '3.3V Voltage Divider',
    status: 'CONNECTED',
    latestValue: '68% (Bright)'
  }
};

const Wire = ({ points, color }: { points: THREE.Vector3[], color: number }) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 32, 0.035, 8, false]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </mesh>
  );
};

interface HardwareNodeProps {
  id: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  children: React.ReactNode;
  setHoveredName: (name: string | null) => void;
  onSelectComponent?: (comp: ComponentInspectionData | null) => void;
}

function HardwareNode({ id, position, rotation, children, setHoveredName, onSelectComponent }: HardwareNodeProps) {
  const comp = HARDWARE_COMPONENTS[id];
  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelectComponent?.(comp);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredName(comp.name);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        setHoveredName(null);
        document.body.style.cursor = 'auto';
      }}
    >
      {children}
    </group>
  );
}

function HardwareRig({ theme, telemetry, setHoveredName, onSelectComponent }: any) {
  const isDark = theme === 'dark';
  
  const greenLedRef = useRef<THREE.MeshStandardMaterial>(null);
  const redLedRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (greenLedRef.current) {
      greenLedRef.current.emissiveIntensity = 0.6 + Math.sin(t * 4.0) * 0.25;
    }
    if (redLedRef.current) {
      if (telemetry?.distance && telemetry.distance > 150) {
        redLedRef.current.emissiveIntensity = 0.8 + Math.sin(t * 12.0) * 0.4;
      } else {
        redLedRef.current.emissiveIntensity = 0.15;
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Plate */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[9.6, 0.22, 5.8]} />
        <meshStandardMaterial color={isDark ? 0x111620 : 0xe4dec8} metalness={0.35} roughness={0.5} />
      </mesh>
      
      {/* Grid */}
      <Grid 
        position={[0, -0.02, 0]} 
        args={[9.0, 9.0]} 
        cellSize={0.5} 
        cellThickness={1} 
        cellColor={isDark ? 0x223044 : 0xcdc3ad} 
        sectionSize={1.5} 
        sectionThickness={1.5} 
        sectionColor={isDark ? 0x18202d : 0xd8ceb8} 
        fadeDistance={20} 
      />

      {/* 1. ESP32 */}
      <HardwareNode id="esp32" position={[-1.6, 0.1, 0]} setHoveredName={setHoveredName} onSelectComponent={onSelectComponent}>
        <mesh castShadow>
          <boxGeometry args={[2.4, 0.12, 3.8]} />
          <meshStandardMaterial color={isDark ? 0x16202c : 0x1e3a2f} roughness={0.35} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.12, -0.4]} castShadow>
          <boxGeometry args={[1.6, 0.15, 1.8]} />
          <meshStandardMaterial color={0xc8cdd5} metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.12, 1.8]}>
          <boxGeometry args={[0.7, 0.22, 0.6]} />
          <meshStandardMaterial color={0xd1d5db} metalness={0.9} roughness={0.2} />
        </mesh>
        {Array.from({ length: 13 }).map((_, idx) => {
          const z = -1.6 + idx * 0.26;
          return (
            <group key={idx}>
              <mesh position={[-1.08, 0.16, z]}>
                <boxGeometry args={[0.08, 0.35, 0.08]} />
                <meshStandardMaterial color={0xe5a950} metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[1.08, 0.16, z]}>
                <boxGeometry args={[0.08, 0.35, 0.08]} />
                <meshStandardMaterial color={0xe5a950} metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          );
        })}
      </HardwareNode>

      {/* 2. DHT11 */}
      <HardwareNode id="dht11" position={[2.0, 0.45, -1.4]} setHoveredName={setHoveredName} onSelectComponent={onSelectComponent}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.85, 1.5]} />
          <meshStandardMaterial color={0x1d70b8} roughness={0.4} metalness={0.1} />
        </mesh>
        {Array.from({ length: 5 }).map((_, idx) => {
          const z = -0.5 + idx * 0.25;
          return (
            <mesh key={idx} position={[0, 0.44, z]}>
              <boxGeometry args={[0.85, 0.06, 0.08]} />
              <meshStandardMaterial color={0x0c3b66} />
            </mesh>
          );
        })}
      </HardwareNode>

      {/* 3. JSN-SR04T */}
      <HardwareNode id="jsnsr04t" position={[2.4, 0.1, 1.2]} setHoveredName={setHoveredName} onSelectComponent={onSelectComponent}>
        <mesh position={[0.7, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 1.1, 32]} />
          <meshStandardMaterial color={0x3b4252} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.7, 0.4, 0.56]}>
          <circleGeometry args={[0.52, 32]} />
          <meshStandardMaterial color={0x8892b0} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[-0.6, 0.1, 0]}>
          <boxGeometry args={[1.6, 0.1, 1.4]} />
          <meshStandardMaterial color={0x1a4329} roughness={0.4} />
        </mesh>
        <mesh position={[-0.6, 0.18, 0]}>
          <boxGeometry args={[0.3, 0.08, 0.5]} />
          <meshStandardMaterial color={0x111111} />
        </mesh>
      </HardwareNode>

      {/* 4. LEDs */}
      <HardwareNode id="green_led" position={[0.2, 0.35, 1.7]} setHoveredName={setHoveredName} onSelectComponent={onSelectComponent}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial ref={greenLedRef} color={0x10b981} emissive={0x10b981} emissiveIntensity={0.75} roughness={0.2} />
        </mesh>
      </HardwareNode>
      <HardwareNode id="red_led" position={[0.7, 0.35, 1.7]} setHoveredName={setHoveredName} onSelectComponent={onSelectComponent}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial ref={redLedRef} color={0xef4444} emissive={0xef4444} emissiveIntensity={0.25} roughness={0.2} />
        </mesh>
      </HardwareNode>

      {/* 5. Buzzer */}
      <HardwareNode id="buzzer" position={[0.4, 0.26, -1.5]} setHoveredName={setHoveredName} onSelectComponent={onSelectComponent}>
        <mesh castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.5, 32]} />
          <meshStandardMaterial color={0x1f232b} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
          <meshStandardMaterial color={0x050505} />
        </mesh>
      </HardwareNode>

      {/* 6. Phone IMU */}
      <HardwareNode id="phone_imu" position={[-3.4, 0.12, 0.2]} rotation={[0, 0.12, 0]} setHoveredName={setHoveredName} onSelectComponent={onSelectComponent}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.12, 2.8]} />
          <meshStandardMaterial color={isDark ? 0x2d3748 : 0xd2d6dc} metalness={0.6} roughness={0.3} />
        </mesh>
      </HardwareNode>

      {/* 7. BMP280 */}
      <HardwareNode id="bmp280" position={[-1.0, 0.1, -1.8]} setHoveredName={setHoveredName} onSelectComponent={onSelectComponent}>
        <mesh>
          <boxGeometry args={[0.8, 0.08, 1.2]} />
          <meshStandardMaterial color={0x5a189a} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.25]} />
          <meshStandardMaterial color={0xaaaaaa} metalness={0.9} roughness={0.1} />
        </mesh>
      </HardwareNode>

      {/* 8. LDR */}
      <HardwareNode id="ldr" position={[-2.2, 0.3, -1.8]} setHoveredName={setHoveredName} onSelectComponent={onSelectComponent}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
          <meshStandardMaterial color={0xff4500} metalness={0.3} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshStandardMaterial color={0xffffff} metalness={0.5} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.1, -0.2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4]} />
          <meshStandardMaterial color={0xaaaaaa} metalness={0.8} />
        </mesh>
        <mesh position={[0.1, -0.2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4]} />
          <meshStandardMaterial color={0xaaaaaa} metalness={0.8} />
        </mesh>
      </HardwareNode>

      {/* Wires */}
      <Wire points={[new THREE.Vector3(1.5, 0.3, -1.4), new THREE.Vector3(0.5, 0.9, -1.0), new THREE.Vector3(-0.6, 0.3, -0.6)]} color={0xe5a950} />
      <Wire points={[new THREE.Vector3(1.8, 0.3, 1.0), new THREE.Vector3(0.4, 0.7, 0.8), new THREE.Vector3(-0.6, 0.3, 0.4)]} color={0x10b981} />
      <Wire points={[new THREE.Vector3(1.7, 0.3, 1.3), new THREE.Vector3(0.3, 0.8, 1.1), new THREE.Vector3(-0.6, 0.3, 0.7)]} color={0x06b6d4} />
      <Wire points={[new THREE.Vector3(0.4, 0.3, -1.3), new THREE.Vector3(-0.3, 0.7, -1.1), new THREE.Vector3(-0.6, 0.3, -0.8)]} color={0xf97316} />
      <Wire points={[new THREE.Vector3(0.2, 0.2, 1.5), new THREE.Vector3(-0.3, 0.5, 1.4), new THREE.Vector3(-0.6, 0.3, 1.0)]} color={0x94a3b8} />
      <Wire points={[new THREE.Vector3(-1.0, 0.2, -1.6), new THREE.Vector3(-1.2, 0.5, -1.0), new THREE.Vector3(-1.3, 0.2, -0.5)]} color={0x9333ea} />
      <Wire points={[new THREE.Vector3(-2.2, 0.1, -1.7), new THREE.Vector3(-2.0, 0.4, -1.0), new THREE.Vector3(-1.8, 0.2, -0.5)]} color={0xef4444} />

      {/* Shadows */}
      <ContactShadows position={[0, -0.25, 0]} opacity={0.4} scale={20} blur={2} far={4} />
    </group>
  );
}

export default function SensorRigScene({
  theme = 'dark',
  selectedComponent,
  onSelectComponent,
  telemetry,
  compact = false
}: SensorRigSceneProps) {
  const isDark = theme === 'dark';
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  
  const orbitRef = useRef<any>(null);

  const resetView = () => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  };

  return (
    <div className={`relative w-full ${compact ? 'h-[400px]' : 'h-[540px] md:h-[620px]'} overflow-hidden select-none`}>
      <Canvas
        shadows
        camera={{ position: [0, 5.5, 9.5], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={isDark ? 2.0 : 2.0} color={isDark ? '#242b35' : '#f0efe8'} />
        <directionalLight position={[6, 12, 8]} intensity={isDark ? 2.8 : 2.0} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-8, 4, -6]} intensity={isDark ? 1.5 : 1.0} color={isDark ? '#06b6d4' : '#e5a950'} />
        
        <Suspense fallback={null}>
          <HardwareRig 
            theme={theme} 
            telemetry={telemetry} 
            setHoveredName={setHoveredName} 
            onSelectComponent={onSelectComponent} 
          />
        </Suspense>

        <OrbitControls
          ref={orbitRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2 - 0.05}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
        />
      </Canvas>

      {/* Floating Hover Badge */}
      {hoveredName && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none bg-[var(--bg-secondary)]/90 backdrop-blur-md px-3 py-1.5 rounded border border-[var(--border-strong)] text-xs font-mono text-[var(--accent-amber)] animate-fadeIn">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)] mr-2 animate-ping" />
          CLICK TO INSPECT: {hoveredName}
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button 
          onClick={() => setAutoRotate(!autoRotate)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)]/90 backdrop-blur-md border border-technical rounded text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
          title={autoRotate ? "Pause Rotation" : "Auto Rotate"}
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button 
          onClick={resetView}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)]/90 backdrop-blur-md border border-technical rounded text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Technical HUD Annotation */}
      <div className="absolute bottom-3 right-4 z-10 pointer-events-none flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)] tracking-wider">
        <span>PROJECTION: ORTHOGRAPHIC OBLIQUE</span>
        <span>•</span>
        <span>SCALE: 1:1 METROLOGY</span>
        <span>•</span>
        <span className="text-[var(--state-normal)]">RENDER: R3F / WEBGL</span>
      </div>
    </div>
  );
}
