import { useMemo } from "react";
import * as THREE from "three";
import Cloud from "./Cloud";

const NUM_CLOUDS = 30; // Adjust cloud density

const Clouds: React.FC = () => {
  const clouds = useMemo(() => {
    return new Array(NUM_CLOUDS).fill(null).map(() => {
      const theta = Math.random() * Math.PI * 2; // Longitude
      const phi = Math.acos(2 * Math.random() - 1); // Latitude

      // Convert spherical coordinates to Cartesian
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      const position = new THREE.Vector3(x, y, z).multiplyScalar(1.05); // Slightly above planet surface

      const speed = Math.random() * 0.2 + 0.1; // Drift speed
      const scale = Math.random() * 0.15 + 0.05; // Cloud size

      return { position, speed, scale };
    });
  }, []);

  return (
    <group>
      {clouds.map((cloud, i) => (
        <Cloud key={i} initialPosition={cloud.position} speed={cloud.speed} scale={cloud.scale} />
      ))}
    </group>
  );
};

export default Clouds;
