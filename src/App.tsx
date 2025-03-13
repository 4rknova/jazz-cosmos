import { useAccount, useIsAuthenticated } from "jazz-react";
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import Planet from "./Planet";
import Stars from "./Stars";
import { AuthButton } from "./AuthButton.tsx";
import { Logo } from "./Logo.tsx";

function App() {
  const { me } = useAccount({ profile: {}, root: {} });

  const isAuthenticated = useIsAuthenticated();

  const [showWireframe, setShowWireframe] = useState(true);

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
        
        <Canvas camera={{ position: [5, 2, 5] }}>
        <Environment background={true} files="../resources/galactic_plane_hazy_nebulae_1.jpg" />

          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Planet textureUrl="../resources/2k_mercury.jpg" cloudUrl="" showWireframe={showWireframe} />
          
          <OrbitControls enableZoom={true} />
        </Canvas>

        {/* Wireframe Toggle Button */}
      <button
        onClick={() => setShowWireframe(!showWireframe)}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          padding: "10px 15px",
          background: "#222",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          borderRadius: "5px",
        }}
      >
        {showWireframe ? "Hide Wireframe" : "Show Wireframe"}
      </button>

      </main>
    </>
  );
}

export default App;
