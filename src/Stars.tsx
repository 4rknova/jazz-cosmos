import { useMemo } from "react";
import * as THREE from "three";
import { extend } from "@react-three/fiber";

const Stars = () => {
  const starGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 500;
      const y = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      vertices.push(x, y, z);
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, []);

  const starMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0xffffff) },
          size: { value: 5.0 },
        },
        vertexShader: `
          uniform float size;
          varying vec3 vColor;

          void main() {
            vColor = vec3(1.0, 1.0, 1.0); // White color
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z); // Scale size based on depth
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;

          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            gl_FragColor = vec4(vColor, 1.0 - dist * 2.0);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  return <points geometry={starGeometry} material={starMaterial} />;
};

export default Stars;
