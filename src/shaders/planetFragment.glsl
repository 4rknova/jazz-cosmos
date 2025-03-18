precision highp float;
varying vec2 vUv;
varying vec3 vNormal;
varying vec4 vShadowCoord;
uniform vec3 uLightPos;
uniform vec3 uEyePos;
uniform float uHeightmapSize;
uniform sampler2D uHeightmap;
uniform float uTime; 
uniform float uAmbientLight;
uniform sampler2D uShadowMap;

// Constants for terrain configuration
const float WATER_THRESHOLD = 0.001;   // Water level
const float SAND_THRESHOLD = 0.0025;   // Very thin strip for shoreline
const float VALLEY_THRESHOLD = 0.01;   // Green valleys
const float LAND_THRESHOLD = 0.02;     // Rocky land
const float MOUNTAIN_THRESHOLD = 0.08; // Snowy mountains

// Terrain Colors
const vec3 WATER_COLOR = vec3(0.34, 0.4, 0.9);   // Deep Blue
const vec3 SAND_COLOR = vec3(0.9, 0.8, 0.6);     // Light Yellowish Sand
const vec3 VALLEY_COLOR = vec3(0.2, 0.8, 0.2);   // Lush Green
const vec3 LAND_COLOR = vec3(0.5, 0.4, 0.2);     // Brownish Rocky Land
const vec3 MOUNTAIN_COLOR = vec3(0.8, 0.8, 0.8); // Snowy Mountains


// Simple shadow calculation function
float getShadowFactor(vec4 shadowCoord) {
    vec3 projCoords = shadowCoord.xyz / shadowCoord.w;
    projCoords = projCoords * 0.5 + 0.5; // Transform from NDC [-1,1] to [0,1]

    // Get depth from shadow map
    float closestDepth = texture2D(uShadowMap, projCoords.xy).r;
    float currentDepth = projCoords.z;

    // Apply simple shadow bias
    float bias = 0.005;
    float shadow = currentDepth - bias > closestDepth ? 0.5 : 1.0;

    return shadow;
}


// Get displacement from heightmap
float displacement(vec2 vUv) {
    return texture2D(uHeightmap, vUv).r;
}

// Simple hash function for randomness
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Simple hash function for randomness
float hash(in vec3 p)
{
    return fract(sin(dot(p,vec3(127.1,311.7, 321.4)))*43758.5453123);
}

// Simple 3D noise function (value noise)
float noise(in vec3 p)
{
    vec3 i = floor(p);
    vec3 f = fract(p); 
    f *= f * (3.0 - 2.0 * f);
    
    vec2 c = vec2(0.0, 1.0);
    return mix(
        mix(mix(hash(i + c.xxx), hash(i + c.yxx), f.x),
            mix(hash(i + c.xyx), hash(i + c.yyx), f.x),
            f.y),
        mix(mix(hash(i + c.xxy), hash(i + c.yxy), f.x),
            mix(hash(i + c.xyy), hash(i + c.yyy), f.x),
            f.y),
        f.z);
}

// Fractional Brownian Motion to generate more complex noise patterns
float fbm(in vec3 p)
{
    float f = 0.0;
    f += 0.50000 * noise(1.0 * p);
    f += 0.25000 * noise(2.0 * p);
    f += 0.12500 * noise(4.0 * p);
    f += 0.06250 * noise(8.0 * p);
    return f;
}

// Improved procedural vegetation texture
vec3 generateVegetationTexture(vec2 uv, float disp)
{
    // Base noise for vegetation density variation
    float vegetationNoise = fbm(vec3(uv * 700.0, 2.0)); // General pattern
    float fineDetail = fbm(vec3(uv * 2000.0, 3.5)); // Small fine details

    // Control vegetation thickness with smooth transitions
    float vegetationDensity = smoothstep(0.2, 0.8, vegetationNoise + fineDetail * 0.2);

    // Base grass and forest colors
    vec3 brightGrass = vec3(0.2, 0.9, 0.2);  // Lush green grass
    vec3 deepForest = vec3(0.1, 0.7, 0.1);   // Darker forest regions

    // Blend between grassland and dense forest patches
    vec3 vegetationColor = mix(brightGrass, deepForest, vegetationDensity);

    // Introduce slight yellowish patches for dry grass effects
    vec3 dryGrass = vec3(0.6, 0.7, 0.2);
    vegetationColor = mix(vegetationColor, dryGrass, fineDetail * 0.1);

    // Final vegetation texture with variation
    return vegetationColor;
}

