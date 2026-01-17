"use client";
import {
  Center,
  Environment,
  Float,
  OrbitControls,
  Sparkles,
  Stars,
  Stats,
  Text,
  Text3D,
} from "@react-three/drei";
import React, { useRef, useMemo, Suspense } from "react";
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
  Glitch,
  Noise,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, GlitchMode } from "postprocessing";
import * as THREE from "three";
import LightTrail from "../LightTrail/LightTrail";

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
    <div className="fixed inset-0 w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <Canvas
        flat
        gl={{
          preserveDrawingBuffer: false,
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={1}
        camera={{
          near: 0.1,
          far: 100,
          fov: 45,
          position: [0, 0, 5],
        }}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      >
        <Float
          speed={1.5}
          rotationIntensity={0.1}
          floatIntensity={0.3}
          floatingRange={[-0.05, 0.05]}
        >
          <Center>
            <group
              position={[0, 0, 0]}
              scale={0.6}
              rotation={[-degToRad(30), -degToRad(20), degToRad(30)]}
            >
              <Model />
            </group>
          </Center>
        </Float>

        <Text
          // font="/fonts/helvetiker_regular.typeface.json"
          size={0.5}
          height={0.1}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.02}
          letterSpacing={-0.09}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={5}
          position={[0, 0, 0]}
        >
          LIMITLESS
          <meshStandardMaterial color="orangered" />
        </Text>

        <Environment preset="sunset" />

        <Stats />

        <Suspense fallback={null}>
          <EffectComposer multisampling={0}>
            <Glitch
              delay={[1.5, 3.5]} // min and max glitch delay
              duration={[0.6, 1.0]} // min and max glitch duration
              strength={[0.3, 1.0]} // min and max glitch strength
              active // turn on/off the effect (switches between "mode" prop and GlitchMode.DISABLED)
              ratio={1}
            />
            <SMAA />
            <ToneMapping
              blendFunction={BlendFunction.COLOR_BURN} // blend mode
              adaptive={true} // toggle adaptive luminance map usage
              resolution={256} // texture resolution of the luminance map
              middleGrey={1} // middle grey factor
              maxLuminance={26.0} // maximum luminance
              averageLuminance={2} // average luminance
              adaptationRate={2} // luminance adaptation rate
            />
          </EffectComposer>
        </Suspense>

        <LightTrail />

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
