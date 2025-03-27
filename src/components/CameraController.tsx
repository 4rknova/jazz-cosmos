import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface CameraControllerProps {
  onCameraChange: (
    position: { x: number; y: number; z: number },
    isEndOfInteraction?: boolean
  ) => void;
  isCameraControlFrozen: boolean;
  customCameraPosition?: { x: number; y: number; z: number };
}

/**
 * Camera controller component that can access the camera within the Canvas context
 * Tracks camera position changes and notifies parent components asynchronously
 */
export function CameraController({ onCameraChange, isCameraControlFrozen: isCameraControlFrozen, customCameraPosition }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef(null);
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);


  // Function to smoothly interpolate the camera position
  const smoothTransition = (start: THREE.Vector3, end: THREE.Vector3, duration: number) => {
    const startTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      camera.position.lerpVectors(start, end, progress);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        camera.position.copy(end);
        animationFrameRef.current = null;
      }
    };
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Helper function to get current camera position
  const getCurrentPosition = () => ({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  });

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (isCameraControlFrozen && customCameraPosition != undefined) {
      intervalRef.current = setInterval(() => {
        const target = new THREE.Vector3(
          customCameraPosition.x,
          customCameraPosition.y,
          customCameraPosition.z
        );
        smoothTransition(camera.position.clone(), target, 500); // Transition over 1 second
      }, 500);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCameraControlFrozen,  JSON.stringify(customCameraPosition)]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={!isCameraControlFrozen}
      enableRotate={!isCameraControlFrozen}
      enablePan={!isCameraControlFrozen}
      reverseOrbit={true}
      minDistance={1.5}
      maxDistance={5}
      onEnd={() => {
        !isCameraControlFrozen && (() => {
          onCameraChange(getCurrentPosition(), true);
        })();
      }}
      mouseButtons={{
        LEFT: undefined,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      }}
    />
  );
}
