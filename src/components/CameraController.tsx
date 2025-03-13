import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface CameraControllerProps {
  onCameraChange: (position: { x: number; y: number; z: number }, isEndOfInteraction?: boolean) => void;
}

/**
 * Camera controller component that can access the camera within the Canvas context
 * Tracks camera position changes and notifies parent components
 */
export function CameraController({ onCameraChange }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef(null);
  
  // Helper function to get current camera position
  const getCurrentPosition = () => ({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z
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
  
  return (
    <OrbitControls 
      ref={controlsRef}
      enableZoom={true}
      onEnd={() => {
        // This fires when control interaction ends
        onCameraChange(getCurrentPosition(), true);
      }}
    />
  );
}
