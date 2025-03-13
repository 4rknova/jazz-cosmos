import { useTexture } from "@react-three/drei";
import { MeshProps } from "@react-three/fiber";


interface PlanetProps extends MeshProps {
  textureUrl: string;
}

const Planet: React.FC<PlanetProps> = ({ textureUrl, ...props }) => {
  const texture = useTexture(textureUrl);

  return (
    <mesh {...props}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
};

export default Planet;
