import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import pointerFragmentShader from "../shaders/pointerFragment.glsl";
import pointerVertexShader from "../shaders/pointerVertex.glsl";


interface CursorProps {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  color: THREE.Color;
}

const Cursor: React.FC<CursorProps> = ({ position, normal, color}) => {
    useFrame(() => {
    // Position and orient the indicator if hovering
        if (position && normal && indicatorRef.current) {
            indicatorRef.current.position.copy(position.clone());
            const lookAtTarget = position.clone().add(normal);
            indicatorRef.current.lookAt(lookAtTarget);
        }
    });

    const indicatorRef = useRef<THREE.Mesh>(null);

    return (
        <mesh ref={indicatorRef} renderOrder={999}>
            <planeGeometry args={[0.1, 0.1]} />
            <shaderMaterial
                uniforms={{
                    uUV: { value: position },
                    uBrushSize: { value: 0.01 },
                    uBrushStrength: { value: 1.0 },
                    uPlayerColor: { value: color }   
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