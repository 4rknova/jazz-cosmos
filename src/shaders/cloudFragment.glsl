uniform float uTime;
varying vec2 vUv;

// Smooth noise function
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453123);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453123);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453123);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453123);

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal Brownian Motion (FBM)
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 2.0;

    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Ensure smooth wrapping at U = 0 and U = 1
float seamlessFBM(vec2 uv) {
    float left = fbm(uv*100.0);
    float right = fbm(vec2(uv.x - 1.0, uv.y));  // Sample mirrored position
    return mix(left, right, smoothstep(0.0, 1.0, uv.x)); // Blend across seam
}

// Corrects UV distortion for spherical mapping
vec2 sphereUV(vec2 uv) {
    float theta = uv.x * 2.0 * 3.141592653589793;
    float phi = (1.0 - uv.y) * 3.141592653589793;

    vec2 correctedUV;
    correctedUV.x = theta / (2.0 * 3.141592653589793);
    correctedUV.y = 1.0 - (cos(phi) * 0.5 + 0.5);
    return correctedUV;
}

void main() {
    vec2 fixedUV = sphereUV(vUv);

    // Generate seamless cloud texture
    float clouds = seamlessFBM(fixedUV * 3.0 + vec2(uTime * 0.02, uTime * 0.015));

    // Animate cloud movement smoothly
    clouds += 0.05 * sin(uTime * 0.1 + fbm(fixedUV * 6.0));

    // Apply contrast for better cloud definition
    clouds = smoothstep(0.4, 0.7, clouds);

    // Output final cloud color with transparency
    gl_FragColor = vec4(vec3(1.0), clouds);
}
