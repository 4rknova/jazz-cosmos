varying vec2 vUv;
uniform sampler2D uHeightmap;
uniform vec2 uUV;
uniform float uBrushSize;
uniform float uBrushStrength;

#define BRUSH_QUANTUM 0.01
#define MAX_HEIGHT 0.075

void main() {
    vec4 original = texture2D(uHeightmap, vUv);
    
    float distA = distance(vUv, uUV);
    
    if (distA < uBrushSize) {
        original.r += 0.05 * uBrushStrength * (1.0 - distA / uBrushSize);
    }

    original.r = clamp(original.r, 0.0, MAX_HEIGHT);
    original.gba = vec3(0.0,0.0,0.0);

    gl_FragColor = original;
}