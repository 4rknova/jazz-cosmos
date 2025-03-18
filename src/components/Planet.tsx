import type React from "react";
import { useRef, useState, useEffect } from "react";
import { useFrame, useThree, Vector3 } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import planetVertexShader from "./shaders/planetVertex.glsl";
import planetFragmentShader from "./shaders/planetFragment.glsl";
import brushVertexShader from "./shaders/brushVertex.glsl";
import brushFragmentShader from "./shaders/brushFragment.glsl";
import pointerVertexShader from "./shaders/pointerVertex.glsl";
import pointerFragmentShader from "./shaders/pointerFragment.glsl";

interface PlanetProps {
	disableEditing: boolean;
}

const Planet: React.FC<PlanetProps> = () => {
	const meshRef = useRef<THREE.Mesh>(null);
	const heightmapPreviewRef = useRef<THREE.Mesh>(null);
	const heightMapSize = 1024; // Heightmap texture resolution
	const shadowMapSize = 2048;
	const shadowMap = useFBO(shadowMapSize, shadowMapSize, {
		depthTexture: new THREE.DepthTexture(shadowMapSize, shadowMapSize),
		depthBuffer: true,
	});

	shadowMap.depthTexture.format = THREE.DepthFormat;
	shadowMap.depthTexture.type = THREE.UnsignedShortType;

	const heightmapA = useFBO(heightMapSize, heightMapSize, {
		generateMipmaps: true, // Enables mipmaps
		minFilter: THREE.LinearMipmapLinearFilter, // Use mipmaps when downscaling
		magFilter: THREE.LinearFilter, // Default for upscaling
		wrapS: THREE.RepeatWrapping, // Optional wrapping modes
		wrapT: THREE.RepeatWrapping,
	});
	const heightmapB = useFBO(heightMapSize, heightMapSize, {
		generateMipmaps: true, // Enables mipmaps
		minFilter: THREE.LinearMipmapLinearFilter, // Use mipmaps when downscaling
		magFilter: THREE.LinearFilter, // Default for upscaling
		wrapS: THREE.RepeatWrapping, // Optional wrapping modes
		wrapT: THREE.RepeatWrapping,
	});
	const [activeHeightmap, setActiveHeightmap] = useState(heightmapA);
	const { camera, gl, clock } = useThree();
	const scene = new THREE.Scene();
	const raycaster = useRef(new THREE.Raycaster());

	const indicatorRef = useRef<THREE.Mesh>(null);
	const [hoverPosition, setHoverPosition] = useState<THREE.Vector3>(
		new THREE.Vector3(0, 0, 0),
	);
	const [hoverNormal, setHoverNormal] = useState<THREE.Vector3>(
		new THREE.Vector3(0, 0, 0),
	);
	const [hoverUV, setHoverUV] = useState<THREE.Vector2>(
		new THREE.Vector2(0, 0),
	);
	const [playerColor, setPlayerColor] = useState<THREE.Color>(
		new THREE.Color(Math.random(), Math.random(), Math.random()),
	);

	const isDrawingRef = useRef(false);
	const [pendingPoints, setPendingPoints] = useState<
		{ uv: THREE.Vector2; strength: number }[]
	>([]);

	// Shadow camera setup
	const ambientLightRef = useRef<number>(0.01);
	const lightRef = useRef<THREE.DirectionalLight>(null);
	const lightCamera = new THREE.OrthographicCamera(-15, 15, 15, -15, 0.1, 20);

	useEffect(() => {
		if (lightRef.current) {
			lightRef.current.castShadow = true;
			lightRef.current.shadow.mapSize.width = shadowMapSize;
			lightRef.current.shadow.mapSize.height = shadowMapSize;
			lightRef.current.shadow.camera.near = 0.1;
			lightRef.current.shadow.camera.far = 5;
			lightRef.current.shadow.camera.left = -5;
			lightRef.current.shadow.camera.right = 5;
			lightRef.current.shadow.camera.top = 5;
			lightRef.current.shadow.camera.bottom = -2;
			lightRef.current.shadow.camera.updateProjectionMatrix();
			lightRef.current.position.set(0, 0, -3);
			lightRef.current.target.position.set(0, 0, 0);
			scene.add(lightRef.current);
		}
	}, [scene]);

	const mousePointer = useRef(new THREE.Vector2());
	const quadScene = new THREE.Scene();
	const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	const universalMaterialUniforms = useRef({
		uHeightmap: { value: heightmapA.texture },
		uHeightmapSize: { value: heightMapSize },
		uShadowMap: { value: shadowMap.depthTexture },
		uLightPos: { value: new THREE.Vector3(0, 0, -3) },
		uEyePos: { value: camera.position },
		uTime: { value: 0.0 }, // Keep time
		uAmbientLight: { value: ambientLightRef.current },
		uLightMatrix: { value: new THREE.Matrix4() },
		uPlayerColor: { value: playerColor },
		uHoverUV: { value: hoverUV },
	}).current;

	const brushMaterial = new THREE.ShaderMaterial({
		uniforms: {
			uHeightmap: { value: heightmapA.texture },
			uUV: { value: new THREE.Vector2(0, 0) },
			uBrushSize: { value: 0.01 },
			uBrushStrength: { value: 1.0 },
		},
		vertexShader: brushVertexShader,
		fragmentShader: brushFragmentShader,
	});
	scene.add(
		new THREE.Mesh(
			new THREE.BoxGeometry(1, 1, 1),
			new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
		),
	);
	const quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), brushMaterial);
	quadScene.add(quadMesh);

	const mousePosition = useRef({ x: 0, y: 0 });
	const isShiftKeyPressed = useRef(false);
	const isCtrlKeyPressed = useRef(false);
	useEffect(() => {
		const updateMousePosition = (event: MouseEvent) => {
			mousePosition.current = { x: event.clientX, y: event.clientY };
			isShiftKeyPressed.current = event.shiftKey;
			isCtrlKeyPressed.current = event.ctrlKey;
		};

		window.addEventListener("mousemove", updateMousePosition);

		return () => {
			window.removeEventListener("mousemove", updateMousePosition);
		};
	}, []);

	useFrame(() => {
		// Convert screen coordinates to normalized device coordinates (-1 to +1)
		mousePointer.current.x =
			(mousePosition.current.x / window.innerWidth) * 2 - 1;
		mousePointer.current.y =
			-(mousePosition.current.y / window.innerHeight) * 2 + 1;

		raycaster.current.setFromCamera(mousePointer.current, camera);
		const intersects = raycaster.current.intersectObject(meshRef.current);

		if (intersects.length > 0) {
			const { point, normal, uv } = intersects[0];

			if (uv) {
				setHoverUV(uv);
			}

			if (normal) {
				setHoverNormal(normal.clone());
				setHoverPosition(
					point.clone().add(normal.clone().multiplyScalar(0.01)),
				);
			}
		} else {
			setHoverPosition(null);
			setHoverNormal(null);
		}

		// Position and orient the indicator if hovering
		if (hoverPosition && hoverNormal && indicatorRef.current) {
			indicatorRef.current.position.copy(hoverPosition);
			const lookAtTarget = hoverPosition.clone().add(hoverNormal);
			indicatorRef.current.lookAt(lookAtTarget);
		}

		if (lightRef.current) {
			// Update light camera position to match directional light
			lightRef.current.position.set(0, 0, -10);
			lightCamera.position.copy(lightRef.current.position);
			lightCamera.lookAt(0, 0, 0);
			lightCamera.updateMatrixWorld(true);
		}

		universalMaterialUniforms.uPlayerColor.value = playerColor;
		universalMaterialUniforms.uTime.value = clock.getElapsedTime();
		universalMaterialUniforms.uEyePos.value = camera.position;
		universalMaterialUniforms.uHeightmap.value = activeHeightmap.texture;
		universalMaterialUniforms.uShadowMap.value = shadowMap.depthTexture;
		universalMaterialUniforms.uHoverUV.value = hoverUV;
		universalMaterialUniforms.uLightMatrix.value.multiplyMatrices(
			lightCamera.projectionMatrix,
			lightCamera.matrixWorldInverse,
		);

		// Render the scene from the light's perspective into the shadow map
		gl.setRenderTarget(shadowMap);
		gl.clear(true, true, true);
		gl.render(scene, lightCamera);
		gl.setRenderTarget(null);

		handleTerrainEdit();

		if (pendingPoints.length > 0) {
			// Choose the inactive buffer for writing
			const nextHeightmap =
				activeHeightmap === heightmapA ? heightmapB : heightmapA;
			// Render each point to the heightmap
			for (const { uv, strength } of pendingPoints) {
				brushMaterial.uniforms.uHeightmap.value = activeHeightmap.texture;
				brushMaterial.uniforms.uUV.value = uv;
				brushMaterial.uniforms.uBrushStrength.value = strength * 0.1;

				gl.setRenderTarget(nextHeightmap);
				gl.clear();
				gl.render(quadScene, quadCamera);
			}

			// Swap buffers (nextHeightmap becomes active)
			setActiveHeightmap(nextHeightmap);
			// Clear pending points after processing
			setPendingPoints([]);
		}

		gl.setRenderTarget(null);
	});

	const handlePointerDown = () => {
		isDrawingRef.current = true;
	};

	const handlePointerUp = () => {
		isDrawingRef.current = false;
	};

	const handleTerrainEdit = () => {
		if (isCtrlKeyPressed.current || !isDrawingRef.current || !meshRef.current)
			return;

		// Convert screen coordinates to normalized device coordinates (-1 to +1)
		mousePointer.x = (mousePosition.current.x / window.innerWidth) * 2 - 1;
		mousePointer.y = -(mousePosition.current.y / window.innerHeight) * 2 + 1;

		// Perform raycasting
		raycaster.current.setFromCamera(mousePointer, camera);
		const intersects = raycaster.current.intersectObject(meshRef.current);

		if (intersects.length > 0) {
			const { uv } = intersects[0];
			if (uv) {
				const strength = isShiftKeyPressed.current ? -1 : 1;

				// Append new point to the list
				setPendingPoints((prevPoints) => [...prevPoints, { uv, strength }]);
			}
		}
	};

	return (
		<group>
			<mesh
				ref={meshRef}
				castShadow
				receiveShadow
				onPointerDown={handlePointerDown}
				onPointerUp={handlePointerUp}
			>
				<icosahedronGeometry args={[1, 50]} />
				<shaderMaterial
					uniforms={universalMaterialUniforms}
					fragmentShader={planetFragmentShader}
					vertexShader={planetVertexShader}
				/>
			</mesh>
			<mesh
				ref={heightmapPreviewRef}
				position={[-2.5, -1.5, 0]}
				scale={[1, 1, 1]}
			>
				{/* <>
        <planeGeometry args={[2, 1]} />
        <shaderMaterial
          uniforms={universalMaterialUniforms}
          fragmentShader={vizFragmentShader}
          vertexShader={vizVertexShader}
        /> 
        </> */}
			</mesh>

			<mesh ref={indicatorRef}>
				<planeGeometry args={[0.1, 0.1]} />
				<shaderMaterial
					uniforms={universalMaterialUniforms}
					fragmentShader={pointerFragmentShader}
					vertexShader={pointerVertexShader}
					transparent={true}
					depthWrite={false}
					blending={THREE.NormalBlending}
				/>
			</mesh>
		</group>
	);
};

export default Planet;
