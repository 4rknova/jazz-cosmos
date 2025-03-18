import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useAccount, useIsAuthenticated } from "jazz-react";
import { useEffect, useState, useRef } from "react";
import { AuthButton } from "./components/AuthButton.tsx";
import { CameraController } from "./components/CameraController.tsx";
import { Logo } from "./components/Logo.tsx";
import Planet from "./components/Planet.tsx";
import Stars from "./components/Stars.tsx";
import { Camera, Vec3 } from "./schema.ts";

function App() {
	const { me } = useAccount({ profile: {}, root: {} });
	const isAuthenticated = useIsAuthenticated();

	// Default camera position
	const defaultCameraPosition = { x: 5, y: 2, z: 5 };
	// State to track the current camera position
	const [cameraPosition, setCameraPosition] = useState(defaultCameraPosition);
	// Flag to prevent saving camera position during initial load
	const initialLoadComplete = useRef(false);

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

	// Load camera position from profile when component mounts
	useEffect(() => {
		if (me?.profile) {
			// Check if camera exists in profile
			if (!me.profile.camera) {
				// Create camera object if it doesn't exist
				console.log("Creating new camera object in profile");
				const position = Vec3.create({
					x: defaultCameraPosition.x,
					y: defaultCameraPosition.y,
					z: defaultCameraPosition.z,
				});
				me.profile.camera = Camera.create({ position });
			} else if (me.profile.camera.position) {
				// Load saved camera position
				const savedPosition = me.profile.camera.position;
				console.log("Loaded camera position from profile:", savedPosition);
				setCameraPosition({
					x: savedPosition.x,
					y: savedPosition.y,
					z: savedPosition.z,
				});
			}
			initialLoadComplete.current = true;
		}
	}, [me?.profile]);

	// Function to handle camera position changes
	const handleCameraChange = (
		position: { x: number; y: number; z: number },
		isEndOfInteraction = false,
	) => {
		// Update local state
		setCameraPosition(position);

		// Only save to profile when interaction ends or during continuous movement if authenticated
		if (
			isEndOfInteraction &&
			initialLoadComplete.current &&
			me?.profile?.camera?.position
		) {
			console.log("Saving camera position to profile:", position);
			// Update the camera position in the profile
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
						position: [cameraPosition.x, cameraPosition.y, cameraPosition.z],
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
					<Planet disableEditing={controlHeld} />
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
									Camera position: x: {cameraPosition.x.toFixed(2)}, y:{" "}
									{cameraPosition.y.toFixed(2)}, z:{" "}
									{cameraPosition.z.toFixed(2)}
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
