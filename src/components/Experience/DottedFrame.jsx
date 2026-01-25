'use client'
import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const lerp = (start, end, factor) => start + (end - start) * factor

const CONFIG = {
  baseRadius: 0.25,
  scrollBoost: 1.2,
  baseSize: 0.4,
  color: [1.0, 0.0, 0.0],
  gridSpacing: 10.0,
  gridLineWidth: 1.0,
  gridColor: [0.2, 0.2, 0.2],
  gridOpacity: 0.2,
}

const EdgeDotsShader = {
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uScrollSpeed: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uScrollSpeed;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      vec2 pixelCoord = uv * uResolution;
      
      // Grid lines
      float gridSpacing = ${CONFIG.gridSpacing.toFixed(1)};
      float gridLineWidth = ${CONFIG.gridLineWidth.toFixed(1)};
      vec2 gridUvFull = mod(pixelCoord, gridSpacing);
      float gridLine = step(gridUvFull.x, gridLineWidth) + step(gridUvFull.y, gridLineWidth);
      gridLine = clamp(gridLine, 0.0, 1.0);
      
      // Dots - use grid spacing so dots appear at grid intersections/centers
      float spacing = gridSpacing;
      vec2 gridPos = floor(pixelCoord / spacing);
      vec2 gridUv = fract(pixelCoord / spacing);
      vec2 gridCenter = gridUv - 0.5;
      float dist = length(gridCenter);
      
      float radialDist = length(uv - 0.5);
      float effectiveRadius = ${CONFIG.baseRadius.toFixed(1)} + uScrollSpeed * ${CONFIG.scrollBoost.toFixed(1)};
      float radialFade = smoothstep(effectiveRadius, effectiveRadius + 0.4, radialDist);
      
      // Grid is always visible
      vec3 gridColor = vec3(${CONFIG.gridColor.join(', ')});
      float gridOpacity = ${CONFIG.gridOpacity.toFixed(2)} * gridLine;
      
      // Dots only in radial area
      if (radialFade < 0.01) {
        if (gridLine < 0.01) discard;
        gl_FragColor = vec4(gridColor, gridOpacity);
        return;
      }
      
      float phase = hash(gridPos) * 6.28318;
      float waveEffect = sin(radialDist * 10.0 - uTime * 0.5 + phase);
      float flicker = sin(uTime * (0.5 + hash(gridPos * 1.3) * 1.5) + phase) * 0.3 + 0.7;
      
      float size = ${CONFIG.baseSize.toFixed(2)} * radialFade * flicker * (waveEffect * 0.3 + 0.7);
      size = clamp(size, 0.05, 0.4);
      
      float opacity = clamp(radialFade * flicker * (0.4 + waveEffect * 0.3), 0.0, 0.9);
      float dotShape = 1.0 - smoothstep(size - 0.05, size, dist);
      
      vec3 dotColor = vec3(${CONFIG.color.join(', ')});
      float dotOpacity = dotShape * opacity;
      
      // Combine grid and dots
      vec3 finalColor = mix(gridColor, dotColor, dotOpacity);
      float finalOpacity = max(gridOpacity, dotOpacity);
      
      if (finalOpacity < 0.01) discard;
      
      gl_FragColor = vec4(finalColor, finalOpacity);
    }
  `
}

const EdgeDotsMesh = () => {
  const materialRef = useRef()
  const scrollSpeedRef = useRef(0)
  const targetScrollSpeedRef = useRef(0)
  const lastScrollY = useRef(0)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    const handleResize = () => {
      if (materialRef.current) {
        materialRef.current.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const delta = Math.abs(window.scrollY - lastScrollY.current)
      targetScrollSpeedRef.current = Math.min(delta * 0.015, 1)
      lastScrollY.current = window.scrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useFrame((state) => {
    if (!materialRef.current) return

    const deltaTime = state.clock.elapsedTime - lastTimeRef.current
    lastTimeRef.current = state.clock.elapsedTime

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime

    const lerpFactor = 1.0 - Math.pow(0.001, deltaTime)
    scrollSpeedRef.current = lerp(scrollSpeedRef.current, targetScrollSpeedRef.current, lerpFactor * 0.3)
    targetScrollSpeedRef.current = lerp(targetScrollSpeedRef.current, 0, lerpFactor * 0.1)

    materialRef.current.uniforms.uScrollSpeed.value = scrollSpeedRef.current
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        depthTest={false}
        uniforms={EdgeDotsShader.uniforms}
        vertexShader={EdgeDotsShader.vertexShader}
        fragmentShader={EdgeDotsShader.fragmentShader}
      />
    </mesh>
  )
}

export default function Boxy() {
  return (
    <div className="fixed inset-0 pointer-events-none z-5">
      <Canvas flat linear dpr={1} gl={{
        depth: false,
        stencil: false,
        antialias: false,
        powerPreference: 'high-performance'
      }} style={{ pointerEvents: 'none' }}>
        <EdgeDotsMesh />
      </Canvas>
    </div>
  )
}
