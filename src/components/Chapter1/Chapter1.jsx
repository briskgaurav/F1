"use client";
import {
  Center,
  Environment,
  OrbitControls,
  Stats,
  Text,
} from "@react-three/drei";
import React, { Suspense, useRef } from "react";
import { Model } from "./Model";
import { Canvas } from "@react-three/fiber";
import { useAspectRatioDimensions } from "@/hooks/useAspectRatioDimensions";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { degToRad } from "three/src/math/MathUtils";
import {
  EffectComposer,
  Glitch,
  SMAA,
  ToneMapping,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import LightTrail from "../LightTrail/LightTrail";

gsap.registerPlugin(ScrollTrigger);

const ASPECT_RATIO = 16 / 9;

export default function Chapter1() {
  const dimensions = useAspectRatioDimensions(ASPECT_RATIO);
  const MainModelRef = useRef(null);


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
   
      <LightTrail />

      <Canvas
        flat
        gl={{
          preserveDrawingBuffer: false,
          antialias: true,
          alpha: true, // Enable alpha so we can see the LightTrail behind
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
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Main scene content */}

        <Center>
          <group
           ref={MainModelRef}
            position={[0, 0, 0]}
            scale={0.6}
            rotation={[-degToRad(50), -degToRad(20), degToRad(20)]}
            // rotation={[-degToRad(70), -degToRad(0), degToRad(180)]}
          >
            <Model MainModelRef={MainModelRef} />
          </group>
        </Center>

        <Environment preset="sunset" />

        {/* <Stats /> */}

        <Suspense fallback={null}>
          <EffectComposer multisampling={0}>
            <Glitch
              delay={[1.5, 3.5]}
              duration={[0.6, 1.0]}
              strength={[0.3, 1.0]}
              active
              ratio={1}
            />
            <SMAA />
            <ToneMapping
              blendFunction={BlendFunction.COLOR_BURN}
              adaptive={true}
              resolution={256}
              middleGrey={1}
              maxLuminance={26.0}
              averageLuminance={2}
              adaptationRate={2}
            />
          </EffectComposer>
        </Suspense>

        {/* <OrbitControls enableZoom={false} enablePan={false} /> */}
      </Canvas>
    </div>
  );
}
