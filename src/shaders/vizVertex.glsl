precision highp float;
varying vec2 vUv;
varying vec3 vNormal;
uniform sampler2D uHeightmap;

float displacement(vec2 vUv) {
    return texture2D(uHeightmap, vUv).r;
}

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}