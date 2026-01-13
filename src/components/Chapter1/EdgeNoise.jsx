"use client"

import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const VignetteShader = {
  uniforms: {
    uColor: { value: new THREE.Color(0x00ff44) },
    uIntensity: { value: 1.0 },
    uSmoothness: { value: 0.4 },
    uTime: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uSmoothness;
    uniform float uTime;
    varying vec2 vUv;
    
    // Simplex noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                       + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                              dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Add noise-based offset to center position
      float noiseScale = 2.0;
      float timeScale = 0.3;
      vec2 centerOffset = vec2(
        snoise(vec2(uTime * timeScale, 0.0)) * 0.05,
        snoise(vec2(0.0, uTime * timeScale + 100.0)) * 0.05
      );
      vec2 center = vec2(0.5, 0.5) + centerOffset;
      
      // Calculate distance from center with noise distortion
      float noise = snoise(uv * noiseScale + uTime * 0.2) * 0.1;
      float dist = distance(uv, center) + noise;
      
      // Create vignette effect with animated smoothness
      float smoothnessNoise = snoise(vec2(uTime * 0.15, uTime * 0.1)) * 0.1;
      float vignette = smoothstep(0.2, 0.5 + uSmoothness + smoothnessNoise, dist);
      
      // Add color variation with noise
      float colorNoise = snoise(uv * 3.0 + uTime * 0.1) * 0.15;
      vec3 noisyColor = uColor * (1.0 + colorNoise);
      
      // Apply dark green color with vignette intensity
      vec3 color = noisyColor * vignette * uIntensity;
      float alpha = vignette * uIntensity;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
}

const VignetteMesh = ({ color, intensity, smoothness }) => {
  const materialRef = useRef()

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor.value = new THREE.Color(color)
      materialRef.current.uniforms.uIntensity.value = intensity
      materialRef.current.uniforms.uSmoothness.value = smoothness
    }
  }, [color, intensity, smoothness])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        depthTest={false}
        uniforms={VignetteShader.uniforms}
        vertexShader={VignetteShader.vertexShader}
        fragmentShader={VignetteShader.fragmentShader}
      />
    </mesh>
  )
}

const EdgeNoise = ({ color = 'darkcyan', intensity = .8, smoothness = 0.4 }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      <Canvas style={{pointerEvents: 'none'}}>
        <VignetteMesh color={color} intensity={intensity} smoothness={smoothness} />
      </Canvas>
    </div>
  )
}

export default EdgeNoise