
import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WHEEL_ORDER, getNumberColor } from '../../services/roulette/constants';

interface RouletteWheel3DProps {
    spinning: boolean;
    onBallLand?: (winningNumber: string) => void;  // Callback when ball lands
    onSpinComplete?: () => void;
}


const WHEEL_SIZE = 38;
const SEGMENT_ANGLE = (Math.PI * 2) / WHEEL_SIZE;
const GAP = 0.015;
const USABLE_ANGLE = SEGMENT_ANGLE - GAP;
const VISUAL_SLOT_OFFSET = -4; // Rotate visual mesh back by 4 slots
// Derived constants for World-Based Mapping
const VISUAL_ROT = VISUAL_SLOT_OFFSET * SEGMENT_ANGLE; // Total visual rotation applied to segments
const WEDGE_CENTER_SHIFT = GAP / 2; // Each wedge is shifted by GAP/2 to center it
const BASE_ROT = 0; // Calibration constant for 0-degree direction (adjust if needed)
const TWO_PI = Math.PI * 2;

// Two-phase landing constants
const POCKET_R = 2.5;          // Pocket radius
const DROP_START_R = 4.0;      // Starting radius
const DROP_RATE = 0.9;         // Radius shrink rate
const DAMP_FREE = 0.993;       // Damping when outside pocket
const DAMP_POCKET = 0.985;     // Damping inside pocket (stronger to slow down)
const LOCK_SPEED = 0.15;       // Lock when angular speed below this

// Combined geometry rotation offset
const GEOM_ROT = VISUAL_ROT + WEDGE_CENTER_SHIFT + BASE_ROT;

