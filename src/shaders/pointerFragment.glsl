varying vec2 vUv;
varying vec3 vNormal;
uniform vec3 uPlayerColor;

float utilMod(float a, float b) {
    return a - b * floor(a / b);
}

void main()
{
    vec2 uv = vUv * 2.0 - 1.0; // Normalize UV to range [-1,1]
    float dist = length(uv);  // Compute distance from center
    dist *= dist;

    // Animate the ring size using a sine function
    float scale = 0.25; // Scale oscillates between 0.5 and 1.0
    float ringSize = 0.1; // Thickness of the ring

    // Create the ring effect
    float ring = smoothstep(scale - ringSize, scale, dist) - smoothstep(scale, scale + ringSize, dist);

    gl_FragColor = vec4(ring * uPlayerColor, ring * 0.5);
}