import { useRef, useState, useEffect, useCallback } from "react";
import type React from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { type Mesh, type BufferGeometry, Raycaster, Vector2, Vector3, Color } from "three";

interface PlanetProps {
  showWireframe: boolean;
}

const Planet: React.FC<PlanetProps> = ({ showWireframe }) => {
  const meshRef = useRef<Mesh>(null);
  const wireframeRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();
  const [heights, setHeights] = useState<Float32Array | null>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const geometry = meshRef.current.geometry as BufferGeometry;
    const vertexCount = geometry.attributes.position.count;

    if (!heights) {
      setHeights(new Float32Array(vertexCount).fill(0)); // Store height values separately
    }
    updateColors(); // Ensure colors are set initially
  }, [heights]);

  // Handle Click to Modify Terrain
  const handleClick = useCallback((event: MouseEvent) => {
    if (!meshRef.current || !heights) return;

    const raycaster = new Raycaster();
    const mouse = new Vector2();
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

      if (shouldSubdivide(hit.point, face)) {
        subdivideFace(face);
      }

      modifyHeight(face.a, modifier);
      modifyHeight(face.b, modifier * 0.8);
      modifyHeight(face.c, modifier * 0.8);

      updateGeometry();
      updateColors();
    }
  }, [heights, gl, camera]);

  // Modify Height of a Specific Vertex
  const modifyHeight = (index: number, delta: number) => {
    if (!heights) return;
    heights[index] = heights[index] * 0.9 + (heights[index] + delta) * 0.1;
  };

  // Update Geometry Based on Heightmap
  const updateGeometry = () => {
    if (!meshRef.current || !heights) return;
    const geometry = meshRef.current.geometry as BufferGeometry;
    const position = geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < heights.length; i++) {
      const idx = i * 3;
      const normal = new Vector3(position[idx], position[idx + 1], position[idx + 2]).normalize();
      position[idx] = normal.x * (2 + heights[i]);
      position[idx + 1] = normal.y * (2 + heights[i]);
      position[idx + 2] = normal.z * (2 + heights[i]);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  // Update Colors Based on Elevation
  const updateColors = () => {
    if (!meshRef.current || !heights) return;
    const geometry = meshRef.current.geometry as BufferGeometry;
    const position = geometry.attributes.position.array as Float32Array;
    const colors = new Float32Array(position.length);

    for (let i = 0; i < heights.length; i++) {
      const height = heights[i];
      const color = new Color();

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

  // Check if Triangle Needs Subdivision
  const shouldSubdivide = (point: THREE.Vector3, face: THREE.Face) => {
    const geometry = meshRef.current?.geometry as BufferGeometry;
    const position = geometry.attributes.position.array as Float32Array;

    const vA = new Vector3(position[face.a * 3], position[face.a * 3 + 1], position[face.a * 3 + 2]);
    const vB = new Vector3(position[face.b * 3], position[face.b * 3 + 1], position[face.b * 3 + 2]);
    const vC = new Vector3(position[face.c * 3], position[face.c * 3 + 1], position[face.c * 3 + 2]);

    const maxEdge = Math.max(vA.distanceTo(vB), vB.distanceTo(vC), vC.distanceTo(vA));
    return maxEdge > 0.2; // Subdivide if edge is larger than threshold
  };

  // Subdivide a Face into Smaller Triangles
  const subdivideFace = (face: THREE.Face) => {
    const geometry = meshRef.current?.geometry as BufferGeometry;
    const position = geometry.attributes.position.array as Float32Array;

    const vA = new Vector3(position[face.a * 3], position[face.a * 3 + 1], position[face.a * 3 + 2]);
    const vB = new Vector3(position[face.b * 3], position[face.b * 3 + 1], position[face.b * 3 + 2]);
    const vC = new Vector3(position[face.c * 3], position[face.c * 3 + 1], position[face.c * 3 + 2]);

    const midAB = new Vector3().lerpVectors(vA, vB, 0.5);
    const midBC = new Vector3().lerpVectors(vB, vC, 0.5);
    const midCA = new Vector3().lerpVectors(vC, vA, 0.5);

    for (const v of [midAB, midBC, midCA]) {
      v.normalize().multiplyScalar(2);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([...position, ...midAB.toArray(), ...midBC.toArray(), ...midCA.toArray()], 3)
    );

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  useEffect(() => {
    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [gl, handleClick]);

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial vertexColors={true} />
      </mesh>

      {showWireframe && (
        <mesh ref={wireframeRef} scale={1.002}>
          <sphereGeometry args={[2, 64, 64]} />
          <meshBasicMaterial color="white" wireframe />
        </mesh>
      )}
    </group>
  );
};

export default Planet;
