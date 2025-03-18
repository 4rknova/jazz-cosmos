import type React from "react";
import { useRef, useState, useEffect } from "react";
import { useFrame, useThree, Vector3 } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import planetVertexShader from "./shaders/planetVertex.glsl";
import planetFragmentShader from "./shaders/planetFragment.glsl";
import vizVertexShader from "./shaders/vizVertex.glsl";
import vizFragmentShader from "./shaders/vizFragment.glsl";
import brushVertexShader from "./shaders/brushVertex.glsl";
import brushFragmentShader from "./shaders/brushFragment.glsl";

interface PlanetProps {
  disableEditing: boolean;
}

const Planet: React.FC<PlanetProps> = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const heightmapPreviewRef = useRef<THREE.Mesh>(null);
  const heightMapSize = 1024; // Heightmap texture resolution
  const rt0 = useFBO();
  const shadowMap = useFBO(heightMapSize, heightMapSize);
  const heightmapA = useFBO(heightMapSize, heightMapSize);
  const heightmapB = useFBO(heightMapSize, heightMapSize);
  const [activeHeightmap, setActiveHeightmap] = useState(heightmapA);
  const { camera, gl, clock } = useThree();
  const scene = new THREE.Scene();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const lightPosition =  new THREE.Vector3(0, 0, -10);

  const isDrawingRef = useRef(false);
  const [pendingPoints, setPendingPoints] = useState<{ uv: THREE.Vector2; strength: number }[]>([]);

  // Shadow camera setup
  const ambientLightRef = useRef<number>(0.025);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const lightCamera = new THREE.OrthographicCamera(-5, 5, 5, -5, 1, 20);

  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const universalMaterialUniforms = useRef({
    uHeightmap: { value: heightmapA.texture },
    uHeightmapSize: { value: heightMapSize },
    uShadowMap: { value: shadowMap.texture },
    uLightPos: { value: lightPosition },
    uEyePos: { value: camera.position },
    uTime: { value: 0.0 }, // Keep time 
    uAmbientLight: { value: ambientLightRef.current },
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
  });  scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x00ff00 })));
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
        
    if (lightRef.current) {
      lightRef.current.position = new THREE.Vector3(-10, 0, 10);
      // Update light camera position to match directional light
      lightCamera.position.copy(lightRef.current.position);
      lightCamera.lookAt(0, 0, 0);
      lightCamera.updateMatrixWorld(true);
    }

    universalMaterialUniforms.uTime.value = clock.getElapsedTime();
    universalMaterialUniforms.uEyePos.value = camera.position;
    universalMaterialUniforms.uHeightmap.value = activeHeightmap.texture;


    // Render the scene from the light's perspective into the shadow map
    gl.setRenderTarget(shadowMap);
    gl.clear();
    gl.render(scene, lightCamera);


    gl.setRenderTarget(rt0);
    gl.render(scene, camera);

    handleTerrainEdit();

    if (pendingPoints.length > 0) {
      // Choose the inactive buffer for writing
      const nextHeightmap = activeHeightmap === heightmapA ? heightmapB : heightmapA;
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
    if (isCtrlKeyPressed.current || !isDrawingRef.current || !meshRef.current ) return;
    
    // Convert screen coordinates to normalized device coordinates (-1 to +1)
    pointer.current.x = (mousePosition.current.x / window.innerWidth) * 2 - 1;
    pointer.current.y = -(mousePosition.current.y / window.innerHeight) * 2 + 1;
  
    // Perform raycasting
    raycaster.current.setFromCamera(pointer.current, camera);
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
      <mesh ref={meshRef} castShadow receiveShadow
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <icosahedronGeometry args={[1, 100]}
      />
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
        
        {/* <planeGeometry args={[2, 1]} />
        <shaderMaterial
          uniforms={universalMaterialUniforms}
          fragmentShader={vizFragmentShader}
          vertexShader={vizVertexShader}
        />     */}
      </mesh>
    </group>
  );
};

export default Planet;