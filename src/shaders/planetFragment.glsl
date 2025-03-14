precision highp float;
varying vec2 vUv;
varying vec3 vNormal;
uniform vec3 uLightPos;
uniform vec3 uEyePos;
uniform float uHeightmapSize;
uniform sampler2D uHeightmap;
uniform float uTime; 
uniform float uAmbientLight;

#define MAX_ITER 5
#define TAU 6.28318530718

float displacement(vec2 vUv) {
    return texture2D(uHeightmap, vUv).r;
}

float hash(in vec3 p)
{
    return fract(sin(dot(p,vec3(127.1,311.7, 321.4)))*43758.5453123);
}

float noise(in vec3 p)
{
	//p.z += uTime * .25;
	
    vec3 i = floor(p);
	vec3 f = fract(p); 
	f *= f * (3.-2.*f);

    vec2 c = vec2(0,1);

    return mix(
		mix(mix(hash(i + c.xxx), hash(i + c.yxx),f.x),
			mix(hash(i + c.xyx), hash(i + c.yyx),f.x),
			f.y),
		mix(mix(hash(i + c.xxy), hash(i + c.yxy),f.x),
			mix(hash(i + c.xyy), hash(i + c.yyy),f.x),
			f.y),
		f.z);
}

float fbm(in vec3 p)
{
	float f = 0.;
	f += .50000 * noise(1. * p);
	f += .25000 * noise(2. * p);
	f += .12500 * noise(4. * p);
	f += .06250 * noise(8. * p);
	return f;
}

void main() {
    float displacement = displacement(vUv);
    
    vec3 color = vec3(0.04, 0.1, 1.0);

    if (displacement > 0.0) {
     color = vec3(0.34, 0.4, 0.42) * (displacement + 0.1)  * 5.0;
    }
    else
    {
        float time = uTime * .25;
        // uv should be the 0-1 uv of texture...
        vec2 uv = vUv * 1.0;

        uv.x = fbm(vec3(uv.xy,1.0));
        uv.y = fbm(vec3(1.0, uv.xy));
    
        vec2 p = mod(uv*TAU, TAU)-250.0;
	    vec2 i = vec2(p);
	    float c = 1.0;
	    float inten = .005;

	    for (int n = 0; n < MAX_ITER; n++) 
	    {
    		float t = time * (1.0 - (1.5 / float(n+1)));
		    i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
		    c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
	    }
	    c /= float(MAX_ITER);
	    c = 1.17-pow(c, 0.9);
	    vec3 colour = vec3(pow(abs(c), 8.0));
        colour = clamp(colour + vec3(0.0, 0.25, 0.5), 0.0, 1.0);
        color = colour;
    }


    vec3 lightDir = normalize(-uLightPos);

    vec3 n = normalize(vNormal);
    color *= dot(lightDir, n);
    color += vec3(1,1,1) * uAmbientLight;
        
    gl_FragColor = vec4(color, 1.0);
}