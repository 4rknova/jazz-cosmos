import { useFBO } from "@react-three/drei";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useCoState } from "jazz-react";
import { ID } from "jazz-tools";
import { World } from "../schema";
import brushFragmentShader from "../shaders/brushFragment.glsl";
import brushVertexShader from "../shaders/brushVertex.glsl";
import planetFragmentShader from "../shaders/planetFragment.glsl";
import planetVertexShader from "../shaders/planetVertex.glsl";
import Cursor from "./Cursor";
import { openRenderTargetsInNewTab } from "../gfxutils";
import { RemoteCursor } from "../types";

interface PlanetProps {  
  worldId: ID<World>;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}

const Planet: React.FC<PlanetProps> = ({ worldId: worldId, onProgress, onComplete }) => {
  useEffect(() => {
    console.log("Planet mounted");
    return () => console.log("Planet unmounted");
  }, []);

  const world = useCoState(World, worldId, {resolve: true});
  
  const meshRef = useRef<THREE.Mesh>(null);
  const heightMapSize = 1024; // Heightmap texture resolution
  const shadowMapSize = 1024;
  const shadowMap = useFBO(shadowMapSize, shadowMapSize, {
    depthTexture: new THREE.DepthTexture(shadowMapSize, shadowMapSize, THREE.UnsignedShortType),
    depthBuffer: true,
  });

  const heightmapA = useFBO(heightMapSize, heightMapSize, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    generateMipmaps: true, // Enables mipmaps
    minFilter: THREE.LinearMipmapLinearFilter, // Use mipmaps when downscaling
    magFilter: THREE.LinearFilter, // Default for upscaling
    wrapS: THREE.RepeatWrapping, // Optional wrapping modes
    wrapT: THREE.RepeatWrapping,
  });
  const heightmapB = useFBO(heightMapSize, heightMapSize, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    generateMipmaps: true, // Enables mipmaps
    minFilter: THREE.LinearMipmapLinearFilter, // Use mipmaps when downscaling
    magFilter: THREE.LinearFilter, // Default for upscaling
    wrapS: THREE.RepeatWrapping, // Optional wrapping modes
    wrapT: THREE.RepeatWrapping,
  });
  
  
  const pingHeightmapRef = useRef(heightmapA);
  const pongHeightmapRef = useRef(heightmapB);

  const { camera, gl } = useThree();
  const scene = new THREE.Scene();
  const raycaster = useRef(new THREE.Raycaster());

  
  const [hoverPosition, setHoverPosition] = useState<THREE.Vector3>(
    new THREE.Vector3(0, 0, 0),
  );
  

  const [hoverUV, setHoverUV] = useState<THREE.Vector2>(
    new THREE.Vector2(0, 0),
  );

  const [playerColor, ] = useState<THREE.Color>(
    new THREE.Color(Math.random(), Math.random(), Math.random()),
  );

  const isDrawingRef = useRef(false);
  const [pendingPoints, setPendingPoints] = useState<
  { uv: { x: number; y: number }; strength: number }[]>([]);

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

  const [mousePointer, ] = useState(new THREE.Vector2());
  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const universalMaterialUniforms = useRef({
    uHeightmap: { value: heightmapA.texture },
    uHeightmapSize: { value: heightMapSize },
    uShadowMap: { value: shadowMap.depthTexture },
    uLightPos: { value: new THREE.Vector3(0, 0, -3) },
    uEyePos: { value: camera.position },
    uTime: { value: 0.0 },
    uAmbientLight: { value: ambientLightRef.current },
    uLightMatrix: { value: new THREE.Matrix4() },
    uPlayerColor: { value: playerColor },
    uHoverUV: { value: hoverUV },
    uHoverPosition: { value: hoverPosition },
  }).current;

  const brushMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uHeightmap: { value: heightmapA.texture },
      uUV: { value: new THREE.Vector2(0, 0) },
      uBrushSize: { value: 0.01 },
      uBrushStrength: { value: 1.0 },
      uBrushPosition: { value: new THREE.Vector3(0, 0, 0) },
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
  const activeMouseButton = useRef<number | null>(null);

  // Handle mouse movement and click events
  useEffect(() => {
    const updateMousePosition = (event: MouseEvent) => {
      mousePosition.current = { x: event.clientX, y: event.clientY };
      isShiftKeyPressed.current = event.shiftKey;
      isCtrlKeyPressed.current = event.ctrlKey;

      // Convert screen coordinates to normalized device coordinates (-1 to +1)
      mousePointer.x = (mousePosition.current.x / window.innerWidth) * 2 - 1;
      mousePointer.y =-(mousePosition.current.y / window.innerHeight) * 2 + 1;
      raycaster.current.setFromCamera(mousePointer, camera);
      const intersects = raycaster.current.intersectObject(meshRef.current!);

      if (intersects.length > 0) {
        const { point, normal, uv } = intersects[0];

        if (uv) {
          setHoverUV(uv);
        }

        if (point) {
          setHoverPosition(point);
        }

        if (normal) {
          const newPosition = point
            .clone()
            .add(normal.clone().multiplyScalar(0.01));
          setHoverPosition(newPosition);
        }

        world?.cursor?.push({
          position: {
            x: point?.x || 0,
            y: point?.y || 0,
            z: point?.z || 0,
          },
          normal: {
            x: normal?.x || 0,
            y: normal?.y || 0,
            z: normal?.z || 0,
          },
          color: {
            r: playerColor.r,
            g: playerColor.g,
            b: playerColor.b,
          },
        });
      }

    };
    
    const handleMouseDown = (event: MouseEvent) => {
      activeMouseButton.current = event.button;
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === activeMouseButton.current) {
        activeMouseButton.current = null;
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
   
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [world?.cursor?.id]);

  const handleTerrainEdit = () => {
    // Only perform terrain editing with left mouse button (0)
    if (
      activeMouseButton.current !== 0 ||
      !isDrawingRef.current ||
      !meshRef.current
    )
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
        setPendingPoints((prevPoints) => [...prevPoints, { uv: { x: uv.x, y: uv.y }, strength }]);
      }
    }
  };

  useEffect(() => {
    if (!world?.edits || pendingPoints.length === 0) return;

    for (const point of pendingPoints) {
      world.edits.push({
        uv: point.uv,
        strength: point.strength,
      });
    }
    setPendingPoints([]);
  }, [pendingPoints]);


  const renderedCountRef = useRef(0); 
  const hasNotifiedDone = useRef(false);
  const BATCH_SIZE = 5;

  useFrame(() => {
    if (!camera || !gl || !quadScene || !quadCamera || !world?.edits) return;
  

    // Render the scene from the light's perspective into the shadow map
    gl.setRenderTarget(shadowMap);
    gl.clear(true, true, true);
    gl.render(scene, lightCamera);
    gl.setRenderTarget(null);
    
    handleTerrainEdit();
  
    // ✅ Step 2: Compute how many samples are unrendered
    const edits = world?.edits!;
    const totalEdits = edits.length;
    const unrenderedCount = totalEdits - renderedCountRef.current;
  
    if (unrenderedCount <= 0) return;
  
    // ✅ Step 3: Batch render the new ones

    const renderStart = totalEdits - unrenderedCount;
    const renderEnd = Math.min(renderStart + BATCH_SIZE, totalEdits);
  
    for (let i = renderStart; i < renderEnd; i++) {
      const sample = edits[i];
  
      const temp = pingHeightmapRef.current;
      pingHeightmapRef.current = pongHeightmapRef.current;
      pongHeightmapRef.current = temp;
  
      brushMaterial.uniforms.uHeightmap.value = pongHeightmapRef.current.texture;
      brushMaterial.uniforms.uUV.value = new THREE.Vector2(sample.uv.x, sample.uv.y);
      brushMaterial.uniforms.uBrushStrength.value = sample.strength * 0.02;
  
      gl.setRenderTarget(pingHeightmapRef.current);
      gl.clear();
      gl.render(quadScene, quadCamera);
      gl.setRenderTarget(null);
  
      renderedCountRef.current++;
    }
  
    // Optional: progress callback
    const percent = (renderedCountRef.current / totalEdits) * 100;
    if (onProgress) onProgress(percent);
  
    if (
      renderedCountRef.current >= totalEdits &&
      !hasNotifiedDone.current
    ) {
      hasNotifiedDone.current = true;
      if (onComplete) onComplete();
    }
  });


  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    // Only set drawing to true for left mouse button (button 0)
    if (event.button === 0) {
      isDrawingRef.current = true;
    }
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    // Only set drawing to false if it was the left mouse button
    if (event.button === 0) {
      isDrawingRef.current = false;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl + H
      if (e.ctrlKey && e.key.toLowerCase() === "h") {
        e.preventDefault(); // optional: prevent browser default behavior

        // Call with multiple render targets
        openRenderTargetsInNewTab(gl, [heightmapA, heightmapB, shadowMap]);
        
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gl]);

  
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
      {world?.cursor?.id && Object.values(world.cursor.perSession).map((cursor: RemoteCursor) => (
        <Cursor 
          key={cursor.tx.sessionID}
          position={cursor.value?.position ?? { x: 0, y: 0, z: 0 }}
          normal={cursor.value?.normal ?? { x: 0, y: 0, z: 0 }}
          color={cursor.value?.color ?? { r: 0, g: 0, b: 0 }}
        />
        ))
      }

    </group>
  );
};

export default Planet;
