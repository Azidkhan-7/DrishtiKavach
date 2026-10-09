'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface ComponentInspectionData {
  id: string;
  name: string;
  purpose: string;
  gpio: string;
  voltage: string;
  status: string;
  latestValue: string;
}

interface SensorRigSceneProps {
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

export default function SensorRigScene({
  theme = 'dark',
  selectedComponent,
  onSelectComponent,
  telemetry,
  compact = false
}: SensorRigSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const isDark = theme === 'dark';
    scene.background = null; // transparent to blend with CSS grid background

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 5.5, 9.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting (Engineering Lab lighting)
    const ambientLight = new THREE.AmbientLight(isDark ? 0x242b35 : 0xf0efe8, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 2.8 : 2.0);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(isDark ? 0x06b6d4 : 0xe5a950, isDark ? 1.5 : 1.0);
    rimLight.position.set(-8, 4, -6);
    scene.add(rimLight);

    // 3. Hardware Rig Group
    const rigGroup = new THREE.Group();
    scene.add(rigGroup);

    const interactiveObjects: THREE.Object3D[] = [];

    // Helper to register interactive object
    const registerMesh = (mesh: THREE.Object3D, compId: string) => {
      mesh.userData = { compId };
      interactiveObjects.push(mesh);
    };

    // --- Base Breadboard / Aluminum Mounting Plate ---
    const plateGeo = new THREE.BoxGeometry(9.6, 0.22, 5.8);
    const plateMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x111620 : 0xe4dec8,
      metalness: 0.35,
      roughness: 0.5
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = -0.15;
    plate.receiveShadow = true;
    rigGroup.add(plate);

    // Grid markings on the mounting plate
    const gridHelper = new THREE.GridHelper(9.0, 18, isDark ? 0x223044 : 0xcdc3ad, isDark ? 0x18202d : 0xd8ceb8);
    gridHelper.position.y = -0.02;
    rigGroup.add(gridHelper);

    // --- 1. ESP32-S3 Microcontroller Module ---
    const esp32Group = new THREE.Group();
    esp32Group.position.set(-1.6, 0.1, 0);

    // PCB
    const espPcbGeo = new THREE.BoxGeometry(2.4, 0.12, 3.8);
    const espPcbMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x16202c : 0x1e3a2f,
      roughness: 0.35,
      metalness: 0.2
    });
    const espPcb = new THREE.Mesh(espPcbGeo, espPcbMat);
    espPcb.castShadow = true;
    esp32Group.add(espPcb);

    // Metal RF Shield Can
    const shieldGeo = new THREE.BoxGeometry(1.6, 0.15, 1.8);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xc8cdd5,
      metalness: 0.85,
      roughness: 0.2
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(0, 0.12, -0.4);
    shield.castShadow = true;
    esp32Group.add(shield);

    // Micro-USB Port
    const usbGeo = new THREE.BoxGeometry(0.7, 0.22, 0.6);
    const usbMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    const usb = new THREE.Mesh(usbGeo, usbMat);
    usb.position.set(0, 0.12, 1.8);
    esp32Group.add(usb);

    // Gold Pin Headers along sides
    for (let i = -1.6; i <= 1.6; i += 0.26) {
      const pinLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), new THREE.MeshStandardMaterial({ color: 0xe5a950, metalness: 0.9, roughness: 0.2 }));
      pinLeft.position.set(-1.08, 0.16, i);
      esp32Group.add(pinLeft);

      const pinRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), new THREE.MeshStandardMaterial({ color: 0xe5a950, metalness: 0.9, roughness: 0.2 }));
      pinRight.position.set(1.08, 0.16, i);
      esp32Group.add(pinRight);
    }
    registerMesh(espPcb, 'esp32');
    rigGroup.add(esp32Group);

    // --- 2. DHT11 Temperature & Humidity Sensor (GPIO 4) ---
    const dhtGroup = new THREE.Group();
    dhtGroup.position.set(2.0, 0.45, -1.4);

    const dhtBodyGeo = new THREE.BoxGeometry(1.2, 0.85, 1.5);
    const dhtBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1d70b8, // classic DHT11 blue
      roughness: 0.4,
      metalness: 0.1
    });
    const dhtBody = new THREE.Mesh(dhtBodyGeo, dhtBodyMat);
    dhtBody.castShadow = true;
    dhtGroup.add(dhtBody);

    // Vents / grill lines
    for (let g = -0.5; g <= 0.5; g += 0.25) {
      const grill = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.08), new THREE.MeshStandardMaterial({ color: 0x0c3b66 }));
      grill.position.set(0, 0.44, g);
      dhtGroup.add(grill);
    }
    registerMesh(dhtBody, 'dht11');
    rigGroup.add(dhtGroup);

    // --- 3. JSN-SR04T Waterproof Ultrasonic Transducer & Sub-board (GPIO 5 & 18) ---
    const sonarGroup = new THREE.Group();
    sonarGroup.position.set(2.4, 0.1, 1.2);

    // Cylindrical probe
    const probeGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.1, 32);
    const probeMat = new THREE.MeshStandardMaterial({
      color: 0x3b4252,
      metalness: 0.7,
      roughness: 0.3
    });
    const probe = new THREE.Mesh(probeGeo, probeMat);
    probe.rotation.x = Math.PI / 2;
    probe.position.set(0.7, 0.4, 0);
    probe.castShadow = true;
    sonarGroup.add(probe);

    // Transducer front face / mesh diaphragm
    const faceGeo = new THREE.CircleGeometry(0.52, 32);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0x8892b0, metalness: 0.5, roughness: 0.4 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0.7, 0.4, 0.56);
    sonarGroup.add(face);

    // Breakout PCB with 74LVC level-shifter
    const sonarPcbGeo = new THREE.BoxGeometry(1.6, 0.1, 1.4);
    const sonarPcbMat = new THREE.MeshStandardMaterial({ color: 0x1a4329, roughness: 0.4 });
    const sonarPcb = new THREE.Mesh(sonarPcbGeo, sonarPcbMat);
    sonarPcb.position.set(-0.6, 0.1, 0);
    sonarGroup.add(sonarPcb);

    // Level shifter chip (74LVC)
    const levelShifter = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.5), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    levelShifter.position.set(-0.6, 0.18, 0);
    sonarGroup.add(levelShifter);

    registerMesh(probe, 'jsnsr04t');
    registerMesh(sonarPcb, 'jsnsr04t');
    rigGroup.add(sonarGroup);

    // --- 4. Green Status LED (GPIO 32) & Red Anomaly LED (GPIO 22) ---
    const ledMatGreen = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.75,
      roughness: 0.2
    });
    const ledGreen = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), ledMatGreen);
    ledGreen.position.set(0.2, 0.35, 1.7);
    ledGreen.castShadow = true;
    registerMesh(ledGreen, 'green_led');
    rigGroup.add(ledGreen);

    const ledMatRed = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.25, // dim on normal
      roughness: 0.2
    });
    const ledRed = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), ledMatRed);
    ledRed.position.set(0.7, 0.35, 1.7);
    ledRed.castShadow = true;
    registerMesh(ledRed, 'red_led');
    rigGroup.add(ledRed);

    // --- 5. Piezo Buzzer (GPIO 23) ---
    const buzzerGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.5, 32);
    const buzzerMat = new THREE.MeshStandardMaterial({ color: 0x1f232b, roughness: 0.6 });
    const buzzer = new THREE.Mesh(buzzerGeo, buzzerMat);
    buzzer.position.set(0.4, 0.26, -1.5);
    buzzer.castShadow = true;
    registerMesh(buzzer, 'buzzer');
    rigGroup.add(buzzer);

    // Buzzer central sound aperture
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x050505 }));
    hole.position.set(0.4, 0.52, -1.5);
    rigGroup.add(hole);

    // --- 6. Phone IMU Reference Slate ---
    const phoneGeo = new THREE.BoxGeometry(1.6, 0.12, 2.8);
    const phoneMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x2d3748 : 0xd2d6dc,
      metalness: 0.6,
      roughness: 0.3
    });
    const phone = new THREE.Mesh(phoneGeo, phoneMat);
    phone.position.set(-3.4, 0.12, 0.2);
    phone.rotation.y = 0.12;
    phone.castShadow = true;
    registerMesh(phone, 'phone_imu');
    rigGroup.add(phone);

    // --- 7. BMP280 Barometric Pressure Sensor ---
    const bmpGroup = new THREE.Group();
    bmpGroup.position.set(-1.0, 0.1, -1.8);
    const bmpPcbGeo = new THREE.BoxGeometry(0.8, 0.08, 1.2);
    const bmpPcbMat = new THREE.MeshStandardMaterial({ color: 0x5a189a, roughness: 0.3 }); // Purple PCB
    const bmpPcb = new THREE.Mesh(bmpPcbGeo, bmpPcbMat);
    bmpGroup.add(bmpPcb);
    const bmpSensorGeo = new THREE.BoxGeometry(0.2, 0.1, 0.25);
    const bmpSensorMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 });
    const bmpSensor = new THREE.Mesh(bmpSensorGeo, bmpSensorMat);
    bmpSensor.position.set(0, 0.08, 0);
    bmpGroup.add(bmpSensor);
    registerMesh(bmpPcb, 'bmp280');
    registerMesh(bmpSensor, 'bmp280');
    rigGroup.add(bmpGroup);

    // --- 8. Photoresistor (LDR) ---
    const ldrGroup = new THREE.Group();
    ldrGroup.position.set(-2.2, 0.3, -1.8);
    const ldrHeadGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
    const ldrHeadMat = new THREE.MeshStandardMaterial({ color: 0xff4500, metalness: 0.3, roughness: 0.2 });
    const ldrHead = new THREE.Mesh(ldrHeadGeo, ldrHeadMat);
    ldrHead.rotation.x = Math.PI / 2;
    ldrGroup.add(ldrHead);
    const ldrPatternGeo = new THREE.PlaneGeometry(0.3, 0.3);
    const ldrPatternMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2, side: THREE.DoubleSide });
    const ldrPattern = new THREE.Mesh(ldrPatternGeo, ldrPatternMat);
    ldrPattern.position.z = 0.06;
    ldrGroup.add(ldrPattern);
    const ldrLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 }));
    ldrLeg1.position.set(-0.1, -0.2, 0);
    ldrGroup.add(ldrLeg1);
    const ldrLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 }));
    ldrLeg2.position.set(0.1, -0.2, 0);
    ldrGroup.add(ldrLeg2);
    registerMesh(ldrHead, 'ldr');
    registerMesh(ldrPattern, 'ldr');
    rigGroup.add(ldrGroup);

    // --- Jumper Wires Connecting Hardware ---
    const wireCurves = [
      // DHT11 to ESP32 GPIO 4 (Yellow Wire)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.5, 0.3, -1.4),
        new THREE.Vector3(0.5, 0.9, -1.0),
        new THREE.Vector3(-0.6, 0.3, -0.6)
      ]),
      // Sonar TRIG to GPIO 5 (Green Wire)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.8, 0.3, 1.0),
        new THREE.Vector3(0.4, 0.7, 0.8),
        new THREE.Vector3(-0.6, 0.3, 0.4)
      ]),
      // Sonar ECHO (through level shifter) to GPIO 18 (Cyan Wire)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.7, 0.3, 1.3),
        new THREE.Vector3(0.3, 0.8, 1.1),
        new THREE.Vector3(-0.6, 0.3, 0.7)
      ]),
      // Buzzer to GPIO 23 (Orange Wire)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.4, 0.3, -1.3),
        new THREE.Vector3(-0.3, 0.7, -1.1),
        new THREE.Vector3(-0.6, 0.3, -0.8)
      ]),
      // Green LED to GPIO 32 (White Wire)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.2, 0.2, 1.5),
        new THREE.Vector3(-0.3, 0.5, 1.4),
        new THREE.Vector3(-0.6, 0.3, 1.0)
      ]),
      // BMP280 to ESP32 (Purple Wire)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.0, 0.2, -1.6),
        new THREE.Vector3(-1.2, 0.5, -1.0),
        new THREE.Vector3(-1.3, 0.2, -0.5)
      ]),
      // LDR to ESP32 (Red Wire)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.2, 0.1, -1.7),
        new THREE.Vector3(-2.0, 0.4, -1.0),
        new THREE.Vector3(-1.8, 0.2, -0.5)
      ])
    ];

    const wireColors = [0xe5a950, 0x10b981, 0x06b6d4, 0xf97316, 0x94a3b8, 0x9333ea, 0xef4444];
    wireCurves.forEach((curve, idx) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.035, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({ color: wireColors[idx], roughness: 0.3, metalness: 0.1 });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      rigGroup.add(tubeMesh);
    });

    // 4. Mouse Raycasting & Orbit Controls
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = x;
      mouse.y = y;
    };

    const onClick = (e: MouseEvent) => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && !hitObj.userData?.compId && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        const compId = hitObj?.userData?.compId;
        if (compId && HARDWARE_COMPONENTS[compId]) {
          onSelectComponent?.(HARDWARE_COMPONENTS[compId]);
        }
      }
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('click', onClick);

    // 5. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      controls.update();

      // Pulse green LED slightly
      ledMatGreen.emissiveIntensity = 0.6 + Math.sin(elapsedTime * 4.0) * 0.25;

      // If ultrasonic reading has severe spike (>150cm), pulse red LED
      if (telemetry?.distance && telemetry.distance > 150) {
        ledMatRed.emissiveIntensity = 0.8 + Math.sin(elapsedTime * 12.0) * 0.4;
      } else {
        ledMatRed.emissiveIntensity = 0.15;
      }

      // Raycast hover check
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects, true);
      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && !hitObj.userData?.compId && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        const compId = hitObj?.userData?.compId;
        if (compId && HARDWARE_COMPONENTS[compId]) {
          setHoveredName(HARDWARE_COMPONENTS[compId].name);
          container.style.cursor = 'pointer';
        }
      } else {
        setHoveredName(null);
        container.style.cursor = 'default';
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme, telemetry?.distance, onSelectComponent]);

  return (
    <div className={`relative w-full ${compact ? 'h-[400px]' : 'h-[540px] md:h-[620px]'} overflow-hidden select-none`}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Hover Badge */}
      {hoveredName && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none bg-[var(--bg-secondary)]/90 backdrop-blur-md px-3 py-1.5 rounded border border-[var(--border-strong)] text-xs font-mono text-[var(--accent-amber)] animate-fadeIn">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)] mr-2 animate-ping" />
          CLICK TO INSPECT: {hoveredName}
        </div>
      )}

      {/* Bottom Technical HUD Annotation */}
      <div className="absolute bottom-3 right-4 z-10 pointer-events-none flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)] tracking-wider">
        <span>PROJECTION: ORTHOGRAPHIC OBLIQUE</span>
        <span>•</span>
        <span>SCALE: 1:1 METROLOGY</span>
        <span>•</span>
        <span className="text-[var(--state-normal)]">RENDER: THREE.JS WEBGL</span>
      </div>
    </div>
  );
}
