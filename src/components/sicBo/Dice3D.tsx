import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';


// 產生凹凸貼圖與顏色貼圖
const createDiceTextures = (number: number, color: string, dotColor: string) => {
    const size = 256;
    const canvasColor = document.createElement('canvas');
    canvasColor.width = size;
    canvasColor.height = size;

    const ctxColor = canvasColor.getContext('2d');

    if (!ctxColor) return { map: null };

    // 1. 背景透明 (Clear)
    ctxColor.clearRect(0, 0, size, size);

    // 2. 點數位置配置 (0~1)
    const dotPositions: Record<number, number[][]> = {
        1: [[0.5, 0.5]],
        2: [[0.2, 0.2], [0.8, 0.8]],
        3: [[0.2, 0.2], [0.5, 0.5], [0.8, 0.8]],
        4: [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]],
        5: [[0.2, 0.2], [0.8, 0.2], [0.5, 0.5], [0.2, 0.8], [0.8, 0.8]],
        6: [[0.2, 0.2], [0.8, 0.2], [0.2, 0.5], [0.8, 0.5], [0.2, 0.8], [0.8, 0.8]],
    };

    const dots = dotPositions[number] || [];
    const radius = size * 0.12; // 稍微加大點數

    dots.forEach(([x, y]) => {
        const cx = x * size;
        const cy = y * size;

        // Color Map
        ctxColor.beginPath();
        ctxColor.arc(cx, cy, radius, 0, Math.PI * 2);
        ctxColor.fillStyle = dotColor;
        ctxColor.fill();
    });

    return {
        map: new THREE.CanvasTexture(canvasColor),
    };
};

const Die = ({ value, isRolling }: { value: number, isRolling: boolean }) => {
    const groupRef = useRef<THREE.Group>(null);

    // 材質生成
    const textures = useMemo(() => {
        const baseColor = '#f5f5f5'; // unused in texture now, effectively
        const redDot = '#dc2626';
        const blackDot = '#171717';
        const faceNumbers = [1, 6, 3, 4, 2, 5]; // +x, -x, +y, -y, +z, -z

        return faceNumbers.map(n => {
            const isRed = n === 1 || n === 4;
            const { map } = createDiceTextures(n, baseColor, isRed ? redDot : blackDot);
            return map;
        });
    }, []);

    // 旋轉邏輯：定義每個點數對應的旋轉角度 (x, y, z)
    const targetRotations: Record<number, [number, number, number]> = useMemo(() => ({
        1: [0, 0, Math.PI / 2],
        6: [0, 0, -Math.PI / 2],
        3: [0, 0, 0],
        4: [Math.PI, 0, 0],
        2: [-Math.PI / 2, 0, 0],
        5: [Math.PI / 2, 0, 0],
    }), []);

    // 隨機旋轉速度 (每顆骰子獨一無二)
    const [spinSpeed] = useState(() => {
        const rand = (min: number, max: number) => (Math.random() * (max - min) + min) * (Math.random() < 0.5 ? 1 : -1);
        return {
            x: rand(15, 25),
            y: rand(15, 25),
            z: rand(15, 25)
        };
    });

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        if (isRolling) {
            groupRef.current.rotation.x += delta * spinSpeed.x;
            groupRef.current.rotation.y += delta * spinSpeed.y;
            groupRef.current.rotation.z += delta * spinSpeed.z;
        } else {
            const target = targetRotations[value];
            const current = groupRef.current.rotation;
            const lerpAngle = (curr: number, dest: number, speed: number) => {
                let diff = (dest - curr) % (Math.PI * 2);
                if (diff < -Math.PI) diff += Math.PI * 2;
                else if (diff > Math.PI) diff -= Math.PI * 2;
                return curr + diff * speed;
            };
            const t = Math.min(1, delta * 8);
            groupRef.current.rotation.x = lerpAngle(current.x, target[0], t);
            groupRef.current.rotation.y = lerpAngle(current.y, target[1], t);
            groupRef.current.rotation.z = lerpAngle(current.z, target[2], t);
        }
    });

    // Face configurations matching BoxGeometry order: +x, -x, +y, -y, +z, -z
    // Cube size 1.6. Half = 0.8. Offset slightly to 0.802 to avoid z-fighting on flat areas (though RoundedBox is flat there).
    const faces = [
        { pos: [0.802, 0, 0], rot: [0, Math.PI / 2, 0] },  // Right (+x)
        { pos: [-0.802, 0, 0], rot: [0, -Math.PI / 2, 0] }, // Left (-x)
        { pos: [0, 0.802, 0], rot: [-Math.PI / 2, 0, 0] },  // Top (+y)
        { pos: [0, -0.802, 0], rot: [Math.PI / 2, 0, 0] },  // Bottom (-y)
        { pos: [0, 0, 0.802], rot: [0, 0, 0] },             // Front (+z)
        { pos: [0, 0, -0.802], rot: [0, Math.PI, 0] },      // Back (-z)
    ];

    return (
        <group ref={groupRef}>
            {/* Main Rounded Body */}
            <RoundedBox
                args={[1.6, 1.6, 1.6]}
                radius={0.25}
                smoothness={8}
                receiveShadow
                castShadow
            >
                <meshStandardMaterial
                    color="#f5f5f5"
                    roughness={0.1}
                    metalness={0.1}
                />
            </RoundedBox>

            {/* Face Decals */}
            {faces.map((face, i) => (
                <mesh
                    key={i}
                    position={face.pos as [number, number, number]}
                    rotation={face.rot as [number, number, number]}
                >
                    <planeGeometry args={[1.3, 1.3]} />
                    <meshStandardMaterial
                        map={textures[i]}
                        transparent
                        depthWrite={false} // Avoid z-fighting artifacts
                        roughness={0.1}
                    />
                </mesh>
            ))}
        </group>
    );
};

