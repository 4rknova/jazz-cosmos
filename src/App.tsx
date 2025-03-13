import { useAccount, useIsAuthenticated } from "jazz-react";
import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import Planet from "./Planet";
import { AuthButton } from "./AuthButton.tsx";
import { Logo } from "./Logo.tsx";

function App() {
  const { me } = useAccount({ profile: {}, root: {} });

  const isAuthenticated = useIsAuthenticated();
  const [showWireframe, setShowWireframe] = useState(true);
  
  const [controlHeld, setControlHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) setControlHeld(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.ctrlKey) setControlHeld(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <>
      <main className="w-full h-dvh bg-black">
        
        <Canvas camera={{ position: [5, 2, 5] }}>
        <Environment background={true} files="../resources/galactic_plane_hazy_nebulae_1.jpg" />

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

          <Planet  showWireframe={showWireframe} disableEditing={controlHeld}/>
          {/* Enable OrbitControls ONLY when Control is held */}
          {controlHeld &&  <OrbitControls enableZoom={true} />}
        </Canvas>

        {/* Wireframe Toggle Button */}
        <div style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          padding: "10px 15px",
          background: "#222",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          borderRadius: "5px"}}>
          
          <div className="text-white pb-4 w-full">
            <Logo />
            <h1 className="uppercase text-2xl font-bold text-center pb-5">Cosmos</h1>

            {isAuthenticated ? (
              <span>You're logged in.</span>
            ) : (
              <span>Authenticate to share the data with another device.</span>
            )}

            <p>🖱️ Click to modify terrain</p>
            <p>⌨️ Hold <b>Control</b> to rotate & zoom the camera</p>
            
          </div>
          <div  className="flex justify-center items-center flex-col gap-5">
            <AuthButton />
           
          </div>
        </div>

      </main>
    </>
  );
}

export default App;
