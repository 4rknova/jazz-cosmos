import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import cloudFragment from "../shaders/cloudFragment.glsl";
import cloudVertex from "../shaders/cloudVertex.glsl";

interface CloudProps {
  initialPosition: THREE.Vector3;
  speed: number;
  scale: number;
}

const Cloud: React.FC<CloudProps> = ({ initialPosition, speed, scale }) => {
  const cloudRef = useRef<THREE.Mesh>(null);

  // Generate a random movement direction, ensuring it is tangent to the sphere
  const driftDirection = useMemo(() => {
    const normal = initialPosition.clone().normalize(); // Normal to the planet surface
    let drift = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize();

    // Project drift direction onto the tangent plane (orthogonal to the normal)
    drift.sub(normal.multiplyScalar(drift.dot(normal))).normalize();

    return drift;
  }, [initialPosition]);

  const cloudMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0.0 },
        },
        vertexShader: cloudVertex,
        fragmentShader: cloudFragment,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    if (!cloudRef.current) return;

    // Move cloud along the tangent drift direction
    cloudRef.current.position.addScaledVector(driftDirection, speed * 0.001);

    // Keep the cloud at a fixed altitude (on the sphere surface)
    cloudRef.current.position.normalize().multiplyScalar(1.05);

    // Recompute the normal and set correct orientation
    const normal = cloudRef.current.position.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(up, normal).normalize();
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent);

    // Apply orientation so that the quad is parallel to the planet's surface
    cloudRef.current.quaternion.setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(tangent, bitangent, normal)
    );

    // Update shader time for animation
    cloudMaterial.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh ref={cloudRef} position={initialPosition} scale={[scale, scale, scale]}>
      <planeGeometry args={[0.2, 0.2]} />
      <shaderMaterial {...cloudMaterial} />
    </mesh>
  );
};

export default Cloud;
