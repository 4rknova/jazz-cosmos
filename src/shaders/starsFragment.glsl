varying vec3 vColor;
varying float vIntensity;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord) * 2.0; // Normalize distance

    // Create a star shape with radial spikes
    float angle = atan(coord.y, coord.x);
    float rays = .0;  // Number of spikes
    float sharpness = 0.4; // Controls how sharp the spikes are

    float alpha = smoothstep(1.0, 0.4, dist/vIntensity) * vIntensity; // Apply intensity


    gl_FragColor = vec4(vColor * vIntensity, alpha); 
}