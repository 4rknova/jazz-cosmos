precision highp float;
varying vec2 vUv;
varying vec3 vNormal;
uniform float uHeightmapSize;
uniform sampler2D uHeightmap;

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
    float tangentFactor = 1.0 / uHeightmapSize * 2.0;

    vUv = uv;
    vec3 pos = distorted(position); 

    vec3 n = normal;
    vec3 distortedPosition = pos;
    vec3 tangent1 = orthogonal(n);
    vec3 tangent2 = normalize(cross(n, tangent1));
    vec3 nearby1 = position + tangent1 * tangentFactor;
    vec3 nearby2 = position + tangent2 * tangentFactor;
    vec3 distorted1 = distorted(nearby1);
    vec3 distorted2 = distorted(nearby2);
    vNormal = normalize(cross(distorted1 - distortedPosition, distorted2 - distortedPosition));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}