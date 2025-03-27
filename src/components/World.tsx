import { useAccount } from "jazz-react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Stars from "./Stars";
import Planet from "./Planet";
import { CameraController } from "./CameraController";
import { ID } from "jazz-tools";
import { CursorFeed } from "../schema";

const skybox = "/public/resources/galactic_plane_hazy_nebulae_1.jpg";

type WorldProps = {
  isCameraControlFrozen: boolean;
  worldId?: ID<CursorFeed> | null;
};

export default function World({ isCameraControlFrozen, worldId }: WorldProps) {

  const defaultCameraPosition = {x: 5, y: 0, z: -5};
  const { me } = useAccount();
  
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
      session.push({position: {x: position.x, y: position.y, z: position.z}});
    }
  };
 
  console.log(worldId);

  const cursorFeedID = worldId ?? me?.profile?.cursor?.id;

  return (
    <Canvas
      frameloop="always"
      camera={{
        position: me?.root?.camera?.byMe?.value
          ? [
            me?.root?.camera?.byMe?.value?.position.x,
            me?.root?.camera?.byMe?.value?.position.y,
            me?.root?.camera?.byMe?.value?.position.z,
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
        files={skybox}
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
      {cursorFeedID && (
         <Planet cursorFeedID={cursorFeedID} />
      )}
      
      <CameraController
        onCameraChange={handleCameraChange}
        isCameraControlFrozen={isCameraControlFrozen}
        customCameraPosition={me?.root?.camera?.byMe?.value?.position}
      />
    </Canvas>
  );
}
