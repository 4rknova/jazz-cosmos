import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useAccount, useIsAuthenticated } from "jazz-react";
import { AuthButton } from "./components/AuthButton.tsx";
import { CameraController } from "./components/CameraController.tsx";
import { Logo } from "./components/Logo.tsx";
import Planet from "./components/Planet.tsx";
import Stars from "./components/Stars.tsx";
import { ID } from "jazz-tools";
import { Simulation, CursorFeed, EditFeed } from "./schema.ts";
import { useState, useEffect, useCallback } from "react";
import { useHashRouter } from "hash-slash";

// Define our route patterns
const ROUTES = {
  HOME: "",
  SIMULATION: "simulation",
};

// Helper function to check if a string is a valid simulation ID
const isSimulationId = (id: string) => {
  return id && id.startsWith("co_");
};

function App() {
  const { me } = useAccount({ profile: {}, root: {} });
  const isAuthenticated = useIsAuthenticated();
  // Use hash-slash for routing
  const router = useHashRouter();

  // Get the current hash path and parameters
  const hashPath = window.location.hash.slice(1);
  // Handle both #simulation/id and #/simulation/id formats
  const pathParts = hashPath.split("/");
  // Remove empty parts that might come from leading slashes
  const cleanParts = pathParts.filter((part) => part !== "");

  // Look for a simulation ID in the path parts
  let simulationId: string | null = null;

  // Check if any part is a valid simulation ID
  for (const part of cleanParts) {
    if (isSimulationId(part)) {
      simulationId = part;
      break;
    }
  }

  // If no simulation ID was found but we have a route that looks like 'simulation'
  // Check the next part after it
  if (!simulationId && cleanParts.includes(ROUTES.SIMULATION)) {
    const simIndex = cleanParts.indexOf(ROUTES.SIMULATION);
    if (simIndex >= 0 && simIndex < cleanParts.length - 1) {
      const potentialId = cleanParts[simIndex + 1];
      if (isSimulationId(potentialId)) {
        simulationId = potentialId;
      }
    }
  }

  // State for the current simulation
  const [currentSimulation, setCurrentSimulation] = useState<Simulation | null>(
    null,
  );

  // Create a new simulation and update the URL
  const createNewSimulation = useCallback(async () => {
    if (!me) return;

    try {
      // Create a new simulation with the current user as owner
      const simulation = Simulation.create(
        {
          cursorFeed: CursorFeed.create([], { owner: me }),
          editFeed: EditFeed.create([], { owner: me }),
        },
        { owner: me.profile?.simulationGroup ?? me },
      );

      setCurrentSimulation(simulation);

      // Update the URL with the new simulation ID
      // Make sure we're not adding simulation/simulation/id
      const newPath = simulation.id;
      router.navigate(newPath);
    } catch (error) {
      console.error("Error creating simulation:", error);
    }
  }, [me, router]);

  // Load a simulation by ID
  const loadSimulation = useCallback(
    async (simulationId: string) => {
      try {
        // Try to load the simulation by ID
        const simulation = await Simulation.load(
          simulationId as ID<Simulation>,
          {},
        );

        if (simulation) {
          setCurrentSimulation(simulation);
        } else {
          console.error("Simulation not found");
          // If simulation not found, create a new one
          createNewSimulation();
        }
      } catch (error) {
        console.error("Error loading simulation:", error);
        // If there's an error loading the simulation, create a new one
        createNewSimulation();
      }
    },
    [createNewSimulation],
  );

  // Keep track of whether we've already created a simulation
  const [hasCreatedSimulation, setHasCreatedSimulation] = useState(false);

  // Handle routing and simulation loading
  useEffect(() => {
    // If we already have a simulation loaded and it matches the URL, don't reload it
    if (currentSimulation && simulationId === currentSimulation.id) return;

    if (simulationId) {
      // If we have a simulation ID in the URL, load that simulation
      loadSimulation(simulationId);
    } else if (me && !hasCreatedSimulation) {
      // If we're at the root route, the user is authenticated, and we haven't created a simulation yet
      setHasCreatedSimulation(true);
      createNewSimulation();
    }
  }, [
    hashPath,
    me,
    simulationId,
    currentSimulation,
    hasCreatedSimulation,
    loadSimulation,
    createNewSimulation,
  ]);

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
    <>
      <main className="w-full h-dvh bg-black">
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
            files="../resources/galactic_plane_hazy_nebulae_1.jpg"
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
          <Planet disableEditing={false} simulationID={currentSimulation?.id} />
          <CameraController onCameraChange={handleCameraChange} />
        </Canvas>

        {/* Wireframe Toggle Button */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            padding: "10px 15px",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            borderRadius: "5px",
          }}
        >
          <div className="text-white pb-4 w-full">
            <div className="flex justify-center items-center flex-col gap-5 bg-[url(/resources/logo.png)] bg-cover bg-center">
              <div className="h-40">
                <Logo />
              </div>{" "}
            </div>

            {isAuthenticated ? (
              <div>
                <span>You're logged in.</span>
                <p className="text-xs mt-2">
                  Camera position: x:{" "}
                  {me?.root?.camera?.position?.x?.toFixed(2) ??
                    defaultCameraPosition.x.toFixed(2)}
                  , y:{" "}
                  {me?.root?.camera?.position?.y?.toFixed(2) ??
                    defaultCameraPosition.y.toFixed(2)}
                  , z:{" "}
                  {me?.root?.camera?.position?.z?.toFixed(2) ??
                    defaultCameraPosition.z.toFixed(2)}
                </p>
                {currentSimulation && (
                  <p className="text-xs mt-2">
                    Simulation ID: {currentSimulation.id}
                    <button
                      className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("URL copied to clipboard!");
                      }}
                    >
                      Copy URL
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <span>Authenticate to share the data with another device.</span>
            )}

            <p>🖱️ Click to modify terrain</p>
            <p>
              ⌨️ Hold <b>Control</b> to rotate & zoom the camera
            </p>
          </div>
          <div className="flex justify-center items-center flex-col gap-5">
            <AuthButton />
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
