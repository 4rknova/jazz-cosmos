varying vec2 vUv;
varying float vFlap;

// Utility function: smooth line segment between two points
float line(vec2 a, vec2 b, vec2 p, float t) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return smoothstep(t, 0.0, length(pa - ba * h));
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0; // [-1, 1] coordinate space

  float thickness = 0.1;
 float flap = vFlap * 0.2;

// Reduce flap angles
float shoulderAngle = radians(30.0) + flap * 0.4;
float elbowAngle = radians(-30.0) - flap * 0.7;

float shoulderLength = 0.3;
float elbowLength = 0.2;

vec2 leftShoulder = vec2(-cos(shoulderAngle), sin(shoulderAngle)) * shoulderLength;
vec2 leftElbow = leftShoulder + vec2(-cos(elbowAngle), sin(elbowAngle)) * elbowLength;

vec2 rightShoulder = vec2(cos(shoulderAngle), sin(shoulderAngle)) * shoulderLength;
vec2 rightElbow = rightShoulder + vec2(cos(elbowAngle), sin(elbowAngle)) * elbowLength;

  // Combine both wing segments
  float leftWing = line(vec2(0.0), leftShoulder, uv, thickness) +
                   line(leftShoulder, leftElbow, uv, thickness);

  float rightWing = line(vec2(0.0), rightShoulder, uv, thickness) +
                    line(rightShoulder, rightElbow, uv, thickness);

  // Layered feather tips
  float feather1L = line(leftElbow, leftElbow + vec2(-cos(elbowAngle), sin(elbowAngle)) * 0.2, uv, thickness * 0.8);
  float feather2L = line(leftElbow + vec2(-cos(elbowAngle), sin(elbowAngle)) * 0.2,
                    leftElbow + vec2(-cos(elbowAngle), sin(elbowAngle)) * 0.4, uv, thickness * 0.6);

  float feather1R = line(rightElbow, rightElbow + vec2(cos(elbowAngle), sin(elbowAngle)) * 0.2, uv, thickness * 0.8);
  float feather2R = line(rightElbow + vec2(cos(elbowAngle), sin(elbowAngle)) * 0.2,
                    rightElbow + vec2(cos(elbowAngle), sin(elbowAngle)) * 0.4, uv, thickness * 0.6);

  float feathers = feather1L + feather2L + feather1R + feather2R;
  feathers *= 0.8; // blend into main shape

  // Central body circle
  // Distinct body: core + glow
  float bodyCore = smoothstep(0.1, 0.07, length(vec2(1, 0.6) * uv));   // sharp center
  float bodyGlow = smoothstep(0.15, 0.07, length(uv));   // soft fade around core
  float body = max(bodyCore, bodyGlow * 0.6);


  // Compose final bird shape
  float shape = max(body, max(leftWing + rightWing + feathers, 0.0));
  float alpha = shape * smoothstep(1.0, 0.5, length(uv)); // soft edges

  vec3 color = mix(vec3(0.4, 0.4, 0.4), vec3(1.0), shape);
  gl_FragColor = vec4(color, alpha);

  if (alpha < 0.01) discard;
}
