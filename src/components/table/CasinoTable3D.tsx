import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

interface CasinoTable3DProps {
    color?: string; // Felt color
    width?: number; // Table width
    depth?: number; // Table depth
}

const TableModel: React.FC<{ color: string; width: number; depth: number }> = ({ color, width, depth }) => {
    // 1. Felt Shape (Inner)
    const feltShape = useMemo(() => {
        const s = new THREE.Shape();
        const w = width / 2;
        const h = depth / 2;
        const r = 2;
        s.moveTo(-w + r, -h);
        s.lineTo(w - r, -h);
        s.quadraticCurveTo(w, -h, w, -h + r);
        s.lineTo(w, h - r);
        s.quadraticCurveTo(w, h, w - r, h);
        s.lineTo(-w + r, h);
        s.quadraticCurveTo(-w, h, -w, h - r);
        s.lineTo(-w, -h + r);
        s.quadraticCurveTo(-w, -h, -w + r, -h);
        return s;
    }, [width, depth]);

    // 2. Wood Racetrack Shape (Middle Ring) - Thinner borders
    const woodShape = useMemo(() => {
        const s = new THREE.Shape();
        const w = (width / 2) + 0.6; // Reduced from 1.2
        const h = (depth / 2) + 0.6;
        const r = 2.5; // Slightly tighter radius
        s.moveTo(-w + r, -h);
        s.lineTo(w - r, -h);
        s.quadraticCurveTo(w, -h, w, -h + r);
        s.lineTo(w, h - r);
        s.quadraticCurveTo(w, h, w - r, h);
        s.lineTo(-w + r, h);
        s.quadraticCurveTo(-w, h, -w, h - r);
        s.lineTo(-w, -h + r);
        s.quadraticCurveTo(-w, -h, -w + r, -h);

        // Hole for felt
        const hole = new THREE.Path();
        const iw = width / 2;
        const ih = depth / 2;
        const ir = 2;
        hole.moveTo(-iw + ir, -ih);
        hole.lineTo(iw - ir, -ih);
        hole.quadraticCurveTo(iw, -ih, iw, -ih + ir);
        hole.lineTo(iw, ih - ir);
        hole.quadraticCurveTo(iw, ih, iw - ir, ih);
        hole.lineTo(-iw + ir, ih);
        hole.quadraticCurveTo(-iw, ih, -iw, ih - ir);
        hole.lineTo(-iw, -ih + ir);
        hole.quadraticCurveTo(-iw, -ih, -iw + ir, -ih);
        s.holes.push(hole);

        return s;
    }, [width, depth]);

    // 3. Leather Rail Shape (Outer Ring) - Thinner
    const railShape = useMemo(() => {
        // Outer boundary
        const s = new THREE.Shape();
        const w = (width / 2) + 1.5; // Reduced from 2.5
        const h = (depth / 2) + 1.5;
        const r = 3.5;
        s.moveTo(-w + r, -h);
        s.lineTo(w - r, -h);
        s.quadraticCurveTo(w, -h, w, -h + r);
        s.lineTo(w, h - r);
        s.quadraticCurveTo(w, h, w - r, h);
        s.lineTo(-w + r, h);
        s.quadraticCurveTo(-w, h, -w, h - r);
        s.lineTo(-w, -h + r);
        s.quadraticCurveTo(-w, -h, -w + r, -h);

        // Hole for Wood Racetrack
        const hole = new THREE.Path();
        const iw = (width / 2) + 0.55; // Match wood boundary
        const ih = (depth / 2) + 0.55;
        const ir = 2.5;
        hole.moveTo(-iw + ir, -ih);
        hole.lineTo(iw - ir, -ih);
        hole.quadraticCurveTo(iw, -ih, iw, -ih + ir);
        hole.lineTo(iw, ih - ir);
        hole.quadraticCurveTo(iw, ih, iw - ir, ih);
        hole.lineTo(-iw + ir, ih);
        hole.quadraticCurveTo(-iw, ih, -iw, ih - ir);
        hole.lineTo(-iw, -ih + ir);
        hole.quadraticCurveTo(-iw, -ih, -iw + ir, -ih);
        s.holes.push(hole);

        return s;
    }, [width, depth]);

    const railExtrudeSettings = useMemo(() => ({
        steps: 2,
        depth: 0.6, // Slightly lower profile
        bevelEnabled: true,
        bevelThickness: 0.4,
        bevelSize: 0.4,
        bevelSegments: 6,
    }), []);

    return (
        <group>
            {/* 1. Felt Surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <shapeGeometry args={[feltShape]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.9}
                    metalness={0.0}
                />
            </mesh>

            {/* 2. Wood Racetrack (Border) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
                <shapeGeometry args={[woodShape]} />
                <meshStandardMaterial
                    color="#855E42" // Lighter, warmer wood (Teak/Oak)
                    roughness={0.2}
                    metalness={0.1}
                />
            </mesh>

            {/* 3. Leather Armrest (Raised Rail) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} castShadow receiveShadow>
                <extrudeGeometry args={[railShape, railExtrudeSettings]} />
                <meshStandardMaterial
                    color="#1a0505" // Dark leather
                    roughness={0.4}
                    metalness={0.2}
                />
            </mesh>
        </group>
    );
};

const CasinoTable3D: React.FC<CasinoTable3DProps> = ({
    color = '#156e46', // Classic Green default
    width = 22,
    depth = 12
}) => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <Canvas
                shadows
                // Camera much closer: [0, 9, 11]
                camera={{ position: [0, 9, 11], fov: 40 }}
                onCreated={({ camera }) => camera.lookAt(0, -1.5, 0)}
                dpr={[1, 2]}
            >
                {/* Dark Background */}
                <color attach="background" args={['#000000']} />

                {/* General Directional Light - mimics ceiling lighting */}
                <directionalLight
                    position={[0, 10, 5]}
                    intensity={1.5}
                    castShadow
                />

                {/* Key Light (Spotlight) - Focuses on the center area */}
                <spotLight
                    position={[0, 20, 0]}
                    angle={0.6}
                    penumbra={0.5}
                    intensity={3.0}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />

                {/* Fill Light - Ensures nothing is pitch black */}
                <ambientLight intensity={1.0} />

                {/* Rim Light - Highlights the back edge of the table/rail */}
                <spotLight
                    position={[0, 5, -15]}
                    angle={1}
                    penumbra={1}
                    intensity={5}
                    color="#ffd700" // Warm rim light
                    distance={50}
                />

                {/* Environment for reflections */}
                <Environment preset="night" blur={0.6} />

                <group position={[0, -2, 0]}>
                    <TableModel color={color} width={width} depth={depth} />
                </group>

                {/* Fog to blend edges */}
                <fog attach="fog" args={['#0a0a0a', 15, 30]} />
            </Canvas>
        </div>
    );
};

export default React.memo(CasinoTable3D);