// Procedural vegetation color generation based on noise
vec3 generateVegetationColor2(vec2 uv, float disp)
{
    // Use FBM to generate random patchy vegetation
    float vegetationNoise = fbm(vec3(uv * 1000.0, 1.0));
    vec3 baseVegetationColor = VALLEY_COLOR; // Bright green
    return mix(baseVegetationColor, vec3(0.1, 0.6, 0.2), vegetationNoise); // Add variation in color
}


// Improved procedural mountain texture (rocky or snowy)
vec3 generateGroundTexture(vec2 uv, float disp)
{
    // High-frequency noise for detailed rocky effect
    float rockNoise = fbm(vec3(uv * 1000.0, 2.5)); // Sharper detail for rocks
    float snowNoise = fbm(vec3(uv * 500.0, 1.0));  // Softer detail for snow accumulation

    // Base rocky texture - higher noise contrast for rugged look
    vec3 rockTexture = mix(vec3(0.4, 0.35, 0.3), vec3(0.6, 0.6, 0.6), rockNoise);
    
    // Control snow accumulation based on height and noise
    float snowBlend = smoothstep(0.5, 0.7, disp + snowNoise * 0.2);

    // Final blend: Rocks → Snow
    return mix(rockTexture, vec3(1.0, 1.0, 1.0), snowBlend); // Snow is pure white
}

// Generate procedural mountain texture (rocky or snowy texture)
vec3 generateMountainTexture2(vec2 uv, float disp)
{
    // Scale the UV coordinates for higher texture detail on mountains
    float noiseValue = fbm(vec3(uv * 500.0, 2.0)); // FBM noise
    float textureValue = smoothstep(0.3, 0.9, noiseValue); // Control the texture roughness

    // Add variation based on displacement for rocky or snowy effects
    vec3 baseMountainTexture = mix(MOUNTAIN_COLOR,vec3(1.0, 1.0, 1.0), textureValue); // Lighter texture for snow

    // Create a more rough, rocky texture for mountain areas
    return mix(baseMountainTexture, vec3(0.65, 0.61, 0.6), disp); // Adjust the mix based on displacement
}

// Terrain color blending function
vec3 terrainColor(float disp, vec2 uv) {
    vec3 color;

    if (disp < WATER_THRESHOLD) {
        return WATER_COLOR;  // Water
    }
    
    if (disp >= WATER_THRESHOLD && disp < SAND_THRESHOLD) {
        color = mix(WATER_COLOR, SAND_COLOR, smoothstep(WATER_THRESHOLD, SAND_THRESHOLD, disp));
    }
    else if (disp >= SAND_THRESHOLD && disp < VALLEY_THRESHOLD + 0.01 * fbm(vec3(uv * 400.0, 1.0))) {
        color = mix(SAND_COLOR, VALLEY_COLOR, smoothstep(SAND_THRESHOLD, VALLEY_THRESHOLD, disp));
    }
    else if (disp >= VALLEY_THRESHOLD && disp < LAND_THRESHOLD + 0.02 * fbm(vec3(uv * 300.0, 1.0))) {
        color = generateVegetationTexture(uv, disp);
    }
    else if (disp >= LAND_THRESHOLD && disp < MOUNTAIN_THRESHOLD - 0.04 * fbm(vec3(uv * 1000.0, 1.0))) {
		vec3 groundTexture = generateGroundTexture(uv,disp);
        color = mix(groundTexture, MOUNTAIN_COLOR, smoothstep(LAND_THRESHOLD, MOUNTAIN_THRESHOLD, disp));
    }
    else {
        color = generateMountainTexture2(uv, disp);
    }

    return color;

}

void main() {
    float disp = displacement(vUv);
    vec3 color = terrainColor(disp, vUv);

	// Calculate shadow factor
    float shadowFactor = getShadowFactor(vShadowCoord);

    // Basic lighting (Lambertian shading)
    vec3 lightDir = normalize(-uLightPos);
    vec3 n = normalize(vNormal);
    color *= max(dot(lightDir, n), uAmbientLight); // Prevents excessive darkness
    
    gl_FragColor = vec4(color * shadowFactor, 1.0);

	//gl_FragColor = vec4(vec3(1.0, 1.0,1.0) * shadowFactor, 1.0);
}
