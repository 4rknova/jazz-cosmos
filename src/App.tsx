import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useAccount, useIsAuthenticated } from "jazz-react";
import { AuthButton } from "./components/AuthButton.tsx";
import { CameraController } from "./components/CameraController.tsx";
import { Logo } from "./components/Logo.tsx";
import Planet from "./components/Planet.tsx";
import Stars from "./components/Stars.tsx";

function App() {
	const { me } = useAccount({ profile: {}, root: {} });
	const isAuthenticated = useIsAuthenticated();

	// Default camera position to use if none is saved
	const defaultCameraPosition = { x: 5, y: 2, z: 5 };

	// Function to handle camera position changes
	const handleCameraChange = (
		position: { x: number; y: number; z: number },
		isEndOfInteraction = false,
	) => {
		// Only save camera position when interaction ends (mouse up, etc.)
		if (isEndOfInteraction && me?.profile?.camera?.position) {
			console.log("Camera interaction ended, saving position:", position);

			// Update camera position in profile directly
			me.profile.camera.position.x = position.x;
			me.profile.camera.position.y = position.y;
			me.profile.camera.position.z = position.z;
		}
	};

	return (
		<>
			<main className="w-full h-dvh bg-black">
				<Canvas
					frameloop="always"
					camera={{
						position: me?.profile?.camera?.position
							? [
									me.profile.camera.position.x,
									me.profile.camera.position.y,
									me.profile.camera.position.z,
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
					<Planet disableEditing={false} />
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
									{me?.profile?.camera?.position?.x?.toFixed(2) ??
										defaultCameraPosition.x.toFixed(2)}
									, y:{" "}
									{me?.profile?.camera?.position?.y?.toFixed(2) ??
										defaultCameraPosition.y.toFixed(2)}
									, z:{" "}
									{me?.profile?.camera?.position?.z?.toFixed(2) ??
										defaultCameraPosition.z.toFixed(2)}
								</p>
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
