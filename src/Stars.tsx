import React, { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Stars = () => {
  const starGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 1000; i++) { // Create 1000 stars
      const x = (Math.random() - 0.5) * 500;
      const y = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      vertices.push(x, y, z);
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, []);

  return (
    <points geometry={starGeometry}>
      <pointsMaterial color="white" size={0.5} />
    </points>
  );
};

export default Stars;