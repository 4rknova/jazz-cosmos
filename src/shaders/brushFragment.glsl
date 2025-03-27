varying vec2 vUv;
uniform sampler2D uHeightmap;
uniform vec2 uUV;
uniform float uBrushSize;
uniform float uBrushStrength;

#define BRUSH_QUANTUM 0.01
#define MAX_HEIGHT 0.075

void main() {
    vec4 original = texture2D(uHeightmap, vUv);
    
    float dist = distance(vUv, uUV);
    
    if (dist < uBrushSize) {
        original.r += 0.05 * uBrushStrength * (1.0 - dist / uBrushSize);
    }

    float value = clamp(original.r, 0.0, MAX_HEIGHT);
    
    gl_FragColor = vec4(value, 0.0, 0.0, value - 0.5);
}