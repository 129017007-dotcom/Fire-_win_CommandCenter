import React, { useState, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ZoneId, CameraId, ZoneRuntimeState, SimulationControlsState } from '../../types/digitalTwin';
import { DIGITAL_TWIN_ZONES_GEOMETRY } from '../../data/digitalTwinData';
import { 
  Video, 
  RotateCcw, 
  Eye, 
  Maximize2, 
  Droplets, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Compass,
  Building2,
  Info,
  Flame,
  ShieldCheck
} from 'lucide-react';

// ==========================================
// 1. Error Boundary for WebGL / 3D Canvas
// ==========================================
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL Error in BuildingDigitalTwin3D:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ==========================================
// 2. Room Furniture Sub-components
// ==========================================

// Zone 1: Classroom Furniture
const ClassroomFurniture: React.FC = () => (
  <group>
    {/* Teacher's Podium / Desk */}
    <mesh position={[-3.5, 0.45, -2.5]} castShadow receiveShadow>
      <boxGeometry args={[1.6, 0.85, 0.8]} />
      <meshStandardMaterial color="#8b5a2b" roughness={0.6} />
    </mesh>
    {/* Teacher's Chair */}
    <mesh position={[-3.5, 0.45, -3.2]}>
      <boxGeometry args={[0.5, 0.8, 0.5]} />
      <meshStandardMaterial color="#2d3748" />
    </mesh>
    {/* Wall Whiteboard */}
    <mesh position={[-5.3, 1.2, -0.5]} rotation={[0, Math.PI / 2, 0]}>
      <boxGeometry args={[2.8, 1.2, 0.05]} />
      <meshStandardMaterial color="#edf2f7" roughness={0.2} metalness={0.1} />
    </mesh>

    {/* Student Desks & Chairs (2 rows of 3) */}
    {[-1.5, 1.0, 3.2].map((x, colIdx) =>
      [-1.2, 1.4].map((z, rowIdx) => (
        <group key={`desk-${colIdx}-${rowIdx}`} position={[x, 0, z]}>
          {/* Table */}
          <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.3, 0.72, 0.65]} />
            <meshStandardMaterial color="#d69e2e" roughness={0.5} />
          </mesh>
          {/* Chair */}
          <mesh position={[0, 0.32, -0.6]} castShadow>
            <boxGeometry args={[0.45, 0.6, 0.45]} />
            <meshStandardMaterial color="#4a5568" />
          </mesh>
        </group>
      ))
    )}
  </group>
);

// Zone 2: Office Furniture
const OfficeFurniture: React.FC = () => (
  <group>
    {/* 4 Executive Workstations */}
    {[
      { pos: [-1.8, 0, -1.5] as [number, number, number], rot: 0 },
      { pos: [1.8, 0, -1.5] as [number, number, number], rot: Math.PI },
      { pos: [-1.8, 0, 1.5] as [number, number, number], rot: 0 },
      { pos: [1.8, 0, 1.5] as [number, number, number], rot: Math.PI },
    ].map((item, idx) => (
      <group key={`workstation-${idx}`} position={item.pos} rotation={[0, item.rot, 0]}>
        {/* L-Shaped Desk */}
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.75, 0.8]} />
          <meshStandardMaterial color="#2b6cb0" roughness={0.4} />
        </mesh>
        {/* Computer Monitor */}
        <mesh position={[0, 0.95, -0.15]}>
          <boxGeometry args={[0.65, 0.42, 0.05]} />
          <meshStandardMaterial color="#1a202c" roughness={0.2} />
        </mesh>
        {/* Monitor Screen Glow */}
        <mesh position={[0, 0.95, -0.12]}>
          <planeGeometry args={[0.6, 0.38]} />
          <meshBasicMaterial color="#63b3ed" />
        </mesh>
        {/* Office Swivel Chair */}
        <mesh position={[0, 0.42, 0.7]}>
          <cylinderGeometry args={[0.26, 0.26, 0.75, 12]} />
          <meshStandardMaterial color="#1a202c" roughness={0.8} />
        </mesh>
      </group>
    ))}

    {/* Metal Filing Cabinets */}
    <mesh position={[-3.4, 0.8, -3.0]} castShadow receiveShadow>
      <boxGeometry args={[0.8, 1.5, 0.6]} />
      <meshStandardMaterial color="#718096" metalness={0.4} roughness={0.5} />
    </mesh>
  </group>
);

// Zone 3: Laboratory Furniture
const LaboratoryFurniture: React.FC = () => (
  <group>
    {/* Central Lab Chemical Work Island */}
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
      <boxGeometry args={[4.2, 0.9, 1.6]} />
      <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.3} />
    </mesh>
    {/* Stainless Steel Sink in Center */}
    <mesh position={[0, 0.88, 0]}>
      <boxGeometry args={[0.8, 0.05, 0.8]} />
      <meshStandardMaterial color="#a0aec0" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Fume Hood Enclosure */}
    <mesh position={[-3.8, 1.0, -2.6]} castShadow receiveShadow>
      <boxGeometry args={[1.8, 1.9, 0.9]} />
      <meshStandardMaterial color="#4a5568" roughness={0.3} metalness={0.5} />
    </mesh>
    {/* Fume Hood Glass Sash */}
    <mesh position={[-3.8, 1.0, -2.1]}>
      <boxGeometry args={[1.6, 0.9, 0.04]} />
      <meshStandardMaterial color="#90cdf4" transparent opacity={0.6} />
    </mesh>
    {/* Glassware Racks */}
    {[-1.4, 1.4].map((x, i) => (
      <mesh key={`rack-${i}`} position={[x, 1.05, 0]}>
        <boxGeometry args={[0.9, 0.3, 0.4]} />
        <meshStandardMaterial color="#cbd5e0" transparent opacity={0.7} />
      </mesh>
    ))}
  </group>
);

// Zone 4: Library Furniture
const LibraryFurniture: React.FC = () => (
  <group>
    {/* Tall Wooden Bookshelves (3 Rows) */}
    {[-3.6, -1.2, 1.2].map((x, idx) => (
      <group key={`shelf-${idx}`} position={[x, 1.0, -1.4]}>
        {/* Bookshelf Frame */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.65, 1.9, 3.8]} />
          <meshStandardMaterial color="#744210" roughness={0.7} />
        </mesh>
        {/* Book Spines Color Bands */}
        <mesh position={[0.34, 0.2, 0]}>
          <boxGeometry args={[0.02, 1.4, 3.4]} />
          <meshStandardMaterial color="#c53030" roughness={0.9} />
        </mesh>
      </group>
    ))}

    {/* Central Study Table */}
    <mesh position={[3.2, 0.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.8, 0.75, 4.2]} />
      <meshStandardMaterial color="#975a16" roughness={0.5} />
    </mesh>
    {/* Study Chairs */}
    {[-1.2, 0, 1.2].map((z, i) => (
      <mesh key={`lib-chair-${i}`} position={[2.0, 0.35, z]}>
        <boxGeometry args={[0.45, 0.65, 0.45]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
    ))}
  </group>
);

// Zone 5: Storage Furniture
const StorageFurniture: React.FC = () => (
  <group>
    {/* Industrial Heavy Pallet Racks (2 parallel rows) */}
    {[-1.8, 1.8].map((x, rowIdx) => (
      <group key={`pallet-rack-${rowIdx}`} position={[x, 1.0, 0]}>
        {/* Steel Rack Uprights */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.9, 1.95, 4.8]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Cardboard Boxes & Wooden Crates */}
        {[-1.6, -0.5, 0.6, 1.7].map((z, boxIdx) => (
          <mesh key={`crate-${rowIdx}-${boxIdx}`} position={[0, boxIdx % 2 === 0 ? 0.25 : -0.3, z]}>
            <boxGeometry args={[0.75, 0.65, 0.85]} />
            <meshStandardMaterial color="#d69e2e" roughness={0.8} />
          </mesh>
        ))}
      </group>
    ))}
  </group>
);

// Zone 6: Electrical Room Furniture
const ElectricalRoomFurniture: React.FC = () => (
  <group>
    {/* Switchgear Power Distribution Cabinets */}
    <group position={[0, 1.0, -2.8]}>
      {[-2.2, -0.7, 0.8, 2.3].map((x, idx) => (
        <group key={`cabinet-${idx}`} position={[x, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.3, 1.95, 0.85]} />
            <meshStandardMaterial color="#2d3748" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* High Voltage Caution Triangle (Yellow) */}
          <mesh position={[0, 0.3, 0.44]}>
            <boxGeometry args={[0.25, 0.25, 0.02]} />
            <meshBasicMaterial color="#ecc94b" />
          </mesh>
          {/* LED Status Meter */}
          <mesh position={[0.35, 0.7, 0.44]}>
            <boxGeometry args={[0.1, 0.05, 0.02]} />
            <meshBasicMaterial color="#48bb78" />
          </mesh>
        </group>
      ))}
    </group>

    {/* Dry-Type Transformer Unit */}
    <mesh position={[2.4, 0.75, 1.2]} castShadow receiveShadow>
      <boxGeometry args={[1.8, 1.4, 1.4]} />
      <meshStandardMaterial color="#4a5568" metalness={0.5} roughness={0.5} />
    </mesh>
  </group>
);