export const RouletteWheel3D: React.FC<RouletteWheel3DProps> = ({
    spinning,
    onBallLand,
    onSpinComplete
}) => {
    const wheelRef = useRef<THREE.Group>(null);
    const ballRef = useRef<THREE.Mesh>(null);

    // Animation state
    const speedRef = useRef(0);
    const ballSpeedRef = useRef(0);
    const ballRadiusRef = useRef(3.5);
    const ballHeightRef = useRef(0.2);
    const ballAngleRef = useRef(0);
    const isBallDropping = useRef(false);
    const inPocketRef = useRef(false); // NEW: Track if ball has entered pocket
    const resultFoundRef = useRef(false);

    const [landed, setLanded] = useState(false);

    useEffect(() => {
        if (spinning) {
            speedRef.current = 6; // Wheel spin speed
            ballSpeedRef.current = -10; // Ball spins relative to wheel
            ballRadiusRef.current = DROP_START_R; // Start at outer edge
            ballHeightRef.current = 0.25;
            isBallDropping.current = false;
            inPocketRef.current = false; // Reset pocket state
            resultFoundRef.current = false;
            hasReportedRef.current = false;
            landedAngleRef.current = null;
            setLanded(false);
            setCalculatedWinner(null);
        }
    }, [spinning]);

    // Track the winning number once calculated
    const [calculatedWinner, setCalculatedWinner] = useState<string | null>(null);
    const hasReportedRef = useRef(false);
    // FIXED angle when ball lands - this should not change after landing
    const landedAngleRef = useRef<number | null>(null);
    const finalIndexRef = useRef<number | null>(null);

    useFrame((state, delta) => {
        if (!wheelRef.current || !ballRef.current) return;

        // 1. Wheel Rotation (Y-axis) - always rotate
        if (spinning || speedRef.current > 0.01) {
            if (spinning) {
                speedRef.current *= 0.995; // Slow deceleration
            } else {
                speedRef.current *= 0.9; // Fast stop when not spinning
            }
            wheelRef.current.rotation.y += speedRef.current * delta;
        }

        // 2. Ball Logic - TWO-PHASE LANDING
        if (spinning && !landed) {
            // 1) Update angle
            ballAngleRef.current += ballSpeedRef.current * delta;

            // 2) Decide when to start dropping
            if (Math.abs(ballSpeedRef.current) < 3 && !isBallDropping.current) {
                isBallDropping.current = true;
            }

            // 3) Drop phase: shrink radius until pocket, then fix
            if (isBallDropping.current && !inPocketRef.current) {
                ballRadiusRef.current = Math.max(POCKET_R, ballRadiusRef.current - DROP_RATE * delta);
                ballHeightRef.current = 0.18 + Math.random() * 0.04;

                if (ballRadiusRef.current <= POCKET_R + 1e-4) {
                    inPocketRef.current = true;
                    ballHeightRef.current = 0.25; // Stable height in pocket
                }
            }

            // 4) Damping: slower outside, stronger inside pocket
            ballSpeedRef.current *= inPocketRef.current ? DAMP_POCKET : DAMP_FREE;

            // 5) Update ball local position (ball is wheel child, local = wheel frame)
            const bx = Math.cos(ballAngleRef.current) * ballRadiusRef.current;
            const bz = Math.sin(ballAngleRef.current) * ballRadiusRef.current;
            ballRef.current.position.set(bx, ballHeightRef.current, bz);

            // 6) Only lock when in pocket AND angular speed is very small (natural stop)
            if (inPocketRef.current && Math.abs(ballSpeedRef.current) < LOCK_SPEED) {
                setLanded(true);

                // Use ball's LOCAL position to calculate angle (no world mapping needed)
                let localAngle = Math.atan2(bz, bx); // [-pi, pi]
                if (localAngle < 0) localAngle += TWO_PI;

                // localAngle is wheel frame; segments have GEOM_ROT offset
                let rel = localAngle - GEOM_ROT;
                rel = rel % TWO_PI;
                if (rel < 0) rel += TWO_PI;

                // Calculate which segment
                const idx = ((Math.floor(rel / SEGMENT_ANGLE) % WHEEL_SIZE) + WHEEL_SIZE) % WHEEL_SIZE;

                finalIndexRef.current = idx;
                setCalculatedWinner(WHEEL_ORDER[idx]);

                // Store the ACTUAL angle (not snapped center) for natural stop
                landedAngleRef.current = rel; // Segments frame angle
            }

        } else if (landed && landedAngleRef.current !== null) {
            // LOCKED MODE: Ball fixed at its natural stop position
            const radius = POCKET_R;

            // landedAngleRef is segments frame angle, convert back to wheel frame
            const localAngle = landedAngleRef.current + GEOM_ROT;

            const ballX = Math.cos(localAngle) * radius;
            const ballZ = Math.sin(localAngle) * radius;
            ballRef.current.position.set(ballX, 0.25, ballZ);

            // Only report result once wheel has COMPLETELY stopped
            if (!hasReportedRef.current && speedRef.current < 0.03) {
                hasReportedRef.current = true;

                // Use the stored final index directly
                if (finalIndexRef.current !== null) {
                    const winner = WHEEL_ORDER[finalIndexRef.current];
                    onBallLand?.(winner);
                    setTimeout(() => onSpinComplete?.(), 1000);
                }
            }
        }
    });

    // Helper for extrude geometry
    const { numberShape, pocketShape } = useMemo(() => {
        const createArcShape = (inner: number, outer: number, angle: number) => {
            const shape = new THREE.Shape();
            shape.moveTo(inner, 0);
            shape.lineTo(outer, 0);
            shape.absarc(0, 0, outer, 0, angle, false);
            shape.lineTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
            shape.absarc(0, 0, inner, angle, 0, true);
            return shape;
        };

        const numberShape = createArcShape(3.3, 4.2, USABLE_ANGLE);
        const pocketShape = createArcShape(1.8, 3.3, USABLE_ANGLE);

        return { numberShape, pocketShape };
    }, []);

    // Generate segments
    const segments = useMemo(() => {
        const extrudeSettings = { depth: 0.04, bevelEnabled: false };
        const pocketSettings = { depth: 0.02, bevelEnabled: false };

        return WHEEL_ORDER.map((num, i) => {
            const color = getNumberColor(num);
            let hex, emissiveHex;
            if (color === 'green') {
                hex = '#10b981';
                emissiveHex = '#065f46';
            } else if (color === 'red') {
                hex = '#ef4444';
                emissiveHex = '#991b1b';
            } else {
                hex = '#171717';
                emissiveHex = '#222222';
            }

            // Rotate the group to center the wedge in the grid
            const rotY = i * SEGMENT_ANGLE + GAP / 2;

            return (
                <group key={num} rotation={[0, rotY, 0]}>
                    {/* 1. Number Ring Wedge (Solid Extruded) - Lifted to 0.1 */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                        <extrudeGeometry args={[numberShape, extrudeSettings]} />
                        <meshBasicMaterial color={hex} />
                    </mesh>

                    {/* Number Label - Lifted to 0.15 */}
                    <group
                        position={[
                            Math.cos(USABLE_ANGLE / 2) * 3.75,
                            0.15,
                            Math.sin(USABLE_ANGLE / 2) * 3.75
                        ]}
                        rotation={[-Math.PI / 2, 0, Math.PI / 2 - USABLE_ANGLE / 2]}
                    >
                        <NumberLabel number={num} color={color} />
                    </group>

                    {/* 2. Pocket Floor - Lifted to 0.1 */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                        <extrudeGeometry args={[pocketShape, pocketSettings]} />
                        <meshBasicMaterial color={hex} />
                    </mesh>

                    {/* Separator / Fret (Radial Metal Bar) - Lifted to 0.15 */}
                    <mesh
                        position={[3.0, 0.15, 0]}
                        rotation={[0, -GAP / 2, 0]}
                        renderOrder={10}
                    >
                        <boxGeometry args={[2.4, 0.1, 0.04]} />
                        <meshStandardMaterial
                            color="#e5e7eb"
                            metalness={0.9}
                            roughness={0.2}
                        />
                    </mesh>

                </group >
            );
        });
    }, [numberShape, pocketShape]);

    return (
        <group>
            {/* 1. STATIC OUTER BODY */}
            {/* Wood Rim - simple outer frame */}
            <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[5.2, 5.0, 0.4, 64]} />
                <meshStandardMaterial
                    color="#8b5a2b"
                    roughness={0.5}
                    metalness={0.1}
                />
            </mesh>
            {/* Bowl Slope - lowered deep to not block pocket */}
            <mesh position={[0, -1.2, 0]}>
                <cylinderGeometry args={[4.8, 2.2, 1.0, 64]} />
                <meshStandardMaterial
                    color="#2d1b0e"
                    roughness={0.8}
                />
            </mesh>

            {/* Deflectors */}
            {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(angle) * 4.5, 0.1, Math.sin(angle) * 4.5]} rotation={[0, -angle, 0]}>
                        <octahedronGeometry args={[0.12, 0]} />
                        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                    </mesh>
                );
            })}

            {/* 2. ROTATING WHEEL ASSEMBLY */}
            <group ref={wheelRef} position={[0, 0, 0]}>

                {/* Center Dome - restored for 3D feel */}
                <mesh position={[0, 0.15, 0]}>
                    <cylinderGeometry args={[1.4, 1.7, 0.6, 64]} />
                    <meshStandardMaterial color="#8b5a2b" roughness={0.3} />
                </mesh>

                {/* Turret */}
                <group position={[0, 0.8, 0]}>
                    <mesh>
                        <cylinderGeometry args={[0.3, 0.4, 0.8, 32]} />
                        <meshStandardMaterial color="#fcd34d" metalness={1} roughness={0.1} />
                    </mesh>
                    <mesh position={[0, 0.5, 0]}>
                        <sphereGeometry args={[0.3]} />
                        <meshStandardMaterial color="#fcd34d" metalness={1} roughness={0.1} />
                    </mesh>
                    {/* 4 Arms */}
                    {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
                        <mesh key={i} rotation={[0, rot, 0]} position={[0, 0, 0]}>
                            <mesh rotation={[0, 0, Math.PI / 2]} position={[0.6, 0, 0]}>
                                <cylinderGeometry args={[0.08, 0.05, 1.2, 16]} />
                                <meshStandardMaterial color="#fcd34d" metalness={1} roughness={0.1} />
                            </mesh>
                            <mesh position={[1.2, 0, 0]}>
                                <sphereGeometry args={[0.12]} />
                                <meshStandardMaterial color="#fcd34d" metalness={1} roughness={0.1} />
                            </mesh>
                        </mesh>
                    ))}
                </group>

                {/* Segments (Solid Extruded) - ROTATED BY VISUAL_SLOT_OFFSET based on User Plan A */}
                <group rotation={[0, VISUAL_SLOT_OFFSET * SEGMENT_ANGLE, 0]}>
                    {segments}
                </group>

                {/* Inner Ring (Gold) - Between Number Ring and Pocket */}
                <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[3.25, 3.35, 64]} />
                    <meshStandardMaterial color="#fcd34d" metalness={0.8} />
                </mesh>

                {/* Main Bed Cylinder (Background) */}
                <mesh position={[0, -0.1, 0]}>
                    <cylinderGeometry args={[4.2, 4.2, 0.1, 64]} />
                    <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
                </mesh>

                {/* Ball - Now Child of Wheel (No coordinate sync issues) */}
                <mesh ref={ballRef} castShadow>
                    <sphereGeometry args={[0.1, 32, 32]} />
                    <meshStandardMaterial color="#fff" metalness={0.2} roughness={0} />
                </mesh>

            </group>

        </group>
    );
};

// Sub-component for individual number label to avoid re-rendering heavy textures
const NumberLabel = ({ number, color }: { number: string, color: string }) => {
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, 128, 128);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 60px "Times New Roman", serif'; // Classic font
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Center is 64,64
            // We want text upright relative to the canvas
            ctx.translate(64, 64);
            // ctx.rotate(-Math.PI / 2); // Do rotation in Mesh 
            ctx.fillText(number, 0, 0);
        }
        return new THREE.CanvasTexture(canvas);
    }, [number]);

    return (
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshBasicMaterial map={texture} transparent opacity={1} side={THREE.DoubleSide} depthTest={false} />
        </mesh>
    );
};
