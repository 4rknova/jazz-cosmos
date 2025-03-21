import { useMemo } from "react";
import * as THREE from "three";
import starsFragmentShader from "../shaders/starsFragment.glsl";
import starsVertexShader from "../shaders/starsVertex.glsl";

interface StarsProps {
  count?: number;
  size?: number;
  minDistance?: number;
}

const Stars = ({ count = 200, size = 5.0, minDistance = 4 }: StarsProps) => {
  const starGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const intensities = []; // Store intensity values

    for (let i = 0; i < count; i++) {
      // 200 stars
      let x,y,z;
      do {
        x = (Math.random() - 0.5) * 500; // Range from -125 to 125
        y = (Math.random() - 0.5) * 500;
        z = (Math.random() - 0.5) * 500;
        length = Math.sqrt(x * x + y * y + z * z);
      } while (length < minDistance);

      vertices.push(x, y, z);

      const intensity = Math.random() * 0.75 + 0.25; // Random intensity (0.2 - 1.0)
      intensities.push(intensity);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setAttribute(
      "intensity",
      new THREE.Float32BufferAttribute(intensities, 1),
    ); // Add intensity attribute

    return geometry;
  }, []);

  const starMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0xffffff) },
          size: { value: size },
        },
        vertexShader: starsVertexShader,
        fragmentShader: starsFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  return <points geometry={starGeometry} material={starMaterial} />;
};

export default Stars;
