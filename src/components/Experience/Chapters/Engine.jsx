"use client";
import React, { useRef, useEffect } from "react";
import { Center, Environment, ContactShadows, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import V6Enigine from "../Models/V6Enigine";

gsap.registerPlugin(ScrollTrigger);

export default function Engine() {
  const pivotRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    if (!pivotRef.current) return;

    const pivot = pivotRef.current;

    // Set initial state - model starts below the view
    gsap.set(pivot.position, { x: 0, y: -3.5, z: 0 });
    gsap.set(pivot.rotation, { x: degToRad(10), y: degToRad(45), z: 0 });

    const ctx = gsap.context(() => {
      // Animate model from bottom to center on trigger enter
      gsap.to(pivot.position, {
        y: 0,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: document.body,
          start: "12% top",
          end: "20% top",
          scrub: 1,
          markers: false,
        },
      });

      // Create timeline for 2 rotation views
      const rotationTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: "20% top",
          end: "35% top",
          scrub: 1,
          markers: false,
        },
      });

      // View 1 - First rotation view (1/2 of timeline)
      rotationTimeline.to(pivot.rotation, {
        x: degToRad(0),
        y: degToRad(135),
        z: degToRad(0),
        ease: "power2.inOut",
        duration: 1,
      });

      // View 2 - Top-down angled view
      rotationTimeline.to(pivot.rotation, {
        x: degToRad(55),
        y: degToRad(270),
        z: degToRad(0),
        ease: "power2.inOut",
        duration: 1,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Main pivot group for all transformations */}
      <group ref={pivotRef}>
        <Center>
          <group ref={modelRef}>
            <V6Enigine
              electricEffect={false}
              electricColor={new THREE.Color(1.0, 1.0, 1.0)} // Red electric
              electricIntensity={.5}
              gridScale={5.0}
              blendMode={.3} // More electric, less texture
            />
          </group>
        </Center>
      </group>

      

      {/* <Environment preset="studio" environmentIntensity={.5} /> */}



    
    </>
  );
}
