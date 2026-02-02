"use client";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { extend } from "@react-three/fiber";

// Voronoi Electric shader material for models
const ElectricModelMaterial = shaderMaterial(
  {
    uTime: 0,
    uMap: null, // Original texture
    uColor: new THREE.Color(0.0, 1.0, 0.5),
    uIntensity: 1.0,
    uGridScale: 8.0,
    uGridLineScale: 0.1,
    uElectricPower: 10.0,
    uBlendMode: 0.5, // 0 = only electric, 1 = only texture
    uContrast: 19.0,
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader with Voronoi electric effect
  `
    uniform float uTime;
    uniform sampler2D uMap;
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uGridScale;
    uniform float uGridLineScale;
    uniform float uElectricPower;
    uniform float uBlendMode;
    uniform float uContrast;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    
    vec2 rand2(in vec2 p) {
      return fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
    }
    
    float voronoi(in vec2 x, float time) {
      vec2 p = floor(x);
      vec2 f = fract(x);
      float minDistance = 1.0;
      
      for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
          vec2 b = vec2(float(i), float(j));
          vec2 rand = 0.5 + 0.5 * sin(time * 3.0 + 12.0 * rand2(p + b));
          vec2 r = vec2(b) - f + rand;
          minDistance = min(minDistance, length(r));
        }
      }
      return minDistance;
    }
    
    // Contrast adjustment function
    vec3 adjustContrast(vec3 color, float contrast) {
      return (color - 0.5) * contrast + 0.5;
    }
    
    void main() {
      // Sample original texture
      vec4 texColor = texture2D(uMap, vUv);
      
      // Apply contrast to texture
      vec3 contrastedTex = adjustContrast(texColor.rgb, uContrast);
      contrastedTex = clamp(contrastedTex, 0.0, 1.0);
      
      // Calculate Voronoi electric effect with sharper falloff
      vec2 uv = vUv;
      float val = pow(voronoi(uv * uGridScale, uTime) * 1.5, uElectricPower) * 3.0;
      
      // Grid lines with sharper edges
      float gridLineThickness = 0.015;
      vec2 grid = step(mod(uv, uGridLineScale), vec2(gridLineThickness));
      float gridEffect = grid.x + grid.y;
      
      // Electric color with grid - increased brightness
      vec3 electricColor = uColor * val * (1.0 + gridEffect * 0.8);
      electricColor *= uIntensity;
      
      // Sharper fresnel for edge glow
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);
      electricColor += uColor * fresnel * 0.8;
      
      // Blend texture with electric effect
      vec3 finalColor = mix(electricColor, contrastedTex, uBlendMode);
      finalColor += electricColor * (1.0 - uBlendMode);
      
      // Final contrast boost
      finalColor = adjustContrast(finalColor, 1.2);
      finalColor = clamp(finalColor, 0.0, 1.0);
      
      gl_FragColor = vec4(finalColor, texColor.a);
    }
  `
);

extend({ ElectricModelMaterial });

export { ElectricModelMaterial };
export default ElectricModelMaterial;
