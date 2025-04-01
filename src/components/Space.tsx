import { useAccount } from "jazz-react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Stars from "./Stars";
import Planet from "./Planet";
import { CameraController } from "./CameraController";
import { ID } from "jazz-tools";
import { World } from "../schema";
import { useRef, useEffect } from "react";
import ReactDOMClient from "react-dom/client";
import InfoPanel from "./InfoPanel";
import { spheremapImages } from "../utils";

type WorldProps = {
  worldId?: ID<World> | null;
  isCameraControlFrozen: boolean;
};

export default function Space({ worldId, isCameraControlFrozen }: WorldProps) {
  const defaultCameraPosition = {x: 5, y: 0, z: -5};
  const { me } = useAccount({resolve: true});
  
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
 
  const worldID = worldId ?? me?.profile?.world?.id;
  
  const getWorldURL = () => {
    if (!worldID) return;
    const currentURL = new URL(window.location.origin);
    currentURL.searchParams.set("world", worldID);
    return currentURL.toString();
  }

  const rootRef = useRef<ReactDOMClient.Root | null>(null);
    
  useEffect(() => {
    if (worldID) {
      const cursorFeed = me?.profile?.world?.cursor;
      if (cursorFeed) {
        const root = document.getElementById("world-info-panel");
        if (root) {
          // only create the root once
          if (!rootRef.current) {
            rootRef.current = ReactDOMClient.createRoot(root);
          }
          rootRef.current.render(
            <InfoPanel
              worldURL={getWorldURL() ?? ""}
              players={Object.keys(cursorFeed?.perSession  ?? {}).length ?? 0}
              worldName={me?.profile?.world?.name ?? ""}
            />
          );
        }
      }
    }
  }, [worldID, me]);``

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
        files={ me?.profile?.world?.deepSpaceMap ?? spheremapImages[0]}
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

      <Stars count={250} size={6} minDistance={4} />
      <Planet worldId={worldID as ID<World>} />
      
      <CameraController
        onCameraChange={handleCameraChange}
        isCameraControlFrozen={isCameraControlFrozen}
        customCameraPosition={me?.root?.camera?.byMe?.value?.position}
      />
    </Canvas>
  );
}
