import { useState, useEffect } from "react";
import World from "./components/World.tsx";
import { Logo } from "./components/Logo.tsx";
import { CursorFeed } from "./schema.ts";
import { ID } from "jazz-tools";

function App() {
  const [isCameraControlFrozen, setIsCameraControlFrozen] = useState(false);
  const [splashStage, setSplashStage] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);
  const [worldId, setWorldId] = useState<string | null>(null);

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
        <main className="w-full h-dvh bg-black">
        <World worldId={worldId as ID<CursorFeed>} isCameraControlFrozen={isCameraControlFrozen} />

          <div className="absolute top-5 left-5 bg-gray-900/50 backdrop-blur-sm p-14 space-x-5 rounded-lg shadow-lg">
          <button
            className="bg-white text-whitepx-4 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors font-medium"
            onClick={() => setIsCameraControlFrozen((prev) => !prev)}
          >
            {(isCameraControlFrozen ? "Unfreeze"  : "Freeze") + " Camera Controls"}
          </button>

          <button
            className="bg-white text-whitepx-4 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors font-medium"
            id="action-open-session-in-another-tab"
          >
            open in new tab
          </button>

          </div>
        </main>
      )}
      </div>
    </>
  );
}

export default App;