// ==========================================
// 3. Camera Marker Component (3D Model + HTML)
// ==========================================
interface CameraMarker3DProps {
  cameraId: CameraId;
  zoneName: string;
  zoneId: ZoneId;
  position: [number, number, number];
  rotationY?: number;
  status: ZoneRuntimeState['status'];
  isSelected: boolean;
  onClick: () => void;
  onInspectInLab?: (cameraId: CameraId, zoneId: ZoneId) => void;
}

const CameraMarker3D: React.FC<CameraMarker3DProps> = ({
  cameraId,
  zoneName,
  zoneId,
  position,
  rotationY = 0,
  status,
  isSelected,
  onClick,
  onInspectInLab,
}) => {
  const [hovered, setHovered] = useState(false);

  // Status-based LED color
  const ledColor = status === 'detected_fire' 
    ? '#ef4444' 
    : status === 'detected_smoke' 
    ? '#06b6d4' 
    : status === 'simulated_fire'
    ? '#f59e0b'
    : status === 'simulated_smoke'
    ? '#eab308'
    : status === 'suppressed'
    ? '#38bdf8'
    : status === 'normal' 
    ? '#10b981' 
    : '#64748b';

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Clickable Hover Hitbox */}
      <mesh 
        visible={false} 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.8, 8, 8]} />
      </mesh>

      {/* Wall Bracket */}
      <mesh position={[0, 0, -0.2]}>
        <boxGeometry args={[0.15, 0.25, 0.15]} />
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Camera Body */}
      <mesh position={[0, -0.05, 0.1]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.45, 12]} />
        <meshStandardMaterial color={isSelected ? '#f97316' : '#2d3748'} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Camera Lens */}
      <mesh position={[0, -0.25, 0.22]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Status LED */}
      <mesh position={[0.08, 0.05, 0.25]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={ledColor} />
      </mesh>

      {/* Floating 3D HTML Badge */}
      <Html position={[0, 0.55, 0]} center distanceFactor={18}>
        <div 
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className={`cursor-pointer px-2 py-0.5 rounded font-mono text-[10px] font-bold flex items-center gap-1.5 shadow-lg transition-transform duration-200 select-none ${
            isSelected 
              ? 'bg-orange-500 text-white ring-2 ring-white scale-110' 
              : hovered 
              ? 'bg-slate-800 text-white scale-105 border border-slate-600' 
              : 'bg-black/85 text-slate-200 border border-slate-700'
          }`}
        >
          <Video className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>{cameraId}</span>
          {onInspectInLab && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInspectInLab(cameraId, zoneId);
              }}
              className="ml-1 px-1.5 py-0.5 rounded bg-black/50 hover:bg-black text-[9px] text-cyan-300 border border-cyan-500/40"
              title="Test image on this camera in AI Lab"
            >
              Test
            </button>
          )}
        </div>
      </Html>
    </group>
  );
};

// ==========================================
// 4. Sprinkler Head Component
// ==========================================
const SprinklerHead3D: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    {/* Drop Pipe from Ceiling */}
    <mesh position={[0, 0.25, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
      <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
    </mesh>
    {/* Deflector Plate & Glass Bulb */}
    <mesh position={[0, -0.02, 0]}>
      <cylinderGeometry args={[0.08, 0.02, 0.05, 10]} />
      <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
    </mesh>
  </group>
);

// ==========================================
// 5. Emergency Exit Marker
// ==========================================
interface EmergencyExit3DProps {
  label: string;
  position: [number, number, number];
  rotationY?: number;
}

const EmergencyExit3D: React.FC<EmergencyExit3DProps> = ({ label, position, rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {/* Door Frame */}
    <mesh position={[0, 1.1, 0]}>
      <boxGeometry args={[1.5, 2.2, 0.15]} />
      <meshStandardMaterial color="#334155" metalness={0.3} roughness={0.7} />
    </mesh>
    {/* Door Opening (dark portal) */}
    <mesh position={[0, 1.05, 0.02]}>
      <planeGeometry args={[1.2, 2.0]} />
      <meshBasicMaterial color="#020617" />
    </mesh>
    {/* Illuminated Green EXIT Sign */}
    <mesh position={[0, 2.25, 0.1]}>
      <boxGeometry args={[0.8, 0.25, 0.08]} />
      <meshStandardMaterial color="#15803d" emissive="#22c55e" emissiveIntensity={0.6} />
    </mesh>
    <Html position={[0, 2.25, 0.16]} center distanceFactor={20}>
      <div className="bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 select-none whitespace-nowrap">
        <span>EXIT: {label}</span>
      </div>
    </Html>
  </group>
);

// ==========================================
// 6. Hazard & Suppression 3D Visual Effects (Lightweight R3F)
// ==========================================

// ==========================================
// Centroid Planar 2D->3D Projection Helper
// ==========================================
export function calculateBoundingBoxCentroid(
  state?: ZoneRuntimeState,
  roomWidth: number = 8.8,
  roomDepth: number = 7.8
): [number, number, number] {
  if (!state || !state.detectionResult?.boxes || state.detectionResult.boxes.length === 0) {
    return [0, 0, 0];
  }

  // Prioritize fire boxes, fallback to smoke
  const fireBoxes = state.detectionResult.boxes.filter(b => b.class === 'fire');
  const candidateBoxes = fireBoxes.length > 0 ? fireBoxes : state.detectionResult.boxes;
  const bestBox = candidateBoxes.reduce((prev, curr) => (curr.confidence > prev.confidence ? curr : prev), candidateBoxes[0]);

  if (!bestBox) return [0, 0, 0];

  // Normalized centroid [0..1]
  const cx = bestBox.x + bestBox.width / 2;
  const cy = bestBox.y + bestBox.height / 2;

  // Map to local room coordinates with safe interior margin away from walls
  const marginX = roomWidth * 0.32;
  const marginZ = roomDepth * 0.32;
  const x = Math.max(-marginX, Math.min(marginX, (cx - 0.5) * (roomWidth * 0.65)));
  const z = Math.max(-marginZ, Math.min(marginZ, (cy - 0.5) * (roomDepth * 0.65)));

  return [Number(x.toFixed(2)), 0, Number(z.toFixed(2))];
}

// Multi-layered Procedural Clustered Fire Effect
interface ClusteredFire3DEffectProps {
  position?: [number, number, number];
  isOrigin?: boolean;
  severityLevel?: string;
  isSuppressed?: boolean;
}

const ClusteredFire3DEffect: React.FC<ClusteredFire3DEffectProps> = ({
  position = [0, 0, 0],
  isOrigin = false,
  severityLevel = 'moderate',
  isSuppressed = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const tongue1Ref = useRef<THREE.Mesh>(null);
  const tongue2Ref = useRef<THREE.Mesh>(null);
  const tongue3Ref = useRef<THREE.Mesh>(null);
  const tongue4Ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Severity-based scale factor
  const baseScale = isSuppressed
    ? 0.25
    : severityLevel === 'critical'
    ? 1.45
    : severityLevel === 'high'
    ? 1.25
    : severityLevel === 'moderate'
    ? 1.0
    : 0.8;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (lightRef.current) {
      const flicker = Math.sin(t * 22) * 0.4 + Math.cos(t * 31) * 0.2;
      lightRef.current.intensity = (isOrigin ? 3.0 : 1.8) * baseScale + (isSuppressed ? 0.2 : flicker);
    }

    if (coreRef.current) {
      const s = baseScale * (1 + Math.sin(t * 18) * 0.2);
      coreRef.current.scale.set(s, s * 1.3, s);
      coreRef.current.rotation.y = t * 2.5;
    }

    if (tongue1Ref.current) {
      const s = baseScale * (0.9 + Math.sin(t * 14 + 1) * 0.25);
      tongue1Ref.current.scale.set(s, s * 1.25, s);
      tongue1Ref.current.rotation.y = -t * 2;
    }

    if (tongue2Ref.current) {
      const s = baseScale * (0.85 + Math.cos(t * 16 + 2) * 0.2);
      tongue2Ref.current.scale.set(s, s * 1.2, s);
      tongue2Ref.current.rotation.y = t * 1.8;
    }

    if (tongue3Ref.current) {
      const s = baseScale * (0.8 + Math.sin(t * 20 + 3) * 0.2);
      tongue3Ref.current.scale.set(s, s * 1.15, s);
    }

    if (tongue4Ref.current) {
      const s = baseScale * (0.75 + Math.cos(t * 17 + 4) * 0.18);
      tongue4Ref.current.scale.set(s, s * 1.1, s);
    }

    if (ringRef.current) {
      const rs = baseScale * (1 + Math.sin(t * 6) * 0.12);
      ringRef.current.scale.set(rs, rs, rs);
    }
  });

  const coreColor = isSuppressed ? '#38bdf8' : isOrigin ? '#ff3300' : '#f59e0b';
  const emissiveColor = isSuppressed ? '#0284c7' : isOrigin ? '#ff5500' : '#d97706';
  const lightColor = isSuppressed ? '#38bdf8' : isOrigin ? '#ff4400' : '#f59e0b';

  return (
    <group ref={groupRef} position={position}>
      {/* Dynamic Flickering Ground Light */}
      <pointLight 
        ref={lightRef} 
        color={lightColor} 
        distance={isSuppressed ? 3 : 9} 
        decay={2} 
        position={[0, 0.8, 0]} 
      />

      {/* Ground Glowing Disc */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.5, 1.2, 20]} />
        <meshBasicMaterial 
          color={coreColor} 
          transparent 
          opacity={isSuppressed ? 0.15 : 0.45} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Central Hot Core Flame */}
      <mesh ref={coreRef} position={[0, 0.5 * baseScale, 0]}>
        <coneGeometry args={[0.35, 1.2, 8]} />
        <meshStandardMaterial 
          color={isSuppressed ? '#bae6fd' : '#fef08a'} 
          emissive={isSuppressed ? '#38bdf8' : '#eab308'} 
          emissiveIntensity={isSuppressed ? 0.5 : 2.0} 
          roughness={0.1} 
          transparent 
          opacity={isSuppressed ? 0.4 : 0.95} 
        />
      </mesh>

      {/* Outer Flame Tongue 1 (South-East) */}
      <mesh ref={tongue1Ref} position={[0.22, 0.45 * baseScale, -0.15]}>
        <coneGeometry args={[0.28, 1.0, 7]} />
        <meshStandardMaterial 
          color={coreColor} 
          emissive={emissiveColor} 
          emissiveIntensity={1.4} 
          roughness={0.2} 
          transparent 
          opacity={isSuppressed ? 0.3 : 0.85} 
        />
      </mesh>

      {/* Outer Flame Tongue 2 (North-West) */}
      <mesh ref={tongue2Ref} position={[-0.2, 0.4 * baseScale, 0.18]}>
        <coneGeometry args={[0.26, 0.95, 7]} />
        <meshStandardMaterial 
          color={coreColor} 
          emissive={emissiveColor} 
          emissiveIntensity={1.3} 
          roughness={0.2} 
          transparent 
          opacity={isSuppressed ? 0.3 : 0.85} 
        />
      </mesh>

      {/* Outer Flame Tongue 3 (South-West) */}
      <mesh ref={tongue3Ref} position={[-0.18, 0.38 * baseScale, -0.16]}>
        <coneGeometry args={[0.22, 0.85, 6]} />
        <meshStandardMaterial 
          color={isSuppressed ? '#7dd3fc' : '#dc2626'} 
          emissive={isSuppressed ? '#0284c7' : '#b91c1c'} 
          emissiveIntensity={1.2} 
          roughness={0.3} 
          transparent 
          opacity={isSuppressed ? 0.25 : 0.8} 
        />
      </mesh>

      {/* Outer Flame Tongue 4 (North-East) */}
      <mesh ref={tongue4Ref} position={[0.16, 0.35 * baseScale, 0.15]}>
        <coneGeometry args={[0.2, 0.8, 6]} />
        <meshStandardMaterial 
          color={isSuppressed ? '#7dd3fc' : '#ea580c'} 
          emissive={isSuppressed ? '#0284c7' : '#c2410c'} 
          emissiveIntensity={1.1} 
          roughness={0.3} 
          transparent 
          opacity={isSuppressed ? 0.25 : 0.8} 
        />
      </mesh>

      {/* Rising Smoke Particles from the Fire */}
      <Smoke3DEffect position={[0, 0.6 * baseScale, 0]} isSimulated={false} />
    </group>
  );
};

