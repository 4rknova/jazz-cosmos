import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import pointerFragmentShader from "../shaders/pointerFragment.glsl";
import pointerVertexShader from "../shaders/pointerVertex.glsl";
import { Vec3, ColorRGB } from "../types";


interface CursorProps {
  position: Vec3;
  normal: Vec3;
  color: ColorRGB;
}

const Cursor: React.FC<CursorProps> = ({ position, normal, color}) => {
    useFrame(() => {
    // Position and orient the indicator if hovering
        if (position && normal && indicatorRef.current) {
            indicatorRef.current.position.set(position.x, position.y, position.z);
            const lookAtTarget = indicatorRef.current.position.clone();
            lookAtTarget.add({x : normal.x, y : normal.y, z : normal.z});
            indicatorRef.current.lookAt(lookAtTarget);
        }
    });

    const indicatorRef = useRef<THREE.Mesh>(null);

    return (
        <mesh ref={indicatorRef} renderOrder={999}>
            <planeGeometry args={[0.1, 0.1]} />
            <shaderMaterial
                uniforms={{
                    uUV: { value: {x: position.x, y: position.y, z: position.z } },
                    uBrushSize: { value: 0.01 },
                    uBrushStrength: { value: 1.0 },
                    uPlayerColor: { value: {r: color.r, g: color.g, b: color.b } }   
                }}
                fragmentShader={pointerFragmentShader}
                vertexShader={pointerVertexShader}
                transparent={true}
                depthWrite={false}
                depthTest={false}
                blending={THREE.NormalBlending}
            />
        </mesh>
    );
};

export default Cursor;