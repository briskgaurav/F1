"use client";
import {
  Center,
  ContactShadows,
  Environment,
  OrbitControls,
  Stage,
} from "@react-three/drei";
import React from "react";
import { Model } from "./Model";
import { Canvas } from "@react-three/fiber";
import { getProject } from "@theatre/core";
import { SheetProvider, PerspectiveCamera } from "@theatre/r3f";
import studio from "@theatre/studio";
import extension from "@theatre/r3f/dist/extension";
import theatrejson from "@/Theatre/chap1.json";
import { useAspectRatioDimensions } from "@/hooks/useAspectRatioDimensions";
import { editable as e } from "@theatre/r3f";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/dist/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Initialize Theatre.js studio in development
// if (typeof window !== "undefined") {
//   studio.initialize();
//   studio.extend(extension);
// }

// Create a Theatre.js project and sheet
const project = getProject("Chapter1", {state: theatrejson});
const sheet = project.sheet("F1Experience");

const ASPECT_RATIO = 16 / 9;

export default function Chapter1() {
  const dimensions = useAspectRatioDimensions(ASPECT_RATIO);
  const containerRef = useRef(null);

  useEffect(() => {
    project.ready.then(() => {

      ScrollTrigger.create({
        trigger: "#chapter1",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        markers:false,
        onUpdate: (self) => {
          const sequencePosition = self.progress * 3;
          sheet.sequence.position = sequencePosition;
        },
      });
    });

   
  }, []);

  return (
    <div className="fixed inset-0 w-full h-screen bg-background flex items-center justify-center">
      <Canvas
        // style={{ width: dimensions.width, height: dimensions.height }}
        gl={{ preserveDrawingBuffer: true }}
        camera={{ near: 0.1, far: 1000, fov: 50, position: [0, 1.5, 5] }}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      >
        <SheetProvider sheet={sheet}>
          {/* <Stage adjustCamera={false} environment="studio" environmentIntensity={0.5} /> */}
          <Environment preset="studio" environmentIntensity={0.5} />
          {/* <ContactShadows
            position-y={-0.99}
            opacity={0.5}
            scale={20}
            blur={2}
          /> */}

          <Center>
            <e.group theatreKey="Chapter1Model">
              <Model />
            </e.group>
          </Center>

          <mesh position-y={-0.99} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[10, 100]} />
            <meshStandardMaterial color="red" />
          </mesh>

          {/* <OrbitControls /> */}
        </SheetProvider>
      </Canvas>
    </div>
  );
}
