varying vec2 vUv;
uniform sampler2D uHeightmap;
uniform vec2 uUV;
uniform float uBrushSize;
uniform float uBrushStrength;

void main() {
    vec4 original = texture2D(uHeightmap, vUv);
    
    float distA = distance(vUv, uUV);
    float distB = distance(vUv, vec2(1.0-uUV.x, uUV.y));

    if (distA < uBrushSize) {
        original.r += 0.05 * uBrushStrength * (1.0 - distA / uBrushSize);
    }


    if (distB < uBrushSize) {
        original.r += 0.05 * uBrushStrength * (1.0 - distB / uBrushSize);
    }

    original.r = clamp(original.r, 0.0, 0.25);
    original.gba = vec3(0.0,0.0,0.0);

    gl_FragColor = original;
}