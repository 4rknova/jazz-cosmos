import { useAccount, useIsAuthenticated } from "jazz-react";
import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Planet from "./components/Planet.tsx";
import { AuthButton } from "./components/AuthButton.tsx";
import { Logo } from "./components/Logo.tsx";
import { CameraPosition } from "./schema.ts";
import { CameraController } from "./components/CameraController";

function App() {
  const { me } = useAccount({ profile: {}, root: {} });
  const isAuthenticated = useIsAuthenticated();
  const [showWireframe, setShowWireframe] = useState(true);
  const [cameraPosition, setCameraPosition] = useState({ x: 5, y: 2, z: 5 });

  useEffect(() => { 
    if (me?.root?.cameraPosition) {
      setCameraPosition({
        x: me.root.cameraPosition.x,
        y: me.root.cameraPosition.y,
        z: me.root.cameraPosition.z
      });
    }
  }, [me]);

  // Handle camera position changes
  const handleCameraChange = (newPosition: { x: number; y: number; z: number }, isEndOfInteraction = false) => {
    setCameraPosition(newPosition);
    
    // Only save to account if authenticated and at the end of interaction
    if (isEndOfInteraction && isAuthenticated && me?.root) {
      savePositionToAccount(newPosition);
    }
  };
  
  // Function to save position to account
  const savePositionToAccount = (position: { x: number; y: number; z: number }) => {
    if (!isAuthenticated || !me?.root) return;
    
    try {
      // If cameraPosition doesn't exist yet, create it
      if (!me.root.cameraPosition) {
        me.root.cameraPosition = CameraPosition.create(position);
      } else {
        // Update existing camera position
        Object.assign(me.root.cameraPosition, position);
      }
    } catch (error) {
      console.error('Error saving camera position:', error);
    }
  };

  return (
    <>
      <main className="w-full h-dvh bg-black">
      <nav className="container flex justify-between items-center py-3">
          {isAuthenticated ? (
            <span>You're logged in.</span>
          ) : (
            <span>Authenticate to share the data with another device.</span>
          )}
          <AuthButton />
        </nav>
        <Logo />
        <Canvas camera={{ position: [
          cameraPosition.x, 
          cameraPosition.y, 
          cameraPosition.z
        ] }}>
          <Environment background={true} files="../resources/galactic_plane_hazy_nebulae_1.jpg" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Planet showWireframe={showWireframe} />
          <CameraController onCameraChange={handleCameraChange} />
        </Canvas>

        {/* Wireframe Toggle Button */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            type="button"
            className="px-4 py-2 bg-white bg-opacity-10 backdrop-blur-md rounded-full text-white hover:bg-opacity-20 transition-all"
            onClick={() => setShowWireframe(!showWireframe)}
          >
            {showWireframe ? "Hide" : "Show"} Wireframe
          </button>
        </div>

        {/* Display current camera position */}
        <div className="fixed top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded">
          <p>Camera Position:</p>
          <p>X: {cameraPosition.x.toFixed(2)}</p>
          <p>Y: {cameraPosition.y.toFixed(2)}</p>
          <p>Z: {cameraPosition.z.toFixed(2)}</p>
        </div>
      </main>
    </>
  );
}

export default App;
