import { useAccount, useIsAuthenticated } from "jazz-react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Stars from "./Stars";
import Planet from "./Planet";
import { CameraController } from "./CameraController";

export default function CanvasComponent() {
  const { me } = useAccount({ profile: {}, root: {} });
  const isAuthenticated = useIsAuthenticated();

  // Default camera position to use if none is saved
  const defaultCameraPosition = { x: 5, y: 2, z: 5 };

  // Function to handle camera position changes
  const handleCameraChange = (position: {
    x: number;
    y: number;
    z: number;
  }) => {
    if (me?.root?.camera?.position) {
      // Update camera position in profile
      me.root.camera.position.x = position.x;
      me.root.camera.position.y = position.y;
      me.root.camera.position.z = position.z;
    }
  };

  return (
    <Canvas
      frameloop="always"
      camera={{
        position: me?.root?.camera?.position
          ? [
              me.root.camera.position.x,
              me.root.camera.position.y,
              me.root.camera.position.z,
            ]
          : [
              defaultCameraPosition.x,
              defaultCameraPosition.y,
              defaultCameraPosition.z,
            ],
      }}
    >
      <Environment
        background={true}
        files="../../resources/galactic_plane_hazy_nebulae_1.jpg"
      />

      <ambientLight intensity={0.5} />

      {/* Directional Light with Shadows */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow // ✅ Enable shadow casting
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={20}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <Stars />
      <Planet disableEditing={false} />
      <CameraController onCameraChange={handleCameraChange} />
    </Canvas>
  );
}
