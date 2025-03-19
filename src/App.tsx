import { useAccount, useCoState, useIsAuthenticated } from "jazz-react";
import { Group, ID } from "jazz-tools";
import { useEffect, useState } from "react";
import Canvas from "./components/Canvas.tsx";
import { CursorFeed, EditFeed, Simulation } from "./schema";

function App() {
  const simulationID = "co_zPEkJj8MosPKZaWYHpv24DHXgdm" as ID<Simulation>;
  const simulation = useCoState(Simulation, simulationID);
  const { me, logOut } = useAccount();
  const isAuthenticated = useIsAuthenticated();
  const [loadedSimulation, setLoadedSimulation] = useState<Simulation | null>(
    null,
  );

  // Bootstrap the first simulation
  useEffect(() => {
    // If the simulation is null, create a new one
    if (simulation === null) {
      const group = Group.create();
      group.addMember("everyone", "writer");

      const newSimulation = Simulation.create(
        {
          cursorFeed: CursorFeed.create([], { owner: group }),
          editFeed: EditFeed.create([], { owner: group }),
        },
        {
          owner: group,
          unique: "jazz-cosmos-public-simulation-test-1055",
        },
      );
      setLoadedSimulation(newSimulation);
    }
    if (simulation) {
      setLoadedSimulation(simulation);
    }
  }, [simulation, simulationID]);

  return (
    <>
      <main className="w-full h-dvh bg-black">
        {!(simulation && loadedSimulation) && (
          <div color="white">Loading...</div>
        )}
        {loadedSimulation && <Canvas simulationID={loadedSimulation.id} />}

        {isAuthenticated && (
          <div className="absolute top-5 left-5 bg-gray-900/50 backdrop-blur-sm p-4 rounded-lg shadow-lg">
            <button
              onClick={logOut}
              className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
            >
              Log Out
            </button>
          </div>
        )}

        {/* Wireframe Toggle Button */}
        {/* <div
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
              </div>
            ) : (
              <span>Authenticate to share the data with another device.</span>
            )}

            <p>Left click to modify terrain</p>
            <p>Right click to rotate the camera</p>
          </div>
          <div className="flex justify-center items-center flex-col gap-5">
            <AuthButton />
          </div>
        </div> */}
      </main>
    </>
  );
}

export default App;
