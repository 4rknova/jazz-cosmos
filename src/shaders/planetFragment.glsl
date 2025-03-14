precision highp float;
varying vec2 vUv;
varying vec3 vNormal;
uniform vec3 uLightPos;
uniform vec3 uEyePos;
uniform float uHeightmapSize;
uniform sampler2D uHeightmap;
uniform float uTime; 

#define MAX_ITER 5
#define TAU 6.28318530718

float displacement(vec2 vUv) {
    return texture2D(uHeightmap, vUv).r;
}

void main() {
    float displacement = displacement(vUv);
    
    vec3 color = vec3(0.04, 0.1, 1.0);

    if (displacement > 0.0) {
     color = vec3(0.5, 0.3, 0.1);
    }
    else
    {
        float time = uTime * .5+23.0;
        // uv should be the 0-1 uv of texture...
        vec2 uv = vUv * 6.0;
    
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
        colour = clamp(colour + vec3(0.0, 0.35, 0.5), 0.0, 1.0);
        color = colour;
    }


    vec3 lightDir = normalize(uLightPos);

    vec3 n = normalize(vNormal);
    color *= dot(lightDir, n);
        
    gl_FragColor = vec4(color, 1.0);
}