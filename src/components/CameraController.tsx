import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface CameraControllerProps {
  onCameraChange: (
    position: { x: number; y: number; z: number },
    isEndOfInteraction?: boolean,
  ) => void;
}

/**
 * Camera controller component that can access the camera within the Canvas context
 * Tracks camera position changes and notifies parent components
 */
export function CameraController({ onCameraChange }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef(null);
  const [isControlPressed, setIsControlPressed] = useState(false);

  // Helper function to get current camera position
  const getCurrentPosition = () => ({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  });

  // Track previous position to detect changes
  const prevPosition = useRef(camera.position.clone());

  // Check camera position on each frame
  useFrame(() => {
    if (!camera.position.equals(prevPosition.current)) {
      onCameraChange(getCurrentPosition());
      prevPosition.current.copy(camera.position);
    }
  });

  // Add keyboard event listeners for control key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Control") {
        console.log("Control key pressed");
        setIsControlPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Control") {
        console.log("Control key released");
        setIsControlPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      onEnd={() => {
        // This fires when control interaction ends
        onCameraChange(getCurrentPosition(), true);
      }}
      mouseButtons={{
        LEFT: undefined,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      }}
    />
  );
}
