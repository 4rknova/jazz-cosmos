import { useState, useEffect } from "react";
import Space from "./components/Space.tsx";
import { Logo } from "./components/Logo.tsx";
import { CursorFeed } from "./schema.ts";
import { ID } from "jazz-tools";
import CameraPanel from "./components/CameraPanel.tsx";

function App() {
  const [splashStage, setSplashStage] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);
  const [worldId, setWorldId] = useState<string | null>(null);
  const [isCameraControlFrozen, setIsCameraControlFrozen] = useState(false);

  useEffect(() => {
    // Capture ?world=... from URL
    const params = new URLSearchParams(window.location.search);
    const world = params.get("world");
    if (world) {
      setWorldId(world);
    }
  }, []);

  useEffect(() => {
    const stages = [
      1000, // Splash 1: fade in
      2000, // Splash 1: visible
      3000, // Splash 1: fade out
      4000, // Splash 2: fade in
      7000, // Splash 2: visible
      8000, // Splash 2: fade out
      10000, // Show main app
    ];
    stages.forEach((ms, i) => {
      setTimeout(() => setSplashStage(i as 0 | 1 | 2 | 3 | 4 | 5 | 6), ms);
    });
  }, []);

  return (
    <>
      <div className="w-full h-dvh bg-black">
      {/* Splash 1 */}
      {splashStage < 3 && (
        <div id="splash-1"
          className={`fixed inset-0 bg-black flex flex-col items-center justify-center z-50 
            ${splashStage === 0 ? "opacity-0" : ""}
            ${splashStage === 0 ? "animate-fadeIn" : ""}
            ${splashStage === 2 ? "animate-fadeOut" : ""}
          `}
        >
          <div className="text-white text-4xl font-medium mb-4">Made with</div>
          <Logo />
        </div>
      )}

      {/* Splash 2 */}
      {splashStage >= 3 && splashStage < 6 && (
        <div id="splash-2"
          className={`fixed inset-0 bg-black flex flex-col items-center justify-center z-50 
            ${splashStage === 3 ? "opacity-0" : ""}
            ${splashStage === 3 ? "animate-fadeIn" : ""}
            ${splashStage === 5 ? "animate-fadeOut" : ""}
          `}
        >
          <img
            src="/resources/logo.png"
            alt="Logo"
            className="w-128 h-128 object-contain mb-2"
          />
        </div>
      )}

      {/* Main App */}
      {splashStage >= 4 &&  (
        <main className="w-full h-dvh bg-black ">
          <Space cursorFeedId={worldId as ID<CursorFeed> } isCameraControlFrozen={isCameraControlFrozen} />
          <div className="absolute top-0 left-0 pt-5pl-5 bg-gray-200 backdrop-blur-sm bg-transparent
           space-y-5 w-60 h-screen flex flex-col items-center justify-top border-r-4 border-primary
            border-opacity-10 border-shadow-lg">
            <img
              src="/resources/logo.png"
              alt="Logo"
              className="w-48 object-contain"
            />

            <div id="world-info-panel" className="text-primary flex flex-col items-center justify-center p-2 w-100 h-100"></div>
            <div id="camera-panel" className="text-primary flex flex-col items-center justify-center p-2 w-100 h-100">
              <CameraPanel
                isCameraControlFrozen={isCameraControlFrozen}
                setIsCameraControlFrozen={setIsCameraControlFrozen}
              />
            </div>
          </div>
        </main>
      )}
      </div>
    </>
  );
}

export default App;
