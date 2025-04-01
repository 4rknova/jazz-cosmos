varying vec2 vUv;
uniform float uTime;
uniform vec3 uPlayerColor;

float utilMod(float a, float b) {
    return a - b * floor(a / b);
}

void main()
{
    vec2 uv = vUv * 2.0 - 1.0; // Normalize UV to [-1,1]
    float dist = length(uv);  // Distance from center

    // Simulate spherical depth
    float depthDist = dist * dist * dist;

    // Ring animation and thickness
    float scale = 0.25;
    float ringSize = 0.1; // Smaller for sharpness

    // Sharper ring edge using narrower smoothstep
    float inner = smoothstep(scale - ringSize, scale - ringSize * 0.5, depthDist);
    float outer = smoothstep(scale + ringSize * 0.5, scale + ringSize, depthDist);
    float ring = inner - outer;

    // Fake surface normal from UV
    vec3 normal = normalize(vec3(uv, sqrt(1.0 - clamp(dist * dist, 0.0, 1.0))));

    // Lighting
    vec3 lightDir = normalize(vec3(0.4, 0.6, 1.0));
    float diffuse = max(dot(normal, lightDir), 0.0);

    // Specular highlight
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 64.0); // Sharper specular

    // Final color with lighting
    vec3 color = uPlayerColor * diffuse + spec * vec3(1.0);

    // Apply alpha for transparency
    gl_FragColor = vec4(color * ring, ring);
}
