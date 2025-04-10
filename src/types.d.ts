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

export type ColorRGB = {
  r: number;
  g: number;
  b: number;
};

export type Cursor = {
  position: Vec3;
  color: ColorRGB;
  normal: Vec3;
};

export type TerrainSample = {
  uv: Vec2;
  strength: number;
};

export type Camera = {
  position: Vec3;
};

export interface RemoteCursor {
  value?: {
    position?: Vec3;
    normal?: Vec3;
    color?: ColorRGB;
  };
  tx: {
    sessionID: string;
  };
}
