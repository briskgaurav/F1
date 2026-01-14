"use client";
import {
  Center,
  Environment,
  Float,
  OrbitControls,
  Sparkles,
  Stars,
  Stats,
} from "@react-three/drei";
import React, { useRef, useMemo } from "react";
import { Model } from "./Model";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAspectRatioDimensions } from "@/hooks/useAspectRatioDimensions";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { degToRad } from "three/src/math/MathUtils";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

const ASPECT_RATIO = 16 / 9;

// Animated gradient background
function GradientBackground() {
  const meshRef = useRef();

  const gradientShader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color("#050508") },
        uColor2: { value: new THREE.Color("#0a0a12") },
        uColor3: { value: new THREE.Color("#08080f") },
      },
      vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      varying vec2 vUv;
      
      void main() {
        float t = uTime * 0.05;
        vec2 uv = vUv;
        
        // Subtle animated gradient
        float noise = sin(uv.x * 3.0 + t) * cos(uv.y * 2.0 - t * 0.5) * 0.1;
        float gradient = smoothstep(0.0, 1.0, uv.y + noise);
        
        vec3 color = mix(uColor1, uColor2, gradient);
        color = mix(color, uColor3, sin(uv.x * 2.0 + t) * 0.5 + 0.5);
        
        // Add subtle radial gradient from center
        float dist = length(uv - 0.5);
        color *= 1.0 - dist * 0.3;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    }),
    []
  );

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -15]} scale={[40, 25, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        uniforms={gradientShader.uniforms}
        vertexShader={gradientShader.vertexShader}
        fragmentShader={gradientShader.fragmentShader}
      />
    </mesh>
  );
}

// Floating particles ring around model
function ParticleRing() {
  const pointsRef = useRef();

  const particleCount = 100;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 2.5 + Math.random() * 0.5;
      const height = (Math.random() - 0.5) * 1.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#4af0ff"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function Chapter1() {
  const dimensions = useAspectRatioDimensions(ASPECT_RATIO);

  useEffect(() => {
    ScrollTrigger.create({
      trigger: "#chapter1",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      markers: false,
      onUpdate: (self) => {
        const sequencePosition = self.progress * 3;
      },
    });
  }, []);

  return (
    <div className="fixed inset-0 w-full h-screen bg-[#050508] flex items-center justify-center overflow-hidden">
      <Canvas
        gl={{
          preserveDrawingBuffer: false,
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1]}
        camera={{
          near: 0.1,
          far: 100,
          fov: 45,
          position: [0, 0, 5],
        }}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      >
        {/* Background */}
        {/* <GradientBackground /> */}

        <Stars
          radius={50}
          depth={50}
          count={1000}
          factor={2}
          saturation={0}
          fade
          speed={0.5}
        />

        {/* Main model with float animation */}
        {/* <Float
          speed={1.5}
          rotationIntensity={0.1}
          floatIntensity={0.3}
          floatingRange={[-0.05, 0.05]}
        > */}
        <group position={[3, 0, 0]}>
          <Model />
        </group>
        {/* </Float> */}

        {/* Particle effects */}
        <ParticleRing />

        {/* Subtle sparkles */}
        <Sparkles
          count={50}
          scale={5}
          size={1}
          speed={0.3}
          opacity={0.3}
          color="#4af0ff"
        />
        <Stats />

        {/* Post-processing for minimal aesthetic */}
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0}
            luminanceSmoothing={0.9}
            mipmapBlur
          />

          <Vignette
            offset={0.3}
            darkness={0.6}
            blendFunction={BlendFunction.NORMAL}
          />
          <Noise
            premultiply
            blendFunction={BlendFunction.SOFT_LIGHT}
            opacity={0.15}
          />
        </EffectComposer>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
