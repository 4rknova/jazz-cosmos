import { useMemo } from "react";
import * as THREE from "three";
import starsVertexShader from "./shaders/starsVertex.glsl";
import starsFragmentShader from "./shaders/starsFragment.glsl";

const Stars = () => {

  const starGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const intensities = []; // Store intensity values

    for (let i = 0; i < 200; i++) {  // 200 stars
      const x = (Math.random() - 0.5) * 500; // Range from -125 to 125
      const y = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      vertices.push(x, y, z);

      const intensity = Math.random() * 0.75 + 0.25; // Random intensity (0.2 - 1.0)
      intensities.push(intensity);
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("intensity", new THREE.Float32BufferAttribute(intensities, 1)); // Add intensity attribute

    return geometry;
  }, []);

  const starMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0xffffff) },
          size: { value: 10.0 },
        },
        vertexShader: starsVertexShader,
        fragmentShader: starsFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  return <points geometry={starGeometry} material={starMaterial} />;
};

export default Stars;
