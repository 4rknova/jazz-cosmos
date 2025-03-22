import { useAccount } from "jazz-react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Stars from "./Stars";
import Planet from "./Planet";
import { CameraController } from "./CameraController";
import { Vec3 } from "../schema";
import BirdFlocks from "./BirdFlocks";

export default function World({
  isCameraControlFrozen: isCameraControlFrozen,
}: { isCameraControlFrozen: boolean }) {
  const { me } = useAccount({ profile: {}, root: {} });

  // Default camera position to use if none is saved
  const defaultCameraPosition = new Vec3({ x: 5, y: 2, z: 5 });

  // Function to handle camera position changes
  const handleCameraChange = (position: {
    x: number;
    y: number;
    z: number;
  }) => {
    if (!me) return;
    
    let session = me?.root?.camera
    if (session) {
      // Update camera position in profile
      session.push(new Vec3({x: position.x, y: position.y, z: position.z}));
      console.log("Submit new camera position", session);

    }
  };

  return (
    <Canvas
      frameloop="always"
      camera={{
        position: me?.root?.camera?.byMe?.value
          ? [
            me?.root?.camera?.byMe?.value?.x,
            me?.root?.camera?.byMe?.value?.y,
            me?.root?.camera?.byMe?.value?.z,
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
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={20}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <Stars count={100} size={5} minDistance={3} />
      <BirdFlocks />
      <Planet />
      
      <CameraController
        onCameraChange={handleCameraChange}
        isCameraControlFrozen={isCameraControlFrozen}
        customCameraPosition={me?.root?.camera?.byMe?.value}
      />
      {/* */}
    </Canvas>
  );
}
