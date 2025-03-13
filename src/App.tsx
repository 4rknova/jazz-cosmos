import { useAccount, useIsAuthenticated } from "jazz-react";
import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import Planet from "./components/Planet.tsx";
import { AuthButton } from "./components/AuthButton.tsx";
import { Logo } from "./components/Logo.tsx";
import { CameraPosition } from "./schema.ts";

// Camera controller component that can access the camera within the Canvas context
function CameraController({ onCameraChange }: { onCameraChange: (position: { x: number; y: number; z: number }, isEndOfInteraction?: boolean) => void }) {
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

function App() {
  const { me } = useAccount({ profile: {}, root: {} });
  const isAuthenticated = useIsAuthenticated();
  const [showWireframe, setShowWireframe] = useState(true);
  const [cameraPosition, setCameraPosition] = useState({ x: 5, y: 2, z: 5 });

  useEffect(() => { 
    if (me?.profile?.cameraPosition) {
      setCameraPosition({
        x: me.profile.cameraPosition.x,
        y: me.profile.cameraPosition.y,
        z: me.profile.cameraPosition.z
      });
    }
  }, [me]);

  // Handle camera position changes
  const handleCameraChange = (newPosition: { x: number; y: number; z: number }, isEndOfInteraction = false) => {
    setCameraPosition(newPosition);
    
    // Only save to account if authenticated and at the end of interaction
    if (isEndOfInteraction && isAuthenticated && me?.profile) {
      savePositionToAccount(newPosition);
    }
  };
  
  // Function to save position to account
  const savePositionToAccount = (position: { x: number; y: number; z: number }) => {
    if (!isAuthenticated || !me?.profile) return;
    
    try {
      // If cameraPosition doesn't exist yet, create it
      if (!me.profile.cameraPosition) {
        me.profile.cameraPosition = CameraPosition.create(position);
      } else {
        // Update existing camera position
        Object.assign(me.profile.cameraPosition, position);
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
