import { useAccount } from "jazz-react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Stars from "./Stars";
import Planet from "./Planet";
import { CameraController } from "./CameraController";
import { ID } from "jazz-tools";
import { CursorFeed, EditorFeed } from "../schema";
import { useRef, useEffect } from "react";
import ReactDOMClient from "react-dom/client";
import InfoPanel from "./InfoPanel";


const skybox = "/resources/galactic_plane_hazy_nebulae_1.jpg";

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
 

  const cursorFeedID = worldId ?? me?.profile?.cursor?.id;
  const editorFeedID = worldId ?? me?.profile?.editor?.id;

  const getWorldURL = () => {
    if (!cursorFeedID) return;
    const currentURL = new URL(window.location.origin);
    currentURL.searchParams.set("world", cursorFeedID);
    return currentURL.toString();
  }

  // define a ref to hold the root
const rootRef = useRef<ReactDOMClient.Root | null>(null);
  
useEffect(() => {
  if (cursorFeedID) {
    const cursorFeed = me?.profile?.cursor;
    if (cursorFeed) {
      const domQR = document.getElementById("world-info-panel");
      if (domQR) {
        // only create the root once
        if (!rootRef.current) {
          rootRef.current = ReactDOMClient.createRoot(domQR);
        }
        rootRef.current.render(
          <InfoPanel
            worldURL={getWorldURL() ?? ""}
            cursorFeed={cursorFeed}
            worldName={me?.profile?.planet ?? ""}
          />
        );
      }
    }
  }
}, [cursorFeedID, me]);

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
      {cursorFeedID && editorFeedID && (
         <Planet cursorFeedID={cursorFeedID as ID<CursorFeed>} editorFeedID={editorFeedID as ID<EditorFeed>} />
      )}
      
      <CameraController
        onCameraChange={handleCameraChange}
        isCameraControlFrozen={isCameraControlFrozen}
        customCameraPosition={me?.root?.camera?.byMe?.value?.position}
      />
    </Canvas>
  );
}
