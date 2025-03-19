import { useAccount, useIsAuthenticated } from "jazz-react";
import { AuthButton } from "./components/AuthButton.tsx";
import { Logo } from "./components/Logo.tsx";
import Canvas from "./components/Canvas.tsx";

function App() {
  const { me } = useAccount({
    profile: {},
    root: { camera: { position: {} } },
  });
  const isAuthenticated = useIsAuthenticated();

  // Default camera position to use if none is saved
  const defaultCameraPosition = { x: 5, y: 2, z: 5 };

  return (
    <>
      <main className="w-full h-dvh bg-black">
        <Canvas />

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
        </div>
      </main>
    </>
  );
}

export default App;
