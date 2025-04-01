import * as THREE from "three";

/**
 * Opens one or more WebGLRenderTargets in a new tab for visual debugging.
 * Normalizes float RGBA data into grayscale PNGs for inspection and download.
 */
export function openRenderTargetsInNewTab(
  renderer: THREE.WebGLRenderer,
  renderTargets: THREE.WebGLRenderTarget[],
): void {
  const supportsFloat =
    renderer.capabilities.isWebGL2 ||
    renderer.extensions.get("OES_texture_float");
  if (!supportsFloat) {
    alert("Float textures are not supported on this device.");
    return;
  }

  const generateDataURL = (
    renderTarget: THREE.WebGLRenderTarget,
    index: number,
  ): { dataURL: string; label: string } => {
    const size = renderTarget.width;
    const pixelBuffer = new Float32Array(size * size * 4); // RGBA float data

    renderer.setRenderTarget(renderTarget);
    renderer.readRenderTargetPixels(
      renderTarget,
      0,
      0,
      size,
      size,
      pixelBuffer,
    );
    renderer.setRenderTarget(null);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(size, size);

    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < pixelBuffer.length; i += 4) {
      const value = pixelBuffer[i]; // Use red channel only
      if (value < min) min = value;
      if (value > max) max = value;
    }

    const range = max - min || 1;

    for (let i = 0; i < pixelBuffer.length; i += 4) {
      const normalized = ((pixelBuffer[i] - min) / range) * 255;
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
      label: `RenderTarget #${index + 1}`,
    };
  };

  const images = renderTargets.map(generateDataURL);

  const newTab = window.open();
  if (!newTab) {
    alert("Popup blocked. Please allow popups to view the render targets.");
    return;
  }

  const htmlContent = images
    .map(
      ({ dataURL, label }, i) => `
    <div style="margin-bottom: 2rem; text-align: center;">
      <h2 style="color: white; font-family: sans-serif;">${label}</h2>
      <img src="${dataURL}" style="max-width: 100%; max-height: 500px; box-shadow: 0 0 20px rgba(0,0,0,0.5);" />
      <br />
      <a href="${dataURL}" download="renderTarget-${i + 1}-${Date.now()}.png"
         style="margin-top:12px;display:inline-block;padding:8px 16px;background:#333;border-radius:4px;color:white;text-decoration:none;">
        ⬇️ Download PNG
      </a>
    </div>
  `,
    )
    .join("");

  newTab.document.write(`
    <html>
      <head><title>RenderTarget Previews</title></head>
      <body style="margin:0;padding:2rem;background:#111;color:white;overflow-y:auto;">
        ${htmlContent}
      </body>
    </html>
  `);
  newTab.document.close();
}
