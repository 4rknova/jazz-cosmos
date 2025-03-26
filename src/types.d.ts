export interface TextureProps {
  url: string;
}

export type Vec2 = {
  x: number;
  y: number;
};

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type Cursor = {
  position: Vec2;
  color: Vec3;
};

export type Camera = {
  position: Vec3;
};
