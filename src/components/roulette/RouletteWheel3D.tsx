
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WHEEL_ORDER, getNumberColor } from '../../services/roulette/constants';

interface RouletteWheel3DProps {
    spinning: boolean;
    winningNumber: string | null;
    onSpinComplete?: () => void;
}


const WHEEL_SIZE = 38;
const SEGMENT_ANGLE = (Math.PI * 2) / WHEEL_SIZE;

export const RouletteWheel3D: React.FC<RouletteWheel3DProps> = ({
    spinning,
    winningNumber,
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
    const resultFoundRef = useRef(false);

    useEffect(() => {
        if (spinning) {
            speedRef.current = 5;
            ballSpeedRef.current = -4;
            ballRadiusRef.current = 3.6;
            ballHeightRef.current = 0.3;
            isBallDropping.current = false;
            resultFoundRef.current = false;
        }
    }, [spinning]);

    useFrame((state, delta) => {
        if (!wheelRef.current || !ballRef.current) return;

        // 1. Wheel Rotation (Y-axis)
        if (spinning) {
            if (speedRef.current > 1) speedRef.current -= delta * 0.5;
        } else {
            if (speedRef.current > 0) speedRef.current -= delta * 0.5;
            if (speedRef.current < 0) speedRef.current = 0;
        }

        // Rotate around Y-axis (Up)
        wheelRef.current.rotation.y += speedRef.current * delta;

        // 2. Ball Logic
        if (spinning) {
            ballAngleRef.current += ballSpeedRef.current * delta;
            if (Math.abs(ballSpeedRef.current) > 0.5) ballSpeedRef.current *= 0.99;

            if (winningNumber && Math.abs(ballSpeedRef.current) < 2 && !isBallDropping.current) {
                isBallDropping.current = true;
            }

            if (isBallDropping.current) {
                if (ballRadiusRef.current > 2.5) { // Target pocket radius
                    ballRadiusRef.current -= delta * 2;
                }

                const targetIndex = WHEEL_ORDER.indexOf(winningNumber!);
                // Wheel is rotating around Y.
                // Numbers are placed at specific angles around Y.
                // Segment i is at angle: i * SEGMENT_ANGLE (counter-clockwise or clockwise?)
                // Let's assume our generation loop places them counter-clockwise from +X (0) 

                // Wheel Rotation: +Y rotation.
                // World Angle of Number[i] = WheelRotation.y + (i * SEGMENT_ANGLE)
                // We want BallAngle = World Angle of Target.

                // IMPORTANT: Match generation order physics.
                // In generation: rotation={[0, -angle, 0]} or similar? Let's check generation below.
                // Generation: angle = i * SEGMENT_ANGLE. Rotation Y = angle.

                const currentWheelRot = wheelRef.current.rotation.y;
                const numberLocalAngle = targetIndex * SEGMENT_ANGLE;

                // Find nearest phase to lock in
                const targetAngle = currentWheelRot + numberLocalAngle;

                // Instant snap for now to ensure hit (can smooth later)
                if (ballRadiusRef.current <= 2.8) {
                    ballAngleRef.current = targetAngle;
                    ballSpeedRef.current = speedRef.current; // Lock speed

                    if (!resultFoundRef.current) {
                        resultFoundRef.current = true;
                        setTimeout(() => onSpinComplete?.(), 2000);
                    }
                }
            }

            // Orbit in XZ plane
            const bx = Math.cos(ballAngleRef.current) * ballRadiusRef.current;
            const bz = Math.sin(ballAngleRef.current) * ballRadiusRef.current;
            ballRef.current.position.set(bx, ballHeightRef.current, bz);
        }
    });

    // Generate segments
    const segments = useMemo(() => {
        return WHEEL_ORDER.map((num, i) => {
            const color = getNumberColor(num);
            const hex = color === 'green' ? '#00b300' : (color === 'red' ? '#cc0000' : '#000000');
            const angle = i * SEGMENT_ANGLE;

            // Placing around Y axis.
            return (
                <group key={num} rotation={[0, angle, 0]}>
                    {/* Wedge/Pocket Background - Positioned radially out */}
                    {/* If rotation is 0, we are at +X axis? */}
                    <mesh position={[2.8, 0, 0]}>
                        <boxGeometry args={[1.5, 0.4, 0.1]} />
                        {/* Box is default aligned. orient it? */}
                        {/* We want the box to lie flat? It's the floor of the pocket? */}
                        {/* Visual hack: Simple colored Tile on top */}
                        <meshStandardMaterial color={hex} />
                    </mesh>

                    {/* Label - Facing UP */}
                    <group position={[2.8, 0.11, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
                        {/* Text plane: Lay flat on floor (-PI/2 X). 
                             Then Rotate locally to read radially? 
                          */}
                        <NumberLabel number={num} />
                    </group>
                </group>
            );
        });
    }, []);

    return (
        <group>
            {/* NO Main Rotation - System is Y-UP */}

            {/* Table/Bowl Base - Fixed */}
            <mesh position={[0, -0.6, 0]}>
                <cylinderGeometry args={[5, 4, 1.2, 64]} />
                <meshStandardMaterial color="#3a2211" roughness={0.5} />
            </mesh>

            {/* Static Track - Ring lying on XZ */}
            <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.5, 5, 64]} />
                <meshStandardMaterial color="#553322" />
            </mesh>

            {/* Inner Rotating Wheel */}
            <group ref={wheelRef} position={[0, 0, 0]}>
                {/* Central Hub Disc */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[3.5, 3.5, 0.2, 64]} />
                    <meshStandardMaterial color="#1a0f00" roughness={0.5} />
                </mesh>

                {/* Turret */}
                <mesh position={[0, 0.5, 0]}>
                    <coneGeometry args={[0.5, 1, 32]} />
                    <meshStandardMaterial color="#silver" metalness={0.9} />
                </mesh>

                {/* Number Ring Segments */}
                {segments}
            </group>

            {/* Ball */}
            <mesh ref={ballRef}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color="white" />
            </mesh>
        </group>
    );
};

// Sub-component for individual number label to avoid re-rendering heavy textures
const NumberLabel = ({ number }: { number: string }) => {
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'transparent';
            ctx.fillRect(0, 0, 64, 64);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 40px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Rotating text to face center?
            ctx.translate(32, 32);
            ctx.rotate(-Math.PI / 2); // Align text radially
            ctx.fillText(number, 0, 0);
        }
        return new THREE.CanvasTexture(canvas);
    }, [number]);

    return (
        <mesh position={[2.8, 0, 0.06]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial map={texture} transparent />
        </mesh>
    );
};
