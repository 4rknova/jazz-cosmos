varying vec2 vUv;
varying float vDisplacement;
uniform sampler2D uHeightmap;
uniform vec2 uHoverUV;

float displacement(vec2 vUv) {
    return textureLod(uHeightmap, vUv, 1.0).r;
}

void main()
{
    vUv = uv; // Pass through UV coordinates
    float disp = displacement(uHoverUV);
    vDisplacement = disp;
    vec3 pos = position + normal * disp + 0.01;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}