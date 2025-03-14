precision highp float;
varying vec2 vUv;
varying vec3 vNormal;
uniform vec3 uLightPos;
uniform vec3 uEyePos;
uniform float uHeightmapSize;
uniform sampler2D uHeightmap;

float displacement(vec2 vUv) {
    return texture2D(uHeightmap, vUv).r;
}

void main() {
    float displacement = displacement(vUv);
    
    vec3 color = vec3(0.04, 0.1, 1.0);

    if (displacement > 0.0) {
    color = vec3(0.5, 0.3, 0.1);
    }

    vec3 lightDir = normalize(uLightPos);

    vec3 n = normalize(vNormal);
    color *= dot(lightDir, n);
        
    gl_FragColor = vec4(color, 1.0);
}