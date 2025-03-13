import { useAccount, useIsAuthenticated } from "jazz-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import Planet from "./Planet";
import { AuthButton } from "./AuthButton.tsx";
import { Logo } from "./Logo.tsx";

function App() {
  const { me } = useAccount({ profile: {}, root: {} });

  const isAuthenticated = useIsAuthenticated();

  return (
    <>
      <header>
        <nav className="container flex justify-between items-center py-3">
          {isAuthenticated ? (
            <span>You're logged in.</span>
          ) : (
            <span>Authenticate to share the data with another device.</span>
          )}
          <AuthButton />
        </nav>
        <Logo />
      </header>
      <main className="w-full h-dvh bg-black">
        
        <Canvas camera={{ position: [5, 2, 5] }}>
        <Environment background={true} files="../resources/galactic_plane_hazy_nebulae_1.jpg" />

          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Planet textureUrl="../resources/2k_mercury.jpg"/>
          <OrbitControls enableZoom={true} />
        </Canvas>
      </main>
    </>
  );
}

export default App;