// Animated Rising Smoke Plume Effect
interface Smoke3DEffectProps {
  position?: [number, number, number];
  isSimulated?: boolean;
}

const Smoke3DEffect: React.FC<Smoke3DEffectProps> = ({ position = [0, 0, 0], isSimulated = false }) => {
  const p1Ref = useRef<THREE.Mesh>(null);
  const p2Ref = useRef<THREE.Mesh>(null);
  const p3Ref = useRef<THREE.Mesh>(null);
  const p4Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const speed = 0.5;
    const animatePuff = (mesh: THREE.Mesh | null, offset: number, initX: number, initZ: number) => {
      if (!mesh) return;
      mesh.position.y += delta * speed;
      mesh.rotation.y += delta * 0.2;
      mesh.rotation.x += delta * 0.1;
      const progress = mesh.position.y / 2.3;
      mesh.scale.setScalar(0.7 + progress * 0.8);
      if (mesh.position.y > 2.3) {
        mesh.position.y = 0.3 + offset * 0.1;
        mesh.position.x = initX;
        mesh.position.z = initZ;
      }
    };

    animatePuff(p1Ref.current, 0, 0.1, -0.1);
    animatePuff(p2Ref.current, 1, -0.15, 0.1);
    animatePuff(p3Ref.current, 2, 0.05, 0.15);
    animatePuff(p4Ref.current, 3, -0.1, -0.15);
  });

  const smokeColor = isSimulated ? '#71717a' : '#334155';

  return (
    <group position={position}>
      <mesh ref={p1Ref} position={[0.1, 0.4, -0.1]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color={smokeColor} transparent opacity={0.3} roughness={0.9} />
      </mesh>
      <mesh ref={p2Ref} position={[-0.15, 0.9, 0.1]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial color={smokeColor} transparent opacity={0.25} roughness={0.9} />
      </mesh>
      <mesh ref={p3Ref} position={[0.05, 1.4, 0.15]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color={smokeColor} transparent opacity={0.2} roughness={0.9} />
      </mesh>
      <mesh ref={p4Ref} position={[-0.1, 1.9, -0.15]}>
        <sphereGeometry args={[0.45, 8, 8]} />
        <meshStandardMaterial color={smokeColor} transparent opacity={0.15} roughness={0.9} />
      </mesh>
    </group>
  );
};

// Animated Water Mist Spray for Sprinklers
interface WaterSprinklerSprayEffectProps {
  position: [number, number, number];
  active: boolean;
}

const WaterSprinklerSprayEffect: React.FC<WaterSprinklerSprayEffectProps> = ({ position, active }) => {
  const coneRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.getElapsedTime();
    if (coneRef.current) {
      coneRef.current.rotation.y = t * 1.5;
      const s = 1 + Math.sin(t * 8) * 0.08;
      coneRef.current.scale.set(s, 1, s);
    }
    if (ringRef.current) {
      const rs = 1 + Math.sin(t * 10) * 0.15;
      ringRef.current.scale.set(rs, rs, rs);
    }
  });

  if (!active) return null;

  return (
    <group position={position}>
      <mesh ref={coneRef} position={[0, -0.9, 0]}>
        <coneGeometry args={[1.5, 1.8, 14, 1, true]} />
        <meshStandardMaterial 
          color="#38bdf8" 
          transparent 
          opacity={0.22} 
          side={THREE.DoubleSide} 
          blending={THREE.AdditiveBlending} 
          roughness={0.1}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.95, 0]}>
        <ringGeometry args={[0.4, 1.6, 16]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Animated CO2 Blanket Vapor for Zone 6
interface CO2VaporEffectProps {
  position: [number, number, number];
  active: boolean;
}

const CO2VaporEffect: React.FC<CO2VaporEffectProps> = ({ position, active }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!active || !meshRef.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 4) * 0.06;
    meshRef.current.scale.set(s, 1 + Math.sin(t * 6) * 0.15, s);
  });

  if (!active) return null;

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, 0.3, 0]}>
        <boxGeometry args={[8.8, 0.5, 7.2]} />
        <meshStandardMaterial 
          color="#f1f5f9" 
          transparent 
          opacity={0.38} 
          roughness={0.9} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// ==========================================