interface Dice3DProps {
    dice: [number, number, number];
    isRolling: boolean;
}

const Dice3D: React.FC<Dice3DProps> = ({ dice, isRolling }) => {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 8, 5], fov: 45 }}
                onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
            >
                {/* 強力照明系統 */}
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 10, 5]} intensity={2.0} castShadow />
                <pointLight position={[0, 5, 0]} intensity={1.5} color="#ffffff" />
                <pointLight position={[-5, 5, -5]} intensity={1.0} color="#fbbf24" />

                <group position={[0, -0.5, 0]}>
                    {/* 左骰子：獨立懸浮 */}
                    <Float
                        position={[-2.2, 0, 0]}
                        speed={isRolling ? 20 : 0}
                        rotationIntensity={isRolling ? 2 : 0}
                        floatIntensity={isRolling ? 3 : 0}
                        floatingRange={isRolling ? [-0.5, 0.5] : [-0.1, 0.1]}
                    >
                        <Die value={dice[0]} isRolling={isRolling} />
                    </Float>

                    {/* 中骰子：更劇烈的浮動 */}
                    <Float
                        position={[0, 0, 0.2]}
                        speed={isRolling ? 25 : 0}
                        rotationIntensity={isRolling ? 2.5 : 0}
                        floatIntensity={isRolling ? 3 : 0}
                        floatingRange={isRolling ? [-0.5, 0.5] : [-0.1, 0.1]}
                    >
                        <Die value={dice[1]} isRolling={isRolling} />
                    </Float>

                    {/* 右骰子：反向或不同的浮動參數 */}
                    <Float
                        position={[2.2, 0, -0.1]}
                        speed={isRolling ? 18 : 0}
                        rotationIntensity={isRolling ? 1.5 : 0}
                        floatIntensity={isRolling ? 3 : 0}
                        floatingRange={isRolling ? [-0.5, 0.5] : [-0.1, 0.1]}
                    >
                        <Die value={dice[2]} isRolling={isRolling} />
                    </Float>
                </group>
            </Canvas>
        </div>
    );
};

export default React.memo(Dice3D);
