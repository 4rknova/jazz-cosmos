uniform float uTime;
attribute float flapOffset;

varying vec2 vUv;
varying float vFlap;

// Simple hash function for randomness
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Simple hash function for randomness
float hash(in vec3 p)
{
    return fract(sin(dot(p,vec3(127.1,311.7, 321.4)))*43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractional Brownian Motion to generate more complex noise patterns
float fbm(in vec2 p)
{
    float f = 0.0;
    f += 0.50000 * noise(1.0 * p);
    f += 0.25000 * noise(2.0 * p);
    f += 0.12500 * noise(4.0 * p);
    f += 0.06250 * noise(8.0 * p);
    return f;
}


void main() {
  vUv = uv;

  // Smooth flapping motion with eased amplitude
  float flap = sin(uTime * 1. * fbm(position.xy + vec2(uTime, uTime*2.0)) + flapOffset);
  vFlap = flap * flap * flap * 2.0; // smoothed + boosted

  vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
}
