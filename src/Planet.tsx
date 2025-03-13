import type React from "react";
import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";

interface PlanetProps {
  disableEditing: boolean;
}

const Planet: React.FC<PlanetProps> = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const heightmapPreviewRef = useRef<THREE.Mesh>(null);
  const heightMapSize = 1024; // Heightmap texture resolution
  const rt0 = useFBO();
  const shadowMap = useFBO(heightMapSize, heightMapSize);
  const heightmapA = useFBO(2*heightMapSize, heightMapSize);
  const heightmapB = useFBO(2*heightMapSize, heightMapSize);
  const [activeHeightmap, setActiveHeightmap] = useState(heightmapA);

  const tempRenderTarget = useFBO(heightMapSize, heightMapSize); // Temporary render target
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const scene = new THREE.Scene();
  const lightPosition =  new THREE.Vector3(0, 0, 10);

  
  // Shadow camera setup
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const lightCamera = new THREE.OrthographicCamera(-5, 5, 5, -5, 1, 20);

  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const planetMaterialUniforms = { 
    uHeightmap: { value: heightmapA.texture },
    uHeightmapSize: { value: heightMapSize },
    uShadowMap: { value: shadowMap.texture },
    uLightPos: { value:  lightPosition },
  };
  const planetMaterialVertexShader= `
    precision highp float;
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform sampler2D uHeightmap;

    float displacement(vec2 vUv) {
      return texture2D(uHeightmap, vUv).r;
    }

    void main() {
      vUv = uv;
      vNormal = normal;
      vec3 pos = position + normal * displacement(uv);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;
  const planetMaterialfragmentShader= `
    precision highp float;
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform vec3 uLightPos;
    uniform sampler2D uHeightmap;

    float displacement(vec2 vUv) {
      return texture2D(uHeightmap, vUv).r;
    }

    vec3 normal(vec2 uv)
    {
      return texture2D(uHeightmap, uv).gba;
    }

    void main() {
      float displacement = displacement(vUv);
      
      vec3 color = vec3(0.0, 0.0, 0.0);

      if (displacement > 0.05) {
        color = vec3(0.5, 0.3, 0.1);
      } else {
        color = vec3(0.04, 0.1, 1.0);
      }

      vec3 lightDir = normalize(uLightPos);
      color *= dot(lightDir, normal(vUv));

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const brushMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uHeightmap: { value: heightmapA.texture },
      uUV: { value: new THREE.Vector2(0, 0) },
      uBrushSize: { value: 0.02 },
      uBrushStrength: { value: 0.1 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uHeightmap;
      uniform vec2 uUV;
      uniform float uHeightmapSize;
      uniform float uBrushSize;
      uniform float uBrushStrength;

      #define OFFSET_X 1
      #define OFFSET_Y 1
      #define DEPTH	 5.5

      vec3 texsample(const int x, const int y, in vec2 fragCoord)
      {
        vec2 resolution = vec2(2.0 * uHeightmapSize, uHeightmapSize);
        vec2 uv = (uUV * resolution + vec2(x, y)) / resolution;
        return texture(uHeightmap, uv).xyz;
      }

      float cluminance(vec3 c)
      {
        return dot(c, vec3(.2126, .7152, .0722));
      }

      vec3 normal(in vec2 fragCoord)
      {
        float R = abs(cluminance(texsample( OFFSET_X,0, fragCoord)));
        float L = abs(cluminance(texsample(-OFFSET_X,0, fragCoord)));
        float D = abs(cluminance(texsample(0, OFFSET_Y, fragCoord)));
        float U = abs(cluminance(texsample(0,-OFFSET_Y, fragCoord)));
              
        float X = (L-R) * .5;
        float Y = (U-D) * .5;

        return normalize(vec3(X, Y, 1. / DEPTH));
      }

      void main() {
        vec4 original = texture2D(uHeightmap, vUv);
        float dist = distance(vUv, uUV);

        if (dist < uBrushSize) {
          original.r += uBrushStrength * (1.0 - dist / uBrushSize);
        }

        original.r = clamp(original.r, 0.0, 0.25);
        original.gba = normal(vUv);
        
        gl_FragColor = original;
      }
    `,
  });  scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x00ff00 })));
  const quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), brushMaterial);
  quadScene.add(quadMesh);

  useFrame((state) => {
    const { gl, scene, camera } = state;

    if (!lightRef.current) return;
    // Update light camera position to match directional light
    lightCamera.position.copy(lightRef.current.position);
    lightCamera.lookAt(0, 0, 0);
    lightCamera.updateMatrixWorld(true);

    // Render the scene from the light's perspective into the shadow map
    gl.setRenderTarget(shadowMap);
    gl.clear();
    gl.render(scene, lightCamera);


    gl.setRenderTarget(rt0);
    gl.render(scene, camera);

    
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
        //console.log("Clicked UV Coordinates:", uv);
        incrementHeightmap(uv);
      }
    }
  };

  const incrementHeightmap = (uv: THREE.Vector2) => {
   // Choose the inactive buffer for writing
   const nextHeightmap = activeHeightmap === heightmapA ? heightmapB : heightmapA;

   brushMaterial.uniforms.uHeightmap.value = activeHeightmap.texture; // Read from active
   brushMaterial.uniforms.uUV.value = uv;

   // Render updated heightmap into nextHeightmap
   gl.setRenderTarget(nextHeightmap);
   gl.clear();
   gl.render(quadScene, quadCamera);

   // Swap buffers (nextHeightmap becomes active)
   setActiveHeightmap(nextHeightmap);

   // Reset to default render target
   gl.setRenderTarget(null);
  };


  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow
      onPointerDown={handlePointerDown}
      >
        <icosahedronGeometry args={[2, 50]}
      />
      <shaderMaterial
          uniforms={planetMaterialUniforms}
          fragmentShader={planetMaterialfragmentShader}
          vertexShader={planetMaterialVertexShader}
        />
      </mesh>
      <mesh
        ref={heightmapPreviewRef}
        position={[-2.5, -1.5, 0]}
        scale={[1, 1, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          uniforms={planetMaterialUniforms}
          fragmentShader={planetMaterialfragmentShader}
          vertexShader={planetMaterialVertexShader}
        />    
      </mesh>
    </group>
  );
};

export default Planet;

