import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

// Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment Shader
const fragmentShader = `
  varying vec2 vUv;
  uniform sampler2D uPrev;
  uniform sampler2D uNext;
  uniform float uProgress;
  uniform float uStrength;
  uniform float uTime;
  
  // Noise function for icy distortion
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  // Chromatic aberration for icy color shifts
  vec4 chromaticAberration(sampler2D tex, vec2 uv, float amount) {
    float r = texture2D(tex, uv + vec2(amount, 0.0)).r;
    float g = texture2D(tex, uv).g;
    float b = texture2D(tex, uv - vec2(amount, 0.0)).b;
    float a = texture2D(tex, uv).a;
    return vec4(r, g, b, a);
  }
  
  void main() {
    vec2 uv = vUv;
    float p = uProgress;
    
    // Icy distortion based on noise
    float iceNoise = fbm(uv * 8.0 + uTime * 0.1);
    float iceDistort = (iceNoise - 0.5) * 0.015 * p * (1.0 - p) * 4.0;
    
    // Vertical stretch with ice-like warping
    vec2 distortedUV = uv;
    distortedUV.x += iceDistort;
    distortedUV.y += iceDistort * 0.5;
    
    // Motion blur samples
    vec4 col1 = vec4(0.0);
    vec4 col2 = vec4(0.0);
    float samples = 8.0;
    float blur = p * (1.0 - p) * uStrength * 0.3;
    
    // Chromatic aberration amount based on progress
    float chromaAmount = p * (1.0 - p) * 0.008;
    
    for(float i = 0.0; i < 8.0; i++) {
      float t = i / samples;
      float offset = (t - 0.5) * blur;
      
      // Add horizontal motion blur component
      float hOffset = (t - 0.5) * blur * 0.15;
      
      vec2 uv1 = distortedUV + vec2(hOffset, offset - p * 0.15);
      vec2 uv2 = distortedUV + vec2(hOffset, offset - (1.0 - p) * 0.15);
      
      // Sample with chromatic aberration for icy color shifts
      col1 += chromaticAberration(uPrev, uv1, chromaAmount * (1.0 + t));
      col2 += chromaticAberration(uNext, uv2, chromaAmount * (1.0 + t));
    }
    
    col1 /= samples;
    col2 /= samples;
    
    // Add icy blue tint during transition
    vec3 icyTint = vec3(0.85, 0.95, 1.0);
    float tintStrength = p * (1.0 - p) * 1.5;
    col1.rgb = mix(col1.rgb, col1.rgb * icyTint, tintStrength);
    col2.rgb = mix(col2.rgb, col2.rgb * icyTint, tintStrength);
    
    // Add subtle icy highlights
    float highlight = pow(iceNoise, 3.0) * p * (1.0 - p) * 0.3;
    col1.rgb += vec3(0.7, 0.85, 1.0) * highlight;
    col2.rgb += vec3(0.7, 0.85, 1.0) * highlight;
    
    // Opposite curve (concave/inverted) and tilted wipe effect
    float curveAmount = 0.2; // Curve intensity
    float tiltAmount = 0.1; // Tilt angle
    
    // Inverted curve using cosine (creates concave/opposite curve)
    float curve = cos(uv.x * 3.14159) * curveAmount; // Opposite curve direction
    
    // Add diagonal tilt based on x position
    float tilt = (uv.x - 0.5) * tiltAmount;
    
    // Add noise to the curved edge for icy effect
    float wipeNoise = fbm(vec2(uv.x * 20.0, uTime * 0.5)) * 0.05;
    
    // Apply curved and tilted wipe
    float wipePosition = p * 1.4 - 0.2 + curve + tilt + wipeNoise;
    float wipe = smoothstep(wipePosition - 0.25, wipePosition + 0.25, uv.y);
    
    // Add frosted edge glow following the curve
    float edgeGlow = exp(-abs(uv.y - wipePosition) * 2.0) * p * (1.0 - p) * 2.0;
    vec3 glowColor = vec3(0.8, 0.9, 1.0);
    
    vec4 finalColor = mix(col2, col1, wipe);
    finalColor.rgb += glowColor * edgeGlow;
    
    // Add subtle color banding for icy effect
    float banding = sin(uv.y * 100.0 + uTime) * 0.01 * p * (1.0 - p);
    finalColor.rgb += vec3(banding * 0.5, banding * 0.7, banding);
    
    gl_FragColor = finalColor;
  }
`

// Create shader material
export const TransitionShaderMaterial = shaderMaterial(
  {
    uPrev: null,
    uNext: null,
    uProgress: 0,
    uStrength: 0.35,
    uTime: 0,
  },
  vertexShader,
  fragmentShader
)

// Extend Three.js with the custom shader material
extend({ TransitionShaderMaterial })
