import type React from "react";
import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const scene = new THREE.Scene();
  const lightPosition =  new THREE.Vector3(0, 0, 10);

  const { invalidate } = useThree();
  const [pendingPoints, setPendingPoints] = useState<{ uv: THREE.Vector2; strength: number }[]>([]);

  // Shadow camera setup
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const lightCamera = new THREE.OrthographicCamera(-5, 5, 5, -5, 1, 20);

  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const universalMaterialUniforms = { 
    uHeightmap: { value: heightmapA.texture },
    uHeightmapSize: { value: heightMapSize },
    uShadowMap: { value: shadowMap.texture },
    uLightPos: { value:  lightPosition },
    uEyePos: { value: camera.position },
    uTime: { value: 0.0 }, // Add time uniform
  };

  const brushMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uHeightmap: { value: heightmapA.texture },
      uUV: { value: new THREE.Vector2(0, 0) },
      uBrushSize: { value: 0.03 },
      uBrushStrength: { value: 1.0 },
    },
    vertexShader: brushVertexShader,
    fragmentShader: brushFragmentShader,
  });  scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x00ff00 })));
  const quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), brushMaterial);
  quadScene.add(quadMesh);

  useFrame((state) => {
    const { gl, scene, camera, clock } = state;

    // Update time uniform

    console.log("useFrame running"); 
    universalMaterialUniforms.uTime.value = clock.getElapsedTime();

    if (lightRef.current) {
      // Update light camera position to match directional light
      lightCamera.position.copy(lightRef.current.position);
      lightCamera.lookAt(0, 0, 0);
      lightCamera.updateMatrixWorld(true);
    }

    // Render the scene from the light's perspective into the shadow map
    gl.setRenderTarget(shadowMap);
    gl.clear();
    gl.render(scene, lightCamera);


    gl.setRenderTarget(rt0);
    gl.render(scene, camera);


    if (pendingPoints.length > 0) {
      // Choose the inactive buffer for writing
      const nextHeightmap = activeHeightmap === heightmapA ? heightmapB : heightmapA;
      // Render each point to the heightmap
      for (const { uv, strength } of pendingPoints) {
        brushMaterial.uniforms.uHeightmap.value = activeHeightmap.texture;
        brushMaterial.uniforms.uUV.value = uv;
        brushMaterial.uniforms.uBrushStrength.value = strength;

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

  const handlePointerDown = (event: THREE.Event) => {
    if (!meshRef.current) return;
  
    // Convert screen coordinates to normalized device coordinates (-1 to +1)
    pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    // Perform raycasting
    raycaster.current.setFromCamera(pointer.current, camera);
    const intersects = raycaster.current.intersectObject(meshRef.current);
  
    if (intersects.length > 0) {
      const { uv } = intersects[0];
      if (uv) {
        const strength = event.shiftKey ? -1 : 1;
  
        // Append new point to the list
        setPendingPoints((prevPoints) => [...prevPoints, { uv, strength }]);
      }
    }
  };

  const modifyHeightmap = (uv: THREE.Vector2, strength: number) => {
   // Choose the inactive buffer for writing
   const nextHeightmap = activeHeightmap === heightmapA ? heightmapB : heightmapA;

   brushMaterial.uniforms.uHeightmap.value = activeHeightmap.texture; // Read from active
   brushMaterial.uniforms.uUV.value = uv;
   brushMaterial.uniforms.uBrushStrength.value = strength;

   // Render updated heightmap into nextHeightmap
   gl.setRenderTarget(nextHeightmap);
   gl.clear();
   gl.render(quadScene, quadCamera);

   // Swap buffers (nextHeightmap becomes active)
   setActiveHeightmap(nextHeightmap);

   // Reset to default render target
   gl.setRenderTarget(null);
   invalidate();
  };


  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow
      onPointerDown={handlePointerDown}
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
        <planeGeometry args={[2, 1]} />
        <shaderMaterial
          uniforms={universalMaterialUniforms}
          fragmentShader={vizFragmentShader}
          vertexShader={vizVertexShader}
        />    
      </mesh>
    </group>
  );
};

export default Planet;

