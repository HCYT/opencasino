import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3 } from 'three';

// 產生凹凸貼圖與顏色貼圖
const createDiceTextures = (number: number, color: string, dotColor: string) => {
    const size = 256;
    const canvasColor = document.createElement('canvas');
    const canvasBump = document.createElement('canvas');
    canvasColor.width = canvasBump.width = size;
    canvasColor.height = canvasBump.height = size;

    const ctxColor = canvasColor.getContext('2d');
    const ctxBump = canvasBump.getContext('2d');

    if (!ctxColor || !ctxBump) return { map: null, bumpMap: null };

    // 1. 背景
    ctxColor.fillStyle = color;
    ctxColor.fillRect(0, 0, size, size);

    // Bump
    ctxBump.fillStyle = '#FFFFFF';
    ctxBump.fillRect(0, 0, size, size);

    // 2. 模擬圓角 (Bevel) - 在 Bump Map 邊緣繪製漸層
    //這會讓標準立方體的邊緣在光照下看起來是圓的
    const bevelSize = size * 0.15; // 圓角大小
    const bevelGradient = ctxBump.createLinearGradient(0, 0, bevelSize, 0);
    bevelGradient.addColorStop(0, '#000000'); // 邊緣最深
    bevelGradient.addColorStop(1, '#FFFFFF'); // 內部平坦

    // 畫四個邊的漸層
    ctxBump.fillStyle = '#000000'; // 先填黑底確保邊緣黑
    ctxBump.fillRect(0, 0, size, size);

    // 中間填白 (高原)
    ctxBump.fillStyle = '#FFFFFF';
    ctxBump.fillRect(bevelSize, bevelSize, size - bevelSize * 2, size - bevelSize * 2);

    // 繪製四邊漸層 (這裡簡化，直接用陰影模糊來模擬平滑圓角)
    ctxBump.shadowColor = '#000000';
    ctxBump.shadowBlur = bevelSize;
    ctxBump.shadowOffsetX = 0;
    ctxBump.shadowOffsetY = 0;
    ctxBump.fillStyle = '#FFFFFF';
    ctxBump.fillRect(bevelSize, bevelSize, size - bevelSize * 2, size - bevelSize * 2);
    ctxBump.shadowColor = 'transparent'; // Reset

    // 3. 點數位置配置 (0~1)
    const dotPositions: Record<number, number[][]> = {
        1: [[0.5, 0.5]],
        2: [[0.2, 0.2], [0.8, 0.8]],
        3: [[0.2, 0.2], [0.5, 0.5], [0.8, 0.8]],
        4: [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]],
        5: [[0.2, 0.2], [0.8, 0.2], [0.5, 0.5], [0.2, 0.8], [0.8, 0.8]],
        6: [[0.2, 0.2], [0.8, 0.2], [0.2, 0.5], [0.8, 0.5], [0.2, 0.8], [0.8, 0.8]],
    };

    const dots = dotPositions[number] || [];
    const radius = size * 0.1;

    dots.forEach(([x, y]) => {
        const cx = x * size;
        const cy = y * size;

        // Color Map
        ctxColor.beginPath();
        ctxColor.arc(cx, cy, radius, 0, Math.PI * 2);
        ctxColor.fillStyle = dotColor;
        ctxColor.fill();

        // Bump Map Gradient
        const grad = ctxBump.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.2);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(1, '#FFFFFF');

        ctxBump.beginPath();
        ctxBump.arc(cx, cy, radius * 1.2, 0, Math.PI * 2);
        ctxBump.fillStyle = grad;
        ctxBump.fill();
    });

    return {
        map: new THREE.CanvasTexture(canvasColor),
        bumpMap: new THREE.CanvasTexture(canvasBump)
    };
};

const Die = ({ position, rotation, value, isRolling }: { position: [number, number, number], rotation: [number, number, number], value: number, isRolling: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    // 材質生成
    const materials = useMemo(() => {
        const baseColor = '#f5f5f5';
        const redDot = '#dc2626';
        const blackDot = '#171717';
        const faceNumbers = [1, 6, 3, 4, 2, 5];

        return faceNumbers.map(n => {
            const isRed = n === 1 || n === 4;
            const { map, bumpMap } = createDiceTextures(n, baseColor, isRed ? redDot : blackDot);

            return new THREE.MeshStandardMaterial({
                map,
                bumpMap,
                bumpScale: 0.8, // 增加深度讓圓角更明顯
                color: baseColor,
                roughness: 0.1, // 更光滑，像高級壓克力
                metalness: 0.1, // 一點點金屬感增加反光
            });
        });
    }, []);

    // 旋轉邏輯
    const targetRotations: Record<number, [number, number, number]> = useMemo(() => ({
        1: [0, 0, Math.PI / 2],
        6: [0, 0, -Math.PI / 2],
        3: [0, 0, 0],
        4: [Math.PI, 0, 0],
        2: [-Math.PI / 2, 0, 0],
        5: [Math.PI / 2, 0, 0],
    }), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        if (isRolling) {
            meshRef.current.rotation.x += delta * 20;
            meshRef.current.rotation.y += delta * 15;
            meshRef.current.rotation.z += delta * 18;
        } else {
            const target = targetRotations[value];
            const current = meshRef.current.rotation;
            const lerpAngle = (curr: number, dest: number, speed: number) => {
                let diff = (dest - curr) % (Math.PI * 2);
                if (diff < -Math.PI) diff += Math.PI * 2;
                else if (diff > Math.PI) diff -= Math.PI * 2;
                return curr + diff * speed;
            };
            const t = Math.min(1, delta * 8);
            meshRef.current.rotation.x = lerpAngle(current.x, target[0], t);
            meshRef.current.rotation.y = lerpAngle(current.y, target[1], t);
            meshRef.current.rotation.z = lerpAngle(current.z, target[2], t);
        }
    });


    return (
        <mesh
            ref={meshRef}
            position={new Vector3(...position)}
            rotation={new THREE.Euler(...rotation)}
        >
            <boxGeometry args={[1.6, 1.6, 1.6]} />
            {materials.map((mat, i) => (
                <primitive key={i} object={mat} attach={`material-${i}`} />
            ))}
        </mesh>
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
                    <Float speed={isRolling ? 20 : 0} rotationIntensity={isRolling ? 2 : 0} floatIntensity={isRolling ? 2 : 0}>
                        <Die position={[-2.2, 0, 0]} rotation={[0, 0, 0]} value={dice[0]} isRolling={isRolling} />
                        <Die position={[0, 0, 0.2]} rotation={[0, 0, 0]} value={dice[1]} isRolling={isRolling} />
                        <Die position={[2.2, 0, -0.1]} rotation={[0, 0, 0]} value={dice[2]} isRolling={isRolling} />
                    </Float>
                </group>
            </Canvas>
        </div>
    );
};

export default React.memo(Dice3D);
