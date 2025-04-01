import * as THREE from "three";

export function openRenderTargetsInNewTab(
  renderer: THREE.WebGLRenderer,
  renderTargets: { label: string; value: THREE.WebGLRenderTarget }[],
): void {
  const isWebGL2 = renderer.capabilities.isWebGL2;
  const supportsFloat =
    isWebGL2 || renderer.extensions.get("OES_texture_float");
  const supportsHalfFloat =
    isWebGL2 || renderer.extensions.get("OES_texture_half_float");

  if (!supportsFloat && !supportsHalfFloat) {
    alert("Neither float nor half-float textures are supported.");
    return;
  }

  const generateDataURL = (
    renderTarget: THREE.WebGLRenderTarget,
    label: string,
  ): {
    dataURL: string;
    label: string;
    width: number;
    height: number;
    type: string;
    min: number;
    max: number;
  } => {
    const width = renderTarget.width;
    const height = renderTarget.height;
    const type = renderTarget.texture.type;

    let pixelBuffer: Uint16Array | Float32Array;

    if (type === THREE.FloatType) {
      pixelBuffer = new Float32Array(width * height * 4);
    } else if (type === THREE.HalfFloatType) {
      if (!supportsHalfFloat) {
        throw new Error("Half-float textures not supported on this device.");
      }
      pixelBuffer = new Uint16Array(width * height * 4);
    } else {
      throw new Error(`Unsupported texture type: ${type}`);
    }

    renderer.setRenderTarget(renderTarget);
    renderer.readRenderTargetPixels(
      renderTarget,
      0,
      0,
      width,
      height,
      pixelBuffer,
    );
    renderer.setRenderTarget(null);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(width, height);

    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < pixelBuffer.length; i += 4) {
      const value = pixelBuffer[i]; // red channel
      if (value < min) min = value;
      if (value > max) max = value;
    }

    const range = max - min || 1;

    for (let i = 0; i < pixelBuffer.length; i += 4) {
      const value = pixelBuffer[i];
      const normalized = ((value - min) / range) * 255;
      const byteVal = Math.max(0, Math.min(255, normalized));

      imageData.data[i] = byteVal; // R
      imageData.data[i + 1] = byteVal; // G
      imageData.data[i + 2] = byteVal; // B
      imageData.data[i + 3] = 255; // A
    }

    ctx.putImageData(imageData, 0, 0);
    const dataURL = canvas.toDataURL("image/png");

    return {
      dataURL,
      label: `${label}`,
      width,
      height,
      type: type === THREE.FloatType ? "FloatType" : "HalfFloatType",
      min,
      max,
    };
  };

  let images: {
    dataURL: string;
    label: string;
    width: number;
    height: number;
    type: string;
    min: number;
    max: number;
  }[] = [];

  try {
    images = renderTargets.map(({ label, value }) =>
      generateDataURL(value, label),
    );
  } catch (e) {
    alert((e as Error).message);
    return;
  }

  const newTab = window.open();
  if (!newTab) {
    alert("Popup blocked. Please allow popups to view the render targets.");
    return;
  }

  const htmlContent = images
    .map(
      ({ dataURL, label, width, height, type, min, max }, i) => `
        <div style="margin-bottom: 2rem; text-align: center;">
          <h2 style="color: white; font-family: sans-serif;">${label}</h2>
          <div style="display: flex; flex-direction: row; justify-content: center;">
            <img src="${dataURL}" style="max-width: 800px; box-shadow: 0 0 20px rgba(0,0,0,0.5);" />
          
            <div style="display: flex; flex-direction: column; justify-content: center; margin-left: 2rem; vertical-align: top;">
              <div style="text-align: left; margin-top: 0.5rem; font-family: monospace; color: #ccc;">
                <p>Resolution: ${width} × ${height}</p>
                <p>Pixel Format: ${type}</p>
                <p>Value Range (Red channel): min = ${min.toFixed(4)}, max = ${max.toFixed(4)}</p>
                <a href="${dataURL}" download="renderTarget-${i + 1}-${Date.now()}.png"
                    style="margin-top:12px;display:inline-block;padding:8px 16px;background:#333;
                    border-radius:4px;color:white;text-decoration:none;">
                  Download PNG
                </a>
              </div>
            </div>
          </div>
          
        </div>
      `,
    )
    .join("");

  newTab.document.write(`
    <html>
      <head>
        <title>RenderTarget Previews</title>
      </head>
      <body style="margin:0;padding:2rem;background:#111;color:white;overflow-y:auto;">
        ${htmlContent}
      </body>
    </html>
  `);
  newTab.document.close();
}