// 7. Styling Helpers for 4 Core States
// ==========================================
const getZoneFloorStyle = (
  status: ZoneRuntimeState['status'],
  isSelected: boolean,
  isHovered: boolean
) => {
  if (isSelected) {
    if (status === 'detected_fire') return { color: '#991b1b', emissive: '#7f1d1d', emissiveIntensity: 0.5 };
    if (status === 'detected_smoke') return { color: '#0e7490', emissive: '#155e75', emissiveIntensity: 0.4 };
    if (status === 'simulated_fire') return { color: '#9a3412', emissive: '#7c2d12', emissiveIntensity: 0.4 };
    if (status === 'simulated_smoke') return { color: '#3f3f46', emissive: '#27272a', emissiveIntensity: 0.3 };
    if (status === 'suppressed') return { color: '#0369a1', emissive: '#075985', emissiveIntensity: 0.4 };
    return { color: '#1e3a8a', emissive: '#172554', emissiveIntensity: 0.3 };
  }
  if (isHovered) {
    return { color: '#334155', emissive: '#000000', emissiveIntensity: 0 };
  }
  switch (status) {
    case 'detected_fire':
      return { color: '#7f1d1d', emissive: '#450a0a', emissiveIntensity: 0.6 };
    case 'detected_smoke':
      return { color: '#164e63', emissive: '#083344', emissiveIntensity: 0.4 };
    case 'simulated_fire':
      return { color: '#78350f', emissive: '#451a03', emissiveIntensity: 0.4 };
    case 'simulated_smoke':
      return { color: '#27272a', emissive: '#18181b', emissiveIntensity: 0.2 };
    case 'suppressed':
      return { color: '#0c4a6e', emissive: '#082f49', emissiveIntensity: 0.4 };
    case 'normal':
      return { color: '#064e3b', emissive: '#022c22', emissiveIntensity: 0.1 };
    case 'untested':
    default:
      return { color: '#0f172a', emissive: '#000000', emissiveIntensity: 0 };
  }
};

const getZoneStatusBadge = (
  name: string,
  status: ZoneRuntimeState['status'],
  timeStepMinutes?: number
) => {
  switch (status) {
    case 'detected_fire':
      return {
        bg: 'bg-red-950/95 border-red-500 text-red-200 ring-2 ring-red-500 shadow-glow-fire animate-pulse',
        label: `🔥 ${name} • DETECTED FIRE (ORIGIN)`,
      };
    case 'detected_smoke':
      return {
        bg: 'bg-cyan-950/95 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400',
        label: `💨 ${name} • DETECTED SMOKE`,
      };
    case 'simulated_fire':
      return {
        bg: 'bg-amber-950/95 border-amber-500 text-amber-200 ring-1 ring-amber-500',
        label: `⚠️ ${name} • SIMULATED SPREAD (T+${timeStepMinutes || 0}m)`,
      };
    case 'simulated_smoke':
      return {
        bg: 'bg-stone-900/95 border-yellow-600/70 text-yellow-200',
        label: `🌫️ ${name} • SIMULATED SMOKE (T+${timeStepMinutes || 0}m)`,
      };
    case 'suppressed':
      return {
        bg: 'bg-sky-950/95 border-sky-400 text-sky-200 ring-1 ring-sky-400',
        label: `💧 ${name} • SUPPRESSED (Simulated)`,
      };
    case 'normal':
      return {
        bg: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
        label: `✓ ${name} • NORMAL (0 detected)`,
      };
    case 'untested':
    default:
      return {
        bg: 'bg-slate-900/90 border-slate-700 text-slate-300',
        label: `${name} • UNTESTED`,
      };
  }
};

interface CameraTargetState {
  position: [number, number, number];
  target: [number, number, number];
}

const SmoothCameraController: React.FC<{
  targetState: CameraTargetState | null;
  controlsRef: React.RefObject<any>;
  isTransitioning: boolean;
  onTransitionComplete: () => void;
}> = ({ targetState, controlsRef, isTransitioning, onTransitionComplete }) => {
  const { camera } = useThree();

  useFrame(() => {
    if (!isTransitioning || !targetState || !controlsRef.current) return;

    const targetPos = new THREE.Vector3(...targetState.position);
    const targetLook = new THREE.Vector3(...targetState.target);

    camera.position.lerp(targetPos, 0.08);
    controlsRef.current.target.lerp(targetLook, 0.08);
    controlsRef.current.update();

    if (camera.position.distanceTo(targetPos) < 0.15 && controlsRef.current.target.distanceTo(targetLook) < 0.15) {
      onTransitionComplete();
    }
  });

  return null;
};

// ==========================================
// 8. Main 3D Digital Twin Component
// ==========================================
interface BuildingDigitalTwin3DProps {
  zonesState: Record<ZoneId, ZoneRuntimeState>;
  selectedZoneId: ZoneId | null;
  onSelectZone: (zoneId: ZoneId) => void;
  onInspectZone?: (zoneId: ZoneId) => void;
  onInspectCameraInLab?: (cameraId: CameraId, zoneId: ZoneId) => void;
  simState?: SimulationControlsState;
}

