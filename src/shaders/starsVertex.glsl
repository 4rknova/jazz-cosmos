attribute float intensity;
uniform float size;
varying vec3 vColor;
varying float vIntensity;

void main() {
    vIntensity = intensity; 
    vColor = vec3(1.0, 1.0, 1.0); // White star
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z); // Scale stars based on depth
    gl_Position = projectionMatrix * mvPosition;
}