import { useAccount, useIsAuthenticated } from "jazz-react";
import { useState } from "react";
import PlayArea from "./components/PlayArea.tsx";

function App() {
  const { logOut } = useAccount();
  const isAuthenticated = useIsAuthenticated();
  const [isFrozen, setIsFrozen] = useState(false);

  return (
    <>
      <main className="w-full h-dvh bg-black">
       <PlayArea isFrozen={isFrozen} />

        {/* Button to toggle freezing controls */}
        <div className="absolute top-5 left-5 bg-gray-900/50 backdrop-blur-sm p-4 rounded-lg shadow-lg">
        <button
          className="bg-white text-whitepx-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
          onClick={() => setIsFrozen((prev) => !prev)}
        >
          {(isFrozen ? "Unfreeze"  : "Freeze") + " Camera Controls"}
        </button>
        </div>

        {isAuthenticated && (
          <div className="absolute top-5 left-5 bg-gray-900/50 backdrop-blur-sm p-4 rounded-lg shadow-lg">
            <button
              onClick={logOut}
              className="bg-white text-whitepx-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
            >
              Log Out
            </button>
          </div>
        )}
      </main>
    </>
  );
}

export default App;
