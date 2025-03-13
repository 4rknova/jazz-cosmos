import React, { useRef, useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface PlanetProps {
  disableEditing: boolean;
  showWireframe: boolean;
}

const Planet: React.FC<PlanetProps> = ({ disableEditing, showWireframe }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const [heights, setHeights] = useState<Float32Array | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    if (!meshRef.current || !meshRef.current.geometry) return;

    const geometry = meshRef.current.geometry as THREE.BufferGeometry;
    const vertexCount = geometry.attributes.position?.count;

    if (!vertexCount) return;

    if (!heights) {
      setHeights(new Float32Array(vertexCount).fill(0));
    }

    updateColors(); // ✅ Ensure colors initialize properly
  }, []);

  // Start modifying terrain when mouse is pressed
  const handleMouseDown = (event: MouseEvent) => {
    if (disableEditing) return;
    setIsMouseDown(true);
    modifyTerrain(event);
  };

  // Stop modifying terrain when mouse is released
  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  // Modify terrain continuously while moving mouse
  const handleMouseMove = (event: MouseEvent) => {
    if (!isMouseDown || disableEditing) return;
    modifyTerrain(event);
  };

  // Modify Terrain Based on Mouse Position
  const modifyTerrain = (event: MouseEvent) => {
    if (!meshRef.current || !heights) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const rect = gl.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(meshRef.current, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const face = hit.face;
      if (!face) return;

      const modifier = event.shiftKey ? -0.05 : 0.05;
      modifyHeight(face.a, modifier);
      modifyHeight(face.b, modifier * 0.8);
      modifyHeight(face.c, modifier * 0.8);

      updateGeometry();
      updateWireframe();
      updateColors();
    }
  };

  // Modify Height of a Specific Vertex
  const modifyHeight = (index: number, delta: number) => {
    if (!heights) return;
    heights[index] = heights[index] * 0.9 + (heights[index] + delta) * 0.1;
  };

  // Update Geometry Based on Heightmap
  const updateGeometry = () => {
    if (!meshRef.current || !heights) return;
    const geometry = meshRef.current.geometry as THREE.BufferGeometry;
    const position = geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < heights.length; i++) {
      const idx = i * 3;
      const normal = new THREE.Vector3(position[idx], position[idx + 1], position[idx + 2]).normalize();
      position[idx] = normal.x * (2 + heights[i]);
      position[idx + 1] = normal.y * (2 + heights[i]);
      position[idx + 2] = normal.z * (2 + heights[i]);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  // ✅ Update Colors Based on Elevation
  const updateColors = () => {
    if (!meshRef.current || !heights) return;
    const geometry = meshRef.current.geometry as THREE.BufferGeometry;
    const position = geometry.attributes.position.array as Float32Array;
    const colors = new Float32Array(position.length);

    for (let i = 0; i < heights.length; i++) {
      const height = heights[i];
      const color = new THREE.Color();

      if (height < -0.02) {
        color.setRGB(0, 0, 1); // Water (Blue)
      } else if (height < 0.02) {
        color.setRGB(0, 0.5, 0); // Grassland (Green)
      } else if (height < 0.1) {
        color.setRGB(0.5, 0.25, 0); // Mountain (Brown)
      } else {
        color.setRGB(1, 1, 1); // Snow (White)
      }

      const idx = i * 3;
      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;
    }

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.attributes.color.needsUpdate = true;
  };

  // ✅ Update Wireframe Grid to Match Terrain Changes
  const updateWireframe = () => {
    if (!meshRef.current || !wireframeRef.current) return;

    if (wireframeRef.current.geometry) {
      wireframeRef.current.geometry.dispose();
    }

    wireframeRef.current.geometry = new THREE.WireframeGeometry(meshRef.current.geometry);
  };

  useEffect(() => {
    gl.domElement.addEventListener("mousedown", handleMouseDown);
    gl.domElement.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      gl.domElement.removeEventListener("mousedown", handleMouseDown);
      gl.domElement.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [heights, disableEditing]);

  return (
    <group>
      {/* Main Planet */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial vertexColors={true} />
      </mesh>

      {/* ✅ Wireframe Toggle */}
      {showWireframe && (
        <mesh ref={wireframeRef} scale={1.002}>
          <wireframeGeometry attach="geometry" args={[meshRef.current?.geometry]} />
          <meshBasicMaterial color="white" wireframe />
        </mesh>
      )}
    </group>
  );
};

export default Planet;