export const BuildingDigitalTwin3D: React.FC<BuildingDigitalTwin3DProps> = ({
  zonesState,
  selectedZoneId,
  onSelectZone,
  onInspectZone,
  onInspectCameraInLab,
  simState,
}) => {
  const controlsRef = useRef<any>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<ZoneId | null>(null);

  const [cameraTarget, setCameraTarget] = useState<CameraTargetState | null>(null);
  const [isCameraTransitioning, setIsCameraTransitioning] = useState<boolean>(false);

  const flyTo = (pos: [number, number, number], target: [number, number, number]) => {
    setCameraTarget({ position: pos, target });
    setIsCameraTransitioning(true);
  };

  const handleResetCamera = () => {
    flyTo([24, 22, 24], [0, 0, 0]);
  };

  const handleTopDownView = () => {
    flyTo([0, 36, 0.01], [0, 0, 0]);
  };

  const handleFocusZone = (zid: ZoneId) => {
    onSelectZone(zid);
    const roomPositions: Record<ZoneId, { center: [number, number, number]; camOffset: [number, number, number] }> = {
      'zone-1': { center: [-9.5, 0.5, -6.5], camOffset: [-9.5 + 6, 12, -6.5 + 8] },
      'zone-2': { center: [0, 0.5, -6.5], camOffset: [6, 12, -6.5 + 8] },
      'zone-3': { center: [9.5, 0.5, -6.5], camOffset: [9.5 + 6, 12, -6.5 + 8] },
      'zone-4': { center: [-9.5, 0.5, 6.5], camOffset: [-9.5 + 6, 12, 6.5 + 8] },
      'zone-5': { center: [0, 0.5, 6.5], camOffset: [6, 12, 6.5 + 8] },
      'zone-6': { center: [9.5, 0.5, 6.5], camOffset: [9.5 + 6, 12, 6.5 + 8] },
    };
    const target = roomPositions[zid];
    if (target) {
      flyTo(target.camOffset, target.center);
    }
  };

  const selectedZone = selectedZoneId ? zonesState[selectedZoneId] : null;

  return (
    <div className="relative rounded-2xl bg-panel-card border border-panel-border overflow-hidden shadow-command-card flex flex-col">
      {/* 3D Viewport Controls Top Bar */}
      <div className="px-5 py-3 border-b border-panel-border flex flex-wrap items-center justify-between gap-3 bg-[#0a0f18]/90 z-10">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-mono font-bold text-white uppercase">
            3D CUTAWAY ARCHITECTURAL FOUNDATION (GROUND FLOOR)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            Interactive R3F Scene
          </span>
        </div>

        {/* Camera Preset & Tour Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Room Tour Selector */}
          <div className="flex items-center gap-1 bg-[#090e18] px-2 py-1 rounded-lg border border-panel-border text-xs font-mono">
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Eye className="w-3 h-3 text-cyan-400" /> Focus:
            </span>
            <select
              value={selectedZoneId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  handleFocusZone(e.target.value as ZoneId);
                }
              }}
              className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer pr-1"
            >
              <option value="" className="bg-[#090e18] text-slate-400">Pick Room...</option>
              <option value="zone-1" className="bg-[#090e18]">Z1: Classroom</option>
              <option value="zone-2" className="bg-[#090e18]">Z2: Office</option>
              <option value="zone-3" className="bg-[#090e18]">Z3: Laboratory</option>
              <option value="zone-4" className="bg-[#090e18]">Z4: Library</option>
              <option value="zone-5" className="bg-[#090e18]">Z5: Storage</option>
              <option value="zone-6" className="bg-[#090e18]">Z6: Electrical</option>
            </select>
          </div>

          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-panel-dark border border-panel-border hover:border-slate-600 text-xs font-mono text-slate-300 hover:text-white transition-colors"
            title="Reset to Isometric Perspective"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
            <span>Reset Isometric</span>
          </button>

          <button
            onClick={handleTopDownView}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-panel-dark border border-panel-border hover:border-slate-600 text-xs font-mono text-slate-300 hover:text-white transition-colors"
            title="Switch to Top-Down Plan View"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Top-Down (Plan)</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative w-full h-[540px] bg-[#070b14] overflow-hidden select-none">
        <WebGLErrorBoundary
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-400" />
              <div className="text-sm font-mono font-bold text-white">WebGL Rendering Unavailable</div>
              <p className="text-xs max-w-md font-sans">
                Your browser or environment could not initialize WebGL hardware acceleration. Please use the 2D Floor Plan tab above.
              </p>
            </div>
          }
        >
          <Canvas
            shadows
            camera={{ position: [24, 22, 24], fov: 42, near: 0.1, far: 200 }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          >
            {/* Ambient & Directional Lighting */}
            <ambientLight intensity={0.7} />
            <directionalLight
              position={[20, 32, 20]}
              intensity={1.3}
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0001}
            />
            <directionalLight position={[-16, 20, -16]} intensity={0.5} />
            <hemisphereLight args={['#ffffff', '#0f172a', 0.4]} />

            {/* OrbitControls */}
            <OrbitControls
              ref={controlsRef}
              makeDefault
              enableDamping
              dampingFactor={0.05}
              maxPolarAngle={Math.PI / 2.05}
              minDistance={10}
              maxDistance={70}
              target={[0, 0, 0]}
            />

            {/* Smooth Camera Flight Transitions */}
            <SmoothCameraController
              targetState={cameraTarget}
              controlsRef={controlsRef}
              isTransitioning={isCameraTransitioning}
              onTransitionComplete={() => setIsCameraTransitioning(false)}
            />

            {/* Ground Foundation Slab */}
            <mesh position={[0, -0.25, 0]} receiveShadow>
              <boxGeometry args={[42, 0.4, 28]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>

            {/* Architectural Building Floor Slab */}
            <mesh position={[0, -0.05, 0]} receiveShadow>
              <boxGeometry args={[36, 0.1, 22]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.1} />
            </mesh>

            {/* Central Corridor Floor */}
            <mesh position={[0, 0.01, 0]} receiveShadow>
              <boxGeometry args={[29, 0.02, 3.8]} />
              <meshStandardMaterial color="#334155" roughness={0.5} />
            </mesh>

            {/* Water Supply Pipeline (Blue) in Central Hallway */}
            <group position={[0, 2.2, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.05, 0.05, 28, 12]} />
                <meshStandardMaterial 
                  color={simState?.waterSprinklerActive ? "#38bdf8" : "#0284c7"} 
                  emissive={simState?.waterSprinklerActive ? "#0284c7" : "#000000"}
                  emissiveIntensity={simState?.waterSprinklerActive ? 0.9 : 0}
                  metalness={0.8} 
                  roughness={0.2} 
                />
              </mesh>
            </group>

            {/* CO2 Red Supply Pipe (running from East Annex to Zone 6) */}
            <group position={[11, 2.2, 5.5]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 8, 12]} />
                <meshStandardMaterial 
                  color={simState?.co2FloodActive ? "#f87171" : "#dc2626"} 
                  emissive={simState?.co2FloodActive ? "#dc2626" : "#000000"}
                  emissiveIntensity={simState?.co2FloodActive ? 0.9 : 0}
                  metalness={0.8} 
                  roughness={0.2} 
                />
              </mesh>
            </group>

            {/* East Utility Annex (Water Pump, Tanks, CO2 Bank, ESP32) */}
            <group position={[16, 0, 0]}>
              {/* Partition Wall */}
              <mesh position={[-1.5, 1.0, 0]}>
                <boxGeometry args={[0.2, 2.0, 22]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>

              {/* Water Pump & Accumulator Tank (North) */}
              <group position={[0.5, 0, -6]}>
                <mesh position={[0, 0.6, 0]} castShadow>
                  <boxGeometry args={[1.6, 1.2, 1.4]} />
                  <meshStandardMaterial color="#0369a1" metalness={0.7} roughness={0.3} />
                </mesh>
                <mesh position={[0, 1.4, 0]} castShadow>
                  <cylinderGeometry args={[0.45, 0.45, 1.2, 16]} />
                  <meshStandardMaterial color="#b91c1c" metalness={0.6} roughness={0.3} />
                </mesh>
              </group>

              {/* ESP32 Zone Controller (Center) */}
              <group position={[-1.3, 1.2, 0]}>
                <mesh>
                  <boxGeometry args={[0.15, 0.8, 1.2]} />
                  <meshStandardMaterial color="#64748b" metalness={0.4} roughness={0.5} />
                </mesh>
                {/* Status LED */}
                <mesh position={[0.1, 0.2, 0]}>
                  <sphereGeometry args={[0.04, 8, 8]} />
                  <meshBasicMaterial color="#10b981" />
                </mesh>
              </group>

              {/* CO2 Gas Cylinder Bank (South) */}
              <group position={[0.5, 0, 6]}>
                {[-0.8, -0.4, 0, 0.4, 0.8].map((z, idx) => (
                  <mesh key={`co2-cyl-${idx}`} position={[0, 0.8, z]} castShadow>
                    <cylinderGeometry args={[0.16, 0.16, 1.6, 12]} />
                    <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.2} />
                  </mesh>
                ))}
              </group>
            </group>

            {/* Three Emergency Exits */}
            <EmergencyExit3D label="WEST (STAIRS)" position={[-14.5, 0, 0]} rotationY={Math.PI / 2} />
            <EmergencyExit3D label="NORTH" position={[0, 0, -10.9]} rotationY={0} />
            <EmergencyExit3D label="SOUTH" position={[0, 0, 10.9]} rotationY={Math.PI} />

            {/* ==================================================== */}
            {/* 6 Distinct Interactive Architectural Rooms            */}
            {/* ==================================================== */}

            {/* Zone 1: Classroom (Top-Left) */}
            <group position={[-9.5, 0, -6.5]}>
              {/* Floor Slab */}
              <mesh 
                position={[0, 0.02, 0]} 
                receiveShadow
                onClick={() => onSelectZone('zone-1')}
                onPointerOver={() => setHoveredZoneId('zone-1')}
                onPointerOut={() => setHoveredZoneId(null)}
              >
                <boxGeometry args={[9.5, 0.04, 7.8]} />
                <meshStandardMaterial 
                  {...getZoneFloorStyle(zonesState['zone-1'].status, selectedZoneId === 'zone-1', hoveredZoneId === 'zone-1')}
                  roughness={0.6}
                />
              </mesh>
              {/* Cutaway Walls */}
              <mesh position={[0, 0.9, -3.9]}>
                <boxGeometry args={[9.5, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[-4.75, 0.9, 0]}>
                <boxGeometry args={[0.2, 1.8, 7.8]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[4.75, 0.9, 0]}>
                <boxGeometry args={[0.2, 1.8, 7.8]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* South Corridor Wall with Doorway */}
              <mesh position={[-2.4, 0.9, 3.9]}>
                <boxGeometry args={[4.7, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[2.7, 0.9, 3.9]}>
                <boxGeometry args={[4.1, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* Furniture */}
              <ClassroomFurniture />
              {/* Sprinkler Marker */}
              <SprinklerHead3D position={[0, 2.1, 0]} />
              {/* Active Sprinkler Water Spray Mist */}
              <WaterSprinklerSprayEffect 
                position={[0, 2.1, 0]} 
                active={!!simState?.waterSprinklerActive && (zonesState['zone-1'].status === 'suppressed' || zonesState['zone-1'].status === 'detected_fire' || zonesState['zone-1'].status === 'simulated_fire' || zonesState['zone-1'].status === 'simulated_smoke')} 
              />
              {/* 3D Hazard Visual Effects */}
              {zonesState['zone-1'].status === 'detected_fire' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-1'], 9.5, 7.8)} 
                  isOrigin={true}
                  severityLevel={zonesState['zone-1'].preliminarySeverity?.level}
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-1'].status === 'simulated_fire' && (
                <ClusteredFire3DEffect 
                  position={[0, 0, 0]} 
                  isOrigin={false}
                  severityLevel="moderate"
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-1'].status === 'suppressed' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-1'], 9.5, 7.8)} 
                  isOrigin={false}
                  severityLevel="low"
                  isSuppressed={true}
                />
              )}
              {(zonesState['zone-1'].status === 'detected_smoke' || zonesState['zone-1'].status === 'simulated_smoke') && (
                <Smoke3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-1'], 9.5, 7.8)} 
                  isSimulated={zonesState['zone-1'].status === 'simulated_smoke'} 
                />
              )}
              {/* Camera Marker CAM-01 */}
              <CameraMarker3D
                cameraId="CAM-01"
                zoneName="Classroom"
                zoneId="zone-1"
                position={[-4.2, 1.8, -3.4]}
                rotationY={Math.PI / 4}
                status={zonesState['zone-1'].status}
                isSelected={selectedZoneId === 'zone-1'}
                onClick={() => onSelectZone('zone-1')}
                onInspectInLab={onInspectCameraInLab}
              />
              {/* Room Floating Label */}
              <Html position={[0, 2.4, 0]} center distanceFactor={22}>
                {(() => {
                  const badge = getZoneStatusBadge('Zone 1: Classroom', zonesState['zone-1'].status, simState?.timeStepMinutes);
                  return (
                    <div 
                      onClick={() => onSelectZone('zone-1')}
                      className={`cursor-pointer px-2 py-0.5 rounded font-mono text-[10px] font-bold shadow whitespace-nowrap select-none border transition-all ${badge.bg}`}
                    >
                      {badge.label}
                    </div>
                  );
                })()}
              </Html>
            </group>

            {/* Zone 2: Office (Top-Center) */}
            <group position={[0, 0, -6.5]}>
              {/* Floor Slab */}
              <mesh 
                position={[0, 0.02, 0]} 
                receiveShadow
                onClick={() => onSelectZone('zone-2')}
                onPointerOver={() => setHoveredZoneId('zone-2')}
                onPointerOut={() => setHoveredZoneId(null)}
              >
                <boxGeometry args={[8.8, 0.04, 7.8]} />
                <meshStandardMaterial 
                  {...getZoneFloorStyle(zonesState['zone-2'].status, selectedZoneId === 'zone-2', hoveredZoneId === 'zone-2')}
                  roughness={0.6}
                />
              </mesh>
              {/* Cutaway Walls */}
              <mesh position={[0, 0.9, -3.9]}>
                <boxGeometry args={[8.8, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* South Corridor Wall with Doorway */}
              <mesh position={[-2.4, 0.9, 3.9]}>
                <boxGeometry args={[4.0, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[2.4, 0.9, 3.9]}>
                <boxGeometry args={[4.0, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* Furniture */}
              <OfficeFurniture />
              {/* Sprinkler */}
              <SprinklerHead3D position={[0, 2.1, 0]} />
              {/* Active Sprinkler Water Spray Mist */}
              <WaterSprinklerSprayEffect 
                position={[0, 2.1, 0]} 
                active={!!simState?.waterSprinklerActive && (zonesState['zone-2'].status === 'suppressed' || zonesState['zone-2'].status === 'detected_fire' || zonesState['zone-2'].status === 'simulated_fire' || zonesState['zone-2'].status === 'simulated_smoke')} 
              />
              {/* 3D Hazard Visual Effects */}
              {zonesState['zone-2'].status === 'detected_fire' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-2'], 8.8, 7.8)} 
                  isOrigin={true}
                  severityLevel={zonesState['zone-2'].preliminarySeverity?.level}
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-2'].status === 'simulated_fire' && (
                <ClusteredFire3DEffect 
                  position={[0, 0, 0]} 
                  isOrigin={false}
                  severityLevel="moderate"
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-2'].status === 'suppressed' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-2'], 8.8, 7.8)} 
                  isOrigin={false}
                  severityLevel="low"
                  isSuppressed={true}
                />
              )}
              {(zonesState['zone-2'].status === 'detected_smoke' || zonesState['zone-2'].status === 'simulated_smoke') && (
                <Smoke3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-2'], 8.8, 7.8)} 
                  isSimulated={zonesState['zone-2'].status === 'simulated_smoke'} 
                />
              )}
              {/* Camera Marker CAM-02 */}
              <CameraMarker3D
                cameraId="CAM-02"
                zoneName="Office"
                zoneId="zone-2"
                position={[-3.8, 1.8, -3.4]}
                rotationY={Math.PI / 4}
                status={zonesState['zone-2'].status}
                isSelected={selectedZoneId === 'zone-2'}
                onClick={() => onSelectZone('zone-2')}
                onInspectInLab={onInspectCameraInLab}
              />
              {/* Room Floating Label */}
              <Html position={[0, 2.4, 0]} center distanceFactor={22}>
                {(() => {
                  const badge = getZoneStatusBadge('Zone 2: Office', zonesState['zone-2'].status, simState?.timeStepMinutes);
                  return (
                    <div 
                      onClick={() => onSelectZone('zone-2')}
                      className={`cursor-pointer px-2 py-0.5 rounded font-mono text-[10px] font-bold shadow whitespace-nowrap select-none border transition-all ${badge.bg}`}
                    >
                      {badge.label}
                    </div>
                  );
                })()}
              </Html>
            </group>

            {/* Zone 3: Laboratory (Top-Right) */}
            <group position={[9.5, 0, -6.5]}>
              {/* Floor Slab */}
              <mesh 
                position={[0, 0.02, 0]} 
                receiveShadow
                onClick={() => onSelectZone('zone-3')}
                onPointerOver={() => setHoveredZoneId('zone-3')}
                onPointerOut={() => setHoveredZoneId(null)}
              >
                <boxGeometry args={[9.5, 0.04, 7.8]} />
                <meshStandardMaterial 
                  {...getZoneFloorStyle(zonesState['zone-3'].status, selectedZoneId === 'zone-3', hoveredZoneId === 'zone-3')}
                  roughness={0.4}
                  metalness={0.2}
                />
              </mesh>
              {/* Cutaway Walls */}
              <mesh position={[0, 0.9, -3.9]}>
                <boxGeometry args={[9.5, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* South Corridor Wall with Doorway */}
              <mesh position={[-2.4, 0.9, 3.9]}>
                <boxGeometry args={[4.7, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[2.7, 0.9, 3.9]}>
                <boxGeometry args={[4.1, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* Furniture */}
              <LaboratoryFurniture />
              {/* Sprinkler */}
              <SprinklerHead3D position={[0, 2.1, 0]} />
              {/* Active Sprinkler Water Spray Mist */}
              <WaterSprinklerSprayEffect 
                position={[0, 2.1, 0]} 
                active={!!simState?.waterSprinklerActive && (zonesState['zone-3'].status === 'suppressed' || zonesState['zone-3'].status === 'detected_fire' || zonesState['zone-3'].status === 'simulated_fire' || zonesState['zone-3'].status === 'simulated_smoke')} 
              />
              {/* 3D Hazard Visual Effects */}
              {zonesState['zone-3'].status === 'detected_fire' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-3'], 9.5, 7.8)} 
                  isOrigin={true}
                  severityLevel={zonesState['zone-3'].preliminarySeverity?.level}
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-3'].status === 'simulated_fire' && (
                <ClusteredFire3DEffect 
                  position={[0, 0, 0]} 
                  isOrigin={false}
                  severityLevel="moderate"
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-3'].status === 'suppressed' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-3'], 9.5, 7.8)} 
                  isOrigin={false}
                  severityLevel="low"
                  isSuppressed={true}
                />
              )}
              {(zonesState['zone-3'].status === 'detected_smoke' || zonesState['zone-3'].status === 'simulated_smoke') && (
                <Smoke3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-3'], 9.5, 7.8)} 
                  isSimulated={zonesState['zone-3'].status === 'simulated_smoke'} 
                />
              )}
              {/* Camera Marker CAM-03 */}
              <CameraMarker3D
                cameraId="CAM-03"
                zoneName="Laboratory"
                zoneId="zone-3"
                position={[-4.0, 1.8, -3.4]}
                rotationY={Math.PI / 4}
                status={zonesState['zone-3'].status}
                isSelected={selectedZoneId === 'zone-3'}
                onClick={() => onSelectZone('zone-3')}
                onInspectInLab={onInspectCameraInLab}
              />
              {/* Room Floating Label */}
              <Html position={[0, 2.4, 0]} center distanceFactor={22}>
                {(() => {
                  const badge = getZoneStatusBadge('Zone 3: Laboratory', zonesState['zone-3'].status, simState?.timeStepMinutes);
                  return (
                    <div 
                      onClick={() => onSelectZone('zone-3')}
                      className={`cursor-pointer px-2 py-0.5 rounded font-mono text-[10px] font-bold shadow whitespace-nowrap select-none border transition-all ${badge.bg}`}
                    >
                      {badge.label}
                    </div>
                  );
                })()}
              </Html>
            </group>

            {/* Zone 4: Library (Bottom-Left) */}
            <group position={[-9.5, 0, 6.5]}>
              {/* Floor Slab */}
              <mesh 
                position={[0, 0.02, 0]} 
                receiveShadow
                onClick={() => onSelectZone('zone-4')}
                onPointerOver={() => setHoveredZoneId('zone-4')}
                onPointerOut={() => setHoveredZoneId(null)}
              >
                <boxGeometry args={[9.5, 0.04, 7.8]} />
                <meshStandardMaterial 
                  {...getZoneFloorStyle(zonesState['zone-4'].status, selectedZoneId === 'zone-4', hoveredZoneId === 'zone-4')}
                  roughness={0.7}
                />
              </mesh>
              {/* Cutaway Walls */}
              <mesh position={[0, 0.9, 3.9]}>
                <boxGeometry args={[9.5, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[-4.75, 0.9, 0]}>
                <boxGeometry args={[0.2, 1.8, 7.8]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[4.75, 0.9, 0]}>
                <boxGeometry args={[0.2, 1.8, 7.8]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* North Corridor Wall with Doorway */}
              <mesh position={[-2.4, 0.9, -3.9]}>
                <boxGeometry args={[4.7, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[2.7, 0.9, -3.9]}>
                <boxGeometry args={[4.1, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* Furniture */}
              <LibraryFurniture />
              {/* Sprinkler */}
              <SprinklerHead3D position={[0, 2.1, 0]} />
              {/* Active Sprinkler Water Spray Mist */}
              <WaterSprinklerSprayEffect 
                position={[0, 2.1, 0]} 
                active={!!simState?.waterSprinklerActive && (zonesState['zone-4'].status === 'suppressed' || zonesState['zone-4'].status === 'detected_fire' || zonesState['zone-4'].status === 'simulated_fire' || zonesState['zone-4'].status === 'simulated_smoke')} 
              />
              {/* 3D Hazard Visual Effects */}
              {zonesState['zone-4'].status === 'detected_fire' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-4'], 9.5, 7.8)} 
                  isOrigin={true}
                  severityLevel={zonesState['zone-4'].preliminarySeverity?.level}
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-4'].status === 'simulated_fire' && (
                <ClusteredFire3DEffect 
                  position={[0, 0, 0]} 
                  isOrigin={false}
                  severityLevel="moderate"
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-4'].status === 'suppressed' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-4'], 9.5, 7.8)} 
                  isOrigin={false}
                  severityLevel="low"
                  isSuppressed={true}
                />
              )}
              {(zonesState['zone-4'].status === 'detected_smoke' || zonesState['zone-4'].status === 'simulated_smoke') && (
                <Smoke3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-4'], 9.5, 7.8)} 
                  isSimulated={zonesState['zone-4'].status === 'simulated_smoke'} 
                />
              )}
              {/* Camera Marker CAM-04 */}
              <CameraMarker3D
                cameraId="CAM-04"
                zoneName="Library"
                zoneId="zone-4"
                position={[-4.2, 1.8, 3.4]}
                rotationY={-Math.PI / 4}
                status={zonesState['zone-4'].status}
                isSelected={selectedZoneId === 'zone-4'}
                onClick={() => onSelectZone('zone-4')}
                onInspectInLab={onInspectCameraInLab}
              />
              {/* Room Floating Label */}
              <Html position={[0, 2.4, 0]} center distanceFactor={22}>
                {(() => {
                  const badge = getZoneStatusBadge('Zone 4: Library', zonesState['zone-4'].status, simState?.timeStepMinutes);
                  return (
                    <div 
                      onClick={() => onSelectZone('zone-4')}
                      className={`cursor-pointer px-2 py-0.5 rounded font-mono text-[10px] font-bold shadow whitespace-nowrap select-none border transition-all ${badge.bg}`}
                    >
                      {badge.label}
                    </div>
                  );
                })()}
              </Html>
            </group>

            {/* Zone 5: Storage (Bottom-Center) */}
            <group position={[0, 0, 6.5]}>
              {/* Floor Slab */}
              <mesh 
                position={[0, 0.02, 0]} 
                receiveShadow
                onClick={() => onSelectZone('zone-5')}
                onPointerOver={() => setHoveredZoneId('zone-5')}
                onPointerOut={() => setHoveredZoneId(null)}
              >
                <boxGeometry args={[8.8, 0.04, 7.8]} />
                <meshStandardMaterial 
                  {...getZoneFloorStyle(zonesState['zone-5'].status, selectedZoneId === 'zone-5', hoveredZoneId === 'zone-5')}
                  roughness={0.8}
                />
              </mesh>
              {/* Cutaway Walls */}
              <mesh position={[0, 0.9, 3.9]}>
                <boxGeometry args={[8.8, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* North Corridor Wall with Doorway */}
              <mesh position={[-2.4, 0.9, -3.9]}>
                <boxGeometry args={[4.0, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[2.4, 0.9, -3.9]}>
                <boxGeometry args={[4.0, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* Furniture */}
              <StorageFurniture />
              {/* Sprinkler */}
              <SprinklerHead3D position={[0, 2.1, 0]} />
              {/* Active Sprinkler Water Spray Mist */}
              <WaterSprinklerSprayEffect 
                position={[0, 2.1, 0]} 
                active={!!simState?.waterSprinklerActive && (zonesState['zone-5'].status === 'suppressed' || zonesState['zone-5'].status === 'detected_fire' || zonesState['zone-5'].status === 'simulated_fire' || zonesState['zone-5'].status === 'simulated_smoke')} 
              />
              {/* 3D Hazard Visual Effects */}
              {zonesState['zone-5'].status === 'detected_fire' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-5'], 8.8, 7.8)} 
                  isOrigin={true}
                  severityLevel={zonesState['zone-5'].preliminarySeverity?.level}
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-5'].status === 'simulated_fire' && (
                <ClusteredFire3DEffect 
                  position={[0, 0, 0]} 
                  isOrigin={false}
                  severityLevel="moderate"
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-5'].status === 'suppressed' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-5'], 8.8, 7.8)} 
                  isOrigin={false}
                  severityLevel="low"
                  isSuppressed={true}
                />
              )}
              {(zonesState['zone-5'].status === 'detected_smoke' || zonesState['zone-5'].status === 'simulated_smoke') && (
                <Smoke3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-5'], 8.8, 7.8)} 
                  isSimulated={zonesState['zone-5'].status === 'simulated_smoke'} 
                />
              )}
              {/* Camera Marker CAM-05 */}
              <CameraMarker3D
                cameraId="CAM-05"
                zoneName="Storage"
                zoneId="zone-5"
                position={[-3.8, 1.8, 3.4]}
                rotationY={-Math.PI / 4}
                status={zonesState['zone-5'].status}
                isSelected={selectedZoneId === 'zone-5'}
                onClick={() => onSelectZone('zone-5')}
                onInspectInLab={onInspectCameraInLab}
              />
              {/* Room Floating Label */}
              <Html position={[0, 2.4, 0]} center distanceFactor={22}>
                {(() => {
                  const badge = getZoneStatusBadge('Zone 5: Storage', zonesState['zone-5'].status, simState?.timeStepMinutes);
                  return (
                    <div 
                      onClick={() => onSelectZone('zone-5')}
                      className={`cursor-pointer px-2 py-0.5 rounded font-mono text-[10px] font-bold shadow whitespace-nowrap select-none border transition-all ${badge.bg}`}
                    >
                      {badge.label}
                    </div>
                  );
                })()}
              </Html>
            </group>

            {/* Zone 6: Electrical Room (Bottom-Right) */}
            <group position={[9.5, 0, 6.5]}>
              {/* Floor Slab with Safety Yellow Accent */}
              <mesh 
                position={[0, 0.02, 0]} 
                receiveShadow
                onClick={() => onSelectZone('zone-6')}
                onPointerOver={() => setHoveredZoneId('zone-6')}
                onPointerOut={() => setHoveredZoneId(null)}
              >
                <boxGeometry args={[9.5, 0.04, 7.8]} />
                <meshStandardMaterial 
                  {...getZoneFloorStyle(zonesState['zone-6'].status, selectedZoneId === 'zone-6', hoveredZoneId === 'zone-6')}
                  roughness={0.7}
                />
              </mesh>
              {/* Cutaway Walls */}
              <mesh position={[0, 0.9, 3.9]}>
                <boxGeometry args={[9.5, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* North Corridor Wall with Doorway */}
              <mesh position={[-2.4, 0.9, -3.9]}>
                <boxGeometry args={[4.7, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[2.7, 0.9, -3.9]}>
                <boxGeometry args={[4.1, 1.8, 0.2]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* Furniture */}
              <ElectricalRoomFurniture />
              {/* Ceiling CO2 Diffuser Nozzle */}
              <group position={[0, 2.1, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.08, 0.18, 0.25, 12]} />
                  <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.3} />
                </mesh>
              </group>
              {/* Active CO2 Vapor Blanket Effect */}
              <CO2VaporEffect 
                position={[0, 0, 0]} 
                active={!!simState?.co2FloodActive && (zonesState['zone-6'].status === 'suppressed' || zonesState['zone-6'].status === 'detected_fire' || zonesState['zone-6'].status === 'simulated_fire')} 
              />
              {/* 3D Hazard Visual Effects */}
              {zonesState['zone-6'].status === 'detected_fire' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-6'], 9.5, 7.8)} 
                  isOrigin={true}
                  severityLevel={zonesState['zone-6'].preliminarySeverity?.level}
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-6'].status === 'simulated_fire' && (
                <ClusteredFire3DEffect 
                  position={[0, 0, 0]} 
                  isOrigin={false}
                  severityLevel="moderate"
                  isSuppressed={false}
                />
              )}
              {zonesState['zone-6'].status === 'suppressed' && (
                <ClusteredFire3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-6'], 9.5, 7.8)} 
                  isOrigin={false}
                  severityLevel="low"
                  isSuppressed={true}
                />
              )}
              {(zonesState['zone-6'].status === 'detected_smoke' || zonesState['zone-6'].status === 'simulated_smoke') && (
                <Smoke3DEffect 
                  position={calculateBoundingBoxCentroid(zonesState['zone-6'], 9.5, 7.8)} 
                  isSimulated={zonesState['zone-6'].status === 'simulated_smoke'} 
                />
              )}
              {/* Camera Marker CAM-06 */}
              <CameraMarker3D
                cameraId="CAM-06"
                zoneName="Electrical Room"
                zoneId="zone-6"
                position={[-4.0, 1.8, 3.4]}
                rotationY={-Math.PI / 4}
                status={zonesState['zone-6'].status}
                isSelected={selectedZoneId === 'zone-6'}
                onClick={() => onSelectZone('zone-6')}
                onInspectInLab={onInspectCameraInLab}
              />
              {/* Room Floating Label */}
              <Html position={[0, 2.4, 0]} center distanceFactor={22}>
                {(() => {
                  const badge = getZoneStatusBadge('Zone 6: Electrical', zonesState['zone-6'].status, simState?.timeStepMinutes);
                  return (
                    <div 
                      onClick={() => onSelectZone('zone-6')}
                      className={`cursor-pointer px-2 py-0.5 rounded font-mono text-[10px] font-bold shadow whitespace-nowrap select-none border transition-all ${badge.bg}`}
                    >
                      {badge.label}
                    </div>
                  );
                })()}
              </Html>
            </group>
          </Canvas>
        </WebGLErrorBoundary>

        {/* Selected Room Overlay HUD Card (Top-Left) */}
        {selectedZone && (
          <div className="absolute top-4 left-4 p-3.5 rounded-xl bg-slate-900/95 border border-slate-700/80 text-xs font-mono text-white shadow-2xl backdrop-blur-md max-w-xs space-y-2 select-none pointer-events-auto">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-orange-400">
                {selectedZone.name.toUpperCase()} ({selectedZone.zoneId})
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {selectedZone.cameraId}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedZone.status === 'detected_fire' 
                    ? 'bg-red-950 text-red-300 border border-red-500 animate-pulse' 
                    : selectedZone.status === 'detected_smoke' 
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-400' 
                    : selectedZone.status === 'simulated_fire'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500'
                    : selectedZone.status === 'simulated_smoke'
                    ? 'bg-yellow-950 text-yellow-300 border border-yellow-600'
                    : selectedZone.status === 'suppressed'
                    ? 'bg-sky-950 text-sky-300 border border-sky-400'
                    : selectedZone.status === 'normal' 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {selectedZone.status === 'detected_fire' ? '🔥 DETECTED FIRE' :
                   selectedZone.status === 'simulated_fire' ? '⚠️ SIMULATED FIRE' :
                   selectedZone.status === 'detected_smoke' ? '💨 DETECTED SMOKE' :
                   selectedZone.status === 'simulated_smoke' ? '🌫️ SIMULATED SMOKE' :
                   selectedZone.status === 'suppressed' ? '💧 SUPPRESSED' :
                   selectedZone.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dedicated Suppression:</span>
                <span className="text-slate-200 uppercase font-semibold">
                  {selectedZone.suppressionType === 'water' ? 'Water Sprinkler Head' : 'CO₂ Flooding Nozzle'}
                </span>
              </div>
              {selectedZone.detectionResult && (
                <div className="flex justify-between">
                  <span className="text-slate-400">YOLO Confidence:</span>
                  <span className="text-white font-bold">
                    {(selectedZone.detectionResult.highestConfidence * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {selectedZone.preliminarySeverity && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Preliminary Severity:</span>
                  <span className={`font-bold uppercase ${
                    selectedZone.preliminarySeverity.level === 'critical' ? 'text-red-400' :
                    selectedZone.preliminarySeverity.level === 'high' ? 'text-orange-400' :
                    selectedZone.preliminarySeverity.level === 'moderate' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {selectedZone.preliminarySeverity.level} ({selectedZone.preliminarySeverity.score}/100)
                  </span>
                </div>
              )}
            </div>

            {onInspectZone && (
              <button
                onClick={() => onInspectZone(selectedZone.zoneId)}
                className="w-full mt-2 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Camera Feed</span>
              </button>
            )}
          </div>
        )}

        {/* Orbit / Navigation Controls Helper (Top-Right) */}
        <div className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 border border-panel-border text-[10px] font-mono text-slate-400 pointer-events-none flex items-center gap-2">
          <span>Left-Click Drag: Rotate</span>
          <span>•</span>
          <span>Scroll: Zoom</span>
          <span>•</span>
          <span>Right-Click: Pan</span>
        </div>

        {/* Compact Legend (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-[#090e18]/95 border border-panel-border text-[10px] font-mono text-slate-300 shadow-xl backdrop-blur-md space-y-2 select-none pointer-events-none max-w-sm">
          <div className="font-bold text-white uppercase text-[11px] pb-1 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span>3D Digital Twin Legend</span>
            </span>
            <span className="text-[9px] text-slate-400 font-normal">Real vs Simulated</span>
          </div>

          {/* 4 Core State Badges */}
          <div className="grid grid-cols-2 gap-1.5 pb-1 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block animate-pulse shrink-0" />
              <span className="text-red-300 font-semibold">Detected Fire (YOLO)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
              <span className="text-amber-300 font-semibold">Simulated Spread</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shrink-0" />
              <span className="text-sky-300 font-semibold">Suppressed (Sim)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block shrink-0" />
              <span className="text-slate-400">Untested / Normal</span>
            </div>
          </div>

          {/* Equipment Indicators */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400">
            <div className="flex items-center gap-1.5">
              <Video className="w-3 h-3 text-cyan-400" />
              <span>Camera (CAM-01..06)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3 h-3 text-sky-400" />
              <span>Water Sprinkler & Pipe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="w-3 h-3 text-red-400" />
              <span>CO₂ Diffuser & Pipe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Emergency Exit (3)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Annotation & Projection Disclaimer Footer Bar */}
      <div className="px-4 py-2.5 border-t border-panel-border bg-[#0a0f18]/90 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
          <span>
            <strong>Planar 2D Projection:</strong> Flame coordinates estimated from YOLO bounding box centroid (cx, cy) to 3D floor (x, z) as a planar viewport approximation, not 3D stereoscopy.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-orange-400 font-semibold">T+{simState?.timeStepMinutes || 0}m Spread Kinetics</span>
          <span>•</span>
          <span className={simState?.waterSprinklerActive ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
            {simState?.waterSprinklerActive ? '💧 Water Sprinklers Discharging' : 'Sprinklers Armed'}
          </span>
          <span>•</span>
          <span className={simState?.co2FloodActive ? 'text-red-400 font-bold' : 'text-slate-400'}>
            {simState?.co2FloodActive ? '💨 CO₂ Flooding Discharging' : 'CO₂ Armed'}
          </span>
        </div>
      </div>
    </div>
  );
};
