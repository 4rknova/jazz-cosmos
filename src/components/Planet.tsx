import { useFBO } from "@react-three/drei";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useCoState } from "jazz-react";
import { ID } from "jazz-tools";
import { CursorFeed, ListOfTerrainEdits, TerrainEdit } from "../schema";
import { useAccount } from "jazz-react";
import brushFragmentShader from "../shaders/brushFragment.glsl";
import brushVertexShader from "../shaders/brushVertex.glsl";
import planetFragmentShader from "../shaders/planetFragment.glsl";
import planetVertexShader from "../shaders/planetVertex.glsl";
import Cursor from "./Cursor";
interface PlanetProps {  
  cursorFeedId: ID<CursorFeed>;
}

const Planet: React.FC<PlanetProps> = ({ cursorFeedId }) => {

  const { me } = useAccount();

  const cursorFeed = useCoState(CursorFeed, cursorFeedId, []);
  const planetEdits = useCoState(ListOfTerrainEdits, me?.profile?.world?.edits?.id, []);
  
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
  const [activeHeightmap, setActiveHeightmap] = useState(heightmapA);
  const { camera, gl, clock } = useThree();
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

        cursorFeed?.push({
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
  }, [cursorFeed?.id]);

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
        setPendingPoints((prevPoints) => [...prevPoints, { uv, strength }]);
      }
    }
  };

  useEffect(() => {
    if (planetEdits === undefined || pendingPoints.length === 0) return;
/*
    pendingPoints.forEach(point => {
      planetEdits?.push({
        uv: { x: point.uv.x, y: point.uv.y },
        position: { x: point.position.x, y: point.position.y, z: point.position.z },
        strength: point.strength
      });
    });
*/

    planetEdits?.push(...pendingPoints.map(point => ({ 
      ...
      {
        uv: { x: point.uv.x, y: point.uv.y },
        strength: point.strength
      }
     })));

  }, [pendingPoints]);


  const renderedSamplesRef = useRef(new Set<string>());
    
  // Render the scene
  useFrame(() => {
  
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

    if (planetEdits?.length - renderedSamplesRef.current.size > 0) {
      // Choose the inactive buffer for writing
      const nextHeightmap = (activeHeightmap === heightmapA ? heightmapB : heightmapA);
      brushMaterial.uniforms.uHeightmap.value = activeHeightmap.texture;
      gl.setRenderTarget(nextHeightmap);
      // Local player: Render each point to the heightmap

      /*
      for (const { uv, position, strength } of pendingPoints) {  
        brushMaterial.uniforms.uUV.value = uv;
        brushMaterial.uniforms.uBrushStrength.value = strength * 0.1;
        brushMaterial.uniforms.uBrushPosition.value = position;
        
        gl.clear();
        gl.render(quadScene, quadCamera);
      }
      */
      let count = 0;

      for (const sample of planetEdits) {
        if (renderedSamplesRef.current.has(sample)) continue;
        count++;
        const uv = new THREE.Vector2(sample.uv.x, sample.uv.y);
        const strength = sample.strength * 0.2;

        brushMaterial.uniforms.uUV.value = uv;
        brushMaterial.uniforms.uBrushStrength.value = strength * 0.1;

        gl.clear();
        gl.render(quadScene, quadCamera);

        renderedSamplesRef.current.add(sample);
      }
      console.log("Rendered", count, "samples");
  
      // Swap buffers (nextHeightmap becomes active)
      setActiveHeightmap(nextHeightmap);

      setPendingPoints([]);      
    }

    gl.setRenderTarget(null);
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
        openHeightmapInNewTab(gl, heightmapA);
        openHeightmapInNewTab(gl, heightmapB);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gl, activeHeightmap]);

  function openHeightmapInNewTab(renderer: THREE.WebGLRenderer, heightmap: THREE.WebGLRenderTarget) {
    const size = heightmap.width;
    const pixelBuffer = new Float32Array(size * size * 4); // RGBA float data
  
    // Make sure float read support is enabled
    if (!renderer.capabilities.isWebGL2 && !renderer.extensions.get("OES_texture_float")) {
      alert("Float textures not supported on this device.");
      return;
    }
  
    renderer.setRenderTarget(heightmap);
    renderer.readRenderTargetPixels(heightmap, 0, 0, size, size, pixelBuffer);
    renderer.setRenderTarget(null);
  
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(size, size);
  
    // Find min/max to normalize values between 0 and 255 for display
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < pixelBuffer.length; i += 4) {
      const value = pixelBuffer[i]; // Use R channel
      if (value < min) min = value;
      if (value > max) max = value;
    }
  
    const range = max - min || 1; // Avoid division by zero
  
    for (let i = 0; i < pixelBuffer.length; i += 4) {
      const floatVal = pixelBuffer[i]; // Use only the red channel
      const normalized = ((floatVal - min) / range) * 255;
      const byteVal = Math.max(0, Math.min(255, normalized));
  
      imageData.data[i] = byteVal;     // R
      imageData.data[i + 1] = byteVal; // G
      imageData.data[i + 2] = byteVal; // B
      imageData.data[i + 3] = 255;     // A
    }
  
    ctx.putImageData(imageData, 0, 0);
    const dataURL = canvas.toDataURL();
  
    // Open in new tab
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`
        <html>
          <head><title>Float Heightmap Preview</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#111;">
            <img src="${dataURL}" style="max-width:100%; max-height:100%;" />
          </body>
        </html>
      `);
      newTab.document.close();
    } else {
      alert("Popup blocked. Please allow popups to view the heightmap.");
    }
  }
  
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
      { 
        cursorFeed?.id && Object.values(cursorFeed.perSession).map((cursor: unknown) => { 
          const typedCursor = cursor as { value?: { position: any, color?: any, normal?: any }, tx: { sessionID: string } };

          return (
            <Cursor 
              key={typedCursor.tx.sessionID} 
              position={typedCursor.value?.position} 
              normal={typedCursor.value?.normal} 
              color={typedCursor.value?.color} 
            />
          )
        })
      }

    </group>
  );
};

export default Planet;
