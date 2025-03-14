varying vec2 vUv;
uniform sampler2D uHeightmap;
uniform vec2 uUV;
uniform float uBrushSize;
uniform float uBrushStrength;

void main() {
    vec4 original = texture2D(uHeightmap, vUv);
    float dist = distance(vUv, uUV);

    if (dist < uBrushSize) {
        original.r += 0.05 * uBrushStrength * (1.0 - dist / uBrushSize);
    }

    original.r = clamp(original.r, 0.0, 0.25);
    original.gba = vec3(0.0,0.0,0.0);

    gl_FragColor = original;
}