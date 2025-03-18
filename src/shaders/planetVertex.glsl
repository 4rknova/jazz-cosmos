precision highp float;
varying vec2 vUv;
varying vec3 vNormal;
varying vec4 vShadowCoord;
uniform float uHeightmapSize;
uniform sampler2D uHeightmap;
uniform mat4 uLightMatrix;

float displacement(vec2 vUv) {
    return texture2D(uHeightmap, vUv).r;
}

// http://lolengine.net/blog/2013/09/21/picking-orthogonal-vector-combing-coconuts
vec3 orthogonal(vec3 v) {
    return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)
    : vec3(0.0, -v.z, v.y));
}

vec3 distorted(vec3 p) {
    return p + normal * displacement(uv);
}

void main() {
    vUv = uv;
    vec3 pos = distorted(position); 
    vShadowCoord = uLightMatrix * vec4(position, 1.0);vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}