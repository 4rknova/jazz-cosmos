precision highp float;
varying vec2 vUv;
varying vec3 vNormal;
uniform vec3 uLightPos;
uniform sampler2D uHeightmap;   

void main() {
    gl_FragColor = vec4(1.0-texture2D(uHeightmap, vUv).rrr, 1.0);
}