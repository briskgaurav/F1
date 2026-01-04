"use client";
import {
  Center,
  Environment,
  MeshReflectorMaterial,
  OrbitControls,
} from "@react-three/drei";
import React from "react";
import { Model } from "./Model";
import { Canvas } from "@react-three/fiber";

export default function Experience() {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-white">
      <Canvas>
        <Environment preset="warehouse" environmentIntensity={1} />
        <Center>
          <Model />
          <mesh rotation-x={-Math.PI / 2}> 
            <planeGeometry args={[15, 10]} />
            <MeshReflectorMaterial
              color="#ffffff"
              mirror={0.8}
              metalness={0.1}
              roughness={0.1}
              blur={[300, 100]}
              mixBlur={.2}
              mixStrength={1}
              mixContrast={1}
              resolution={1024}
              distortion={0.1}
              distortionMap={null}
            />
          </mesh>
        </Center>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
