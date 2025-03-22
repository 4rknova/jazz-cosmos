import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import birdVertexShader from "../shaders/birdVertex.glsl";
import birdFragmentShader from "../shaders/birdFragment.glsl";

export default function BirdFlocks() {
  const totalBirds = 100;
  const radius = 1.0;

  // CHAOS CONTROL PARAMETERS
  const boidEscapeChance = 0.001;         // 1% chance per frame to break from flock
  const boidEscapeDuration = 1.0;        // seconds rogue behavior lasts
  const escapeWanderStrength = 0.0001;   // strength of rogue wandering
  const boidInfluence = 0.0002;             // scale down to weaken flock cohesion

  const birdRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(0.04, 0.04);
  }, []);

  const flapOffsets = useMemo(() => {
    const values = new Float32Array(totalBirds);
    for (let i = 0; i < totalBirds; i++) {
      values[i] = Math.random() * Math.PI * 2;
    }
    return values;
  }, [totalBirds]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: birdVertexShader,
      fragmentShader: birdFragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);

  const positions = useRef<THREE.Vector3[]>([]);
  const velocities = useRef<THREE.Vector3[]>([]);
  const rotations = useRef<THREE.Quaternion[]>([]);
  const escapeTimers = useRef<number[]>([]); // NEW: escape state per bird

  useMemo(() => {
    const flapAttr = new THREE.InstancedBufferAttribute(flapOffsets, 1);
    geometry.setAttribute("flapOffset", flapAttr);

    for (let i = 0; i < totalBirds; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);
      const r = radius + 0.05;

      const pos = new THREE.Vector3(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(theta)
      );

      const rand = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
      const vel = new THREE.Vector3().crossVectors(pos, rand).normalize().multiplyScalar(0.001);

      positions.current.push(pos);
      velocities.current.push(vel);
      rotations.current.push(new THREE.Quaternion());
      escapeTimers.current.push(0); // initialize to not escaping
    }
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const delta = clock.getDelta();
    material.uniforms.uTime.value = time;

    const sepDist = .03;
    const neighborDist = 0.1;
    const maxSpeed = 0.001;
    const steerStrength = 0.15;
    const inertia = 0.9;

    for (let i = 0; i < totalBirds; i++) {
      const pos = positions.current[i];
      const vel = velocities.current[i];

      // Update escape timer
      if (escapeTimers.current[i] <= 0 && Math.random() < boidEscapeChance) {
        escapeTimers.current[i] = boidEscapeDuration;
      }
      const isEscaping = escapeTimers.current[i] > 0;
      if (isEscaping) {
        escapeTimers.current[i] -= delta;
      }

      // Boid behavior
      let separation = new THREE.Vector3();
      let alignment = new THREE.Vector3();
      let cohesion = new THREE.Vector3();
      let count = 0;

      if (!isEscaping) {
        for (let j = 0; j < totalBirds; j++) {
          if (i === j) continue;
          const otherPos = positions.current[j];
          const distance = pos.distanceTo(otherPos);

          if (distance < neighborDist) {
            alignment.add(velocities.current[j]);
            cohesion.add(otherPos);
            count++;

            if (distance < sepDist) {
              const away = pos.clone().sub(otherPos).normalize().divideScalar(distance);
              separation.add(away);
            }
          }
        }
      }

      if (count > 0) {
        alignment.divideScalar(count).normalize();
        cohesion.divideScalar(count).sub(pos).normalize();
      }

      const steer = new THREE.Vector3();

      if (isEscaping) {
        // Rogue behavior: random direction
        steer.add(new THREE.Vector3(
          (Math.random() - 0.5) * escapeWanderStrength,
          (Math.random() - 0.5) * escapeWanderStrength,
          (Math.random() - 0.5) * escapeWanderStrength
        ));
      } else {
        // Normal flocking
        steer
          .addScaledVector(separation, 1.5 * boidInfluence)
          .addScaledVector(alignment, 1.0 * boidInfluence)
          .addScaledVector(cohesion, 1.0 * boidInfluence);
      }

      // Add subtle wander to all birds
      steer.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.0003,
        (Math.random() - 0.5) * 0.0003,
        (Math.random() - 0.5) * 0.0003
      ));

      // Apply steering
      vel.multiplyScalar(inertia).addScaledVector(steer, steerStrength).normalize();

      // Constrain to sphere
      const up = pos.clone().normalize();
      const tangent = vel.clone().sub(up.multiplyScalar(vel.dot(up)));
      vel.copy(tangent).normalize().multiplyScalar(maxSpeed);

      // Move and re-project to sphere surface
      pos.add(vel);
      pos.normalize().multiplyScalar(radius + 0.05);

      // Orientation
      const forward = pos.clone().add(vel);
      dummy.position.copy(pos);
      dummy.lookAt(forward);
      dummy.rotateX(Math.PI / 2);
      dummy.updateMatrix();

      birdRef.current?.setMatrixAt(i, dummy.matrix);
    }

    if (birdRef.current) {
      birdRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={birdRef}
      args={[geometry, material, totalBirds]}
      frustumCulled={false}
    />
  );
}
