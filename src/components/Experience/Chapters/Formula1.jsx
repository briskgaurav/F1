"use client";
import { Center } from "@react-three/drei";
import React, { useRef, useEffect } from "react";
import { F1Model } from "../F1Model";
import { degToRad } from "three/src/math/MathUtils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Formula1({ MainModelRef }) {
  const modelGroupRef = useRef(null);

  useEffect(() => {
    if (!modelGroupRef.current) return;

    // Use rotation values from Model.jsx
    const ctx = gsap.context(() => {
      gsap.to(modelGroupRef.current.rotation, {
        x: degToRad(-70),
        y: degToRad(0),
        z: degToRad(180),
        scrollTrigger: {
          trigger: 'body',
          start: "top top",
          end: "15% bottom",
          markers: false,
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <color attach="background" args={['#000000']} />
      <Center>
        <group
          ref={(node) => {
            modelGroupRef.current = node;
            // Also set the MainModelRef if provided (for external access)
            if (MainModelRef) {
              MainModelRef.current = node;
            }
          }}
          position={[0, 0, 0]}
          scale={0.6}
          rotation={[-degToRad(50), -degToRad(20), degToRad(20)]}
        >
          <F1Model MainModelRef={modelGroupRef} />
        </group>
      </Center>


    </>
  );
}
