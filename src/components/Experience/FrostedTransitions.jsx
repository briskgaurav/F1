'use client'
import React, { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, createPortal, useThree } from '@react-three/fiber'
import { useFBO, PerspectiveCamera, Stats, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TransitionShaderMaterial } from './shaders/TransitionShader'
import { EffectComposer, Glitch, SMAA, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import Boxy from './DottedFrame'
import LightTrail from '../LightTrail/LightTrail'

gsap.registerPlugin(ScrollTrigger)

function SceneComposition({ scenes, currentSceneIndex }) {
    const material = useRef()
    const { size, viewport } = useThree()

    // Create only 2 FBOs for current and next scene
    const fboA = useFBO(size.width, size.height, { samples: 0, depth: false })
    const fboB = useFBO(size.width, size.height, { samples: 0, depth: false })

    // Create Three.js scenes
    const [scene1] = useState(() => new THREE.Scene())
    const [scene2] = useState(() => new THREE.Scene())
    const [scene3] = useState(() => new THREE.Scene())
    const [scene4] = useState(() => new THREE.Scene())
    const [scene5] = useState(() => new THREE.Scene())
    const threeScenes = [scene1, scene2, scene3, scene4, scene5]

    // Camera refs
    const cam1 = useRef()
    const cam2 = useRef()
    const cam3 = useRef()
    const cam4 = useRef()
    const cam5 = useRef()
    const cameras = [cam1, cam2, cam3, cam4, cam5]

    // Initialize material
    useEffect(() => {
        if (material.current) {
            material.current.uProgress = 0
            material.current.uTime = 0
            material.current.uStrength = 0.7
        }
    }, [])

    useFrame(({ gl, clock }) => {
        if (!scenes || scenes.length === 0) return

        const max = scenes.length - 1
        const index = Math.floor(currentSceneIndex)
        const next = Math.min(index + 1, max)
        const progress = currentSceneIndex - index

        const camA = cameras[index]?.current
        const camB = cameras[next]?.current

        if (!camA || !camB) return

        // Render only current scene
        gl.setRenderTarget(fboA)
        gl.clear()
        gl.render(threeScenes[index], camA)

        // Render only next scene
        gl.setRenderTarget(fboB)
        gl.clear()
        gl.render(threeScenes[next], camB)

        gl.setRenderTarget(null)

        // Update shader with current and next scene
        if (material.current) {
            material.current.uPrev = fboA.texture
            material.current.uNext = fboB.texture
            material.current.uProgress = progress
            material.current.uTime = clock.elapsedTime
        }
    })

    return (
        <>
            {/* Portal for Scene 1 */}
            {scenes[0] && createPortal(
                <>
                    <color attach="background" args={['#000000']} />
                    <PerspectiveCamera ref={cam1} position={[0, 0, 5]} />

                    {scenes[0]}
                </>,
                scene1
            )}

            {/* Portal for Scene 2 */}
            {scenes[1] && createPortal(
                <>
                    <color attach="background" args={['#000000']} />
                    <PerspectiveCamera ref={cam2} position={[0, 0, 5]} />

                    {scenes[1]}
                </>,
                scene2
            )}

            {/* Portal for Scene 3 */}
            {scenes[2] && createPortal(
                <>
                    <color attach="background" args={['#000000']} />
                    <PerspectiveCamera ref={cam3} position={[0, 0, 5]} />
                    {scenes[2]}
                </>,
                scene3
            )}

            {/* Portal for Scene 4 */}
            {scenes[3] && createPortal(
                <>
                    <color attach="background" args={['#000000']} />
                    <PerspectiveCamera ref={cam4} position={[0, 0, 5]} />
                    {scenes[3]}
                </>,
                scene4
            )}

            {/* Portal for Scene 5 */}
            {scenes[4] && createPortal(
                <>
                    <color attach="background" args={['#000000']} />
                    <PerspectiveCamera ref={cam5} position={[0, 0, 5]} />
                    {scenes[4]}
                </>,
                scene5
            )}

            {/* Display shader with transition */}
            <mesh scale={[viewport.width, viewport.height, 1]}>
                <planeGeometry args={[1, 1]} />
                <transitionShaderMaterial ref={material} transparent depthWrite={false} />
            </mesh>
        </>
    )
}

export default function FrostedTransition({
    scenes = [],
    height = '1500vh',
    showStats = false
}) {
    const wrapperRef = useRef(null)
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0)

    useEffect(() => {
        if (!wrapperRef.current) return

        // Transition 1: Scene 0 → Scene 1 (5% to 10%)
        const transition1 = ScrollTrigger.create({
            trigger: wrapperRef.current,
            start: '7% top',
            end: '15% top',
            scrub: true,
            onUpdate: (self) => {
                // Progress 0 to 1 maps to scene index 0 to 1
                setCurrentSceneIndex(self.progress)
            },
            markers: false,
        })
        // https://sketchfab.com/3d-models/supercharged-sbc-v8-engine-revised-582d3f69b0f7460ea0e7d091bdf1f778
        // Transition 2: Scene 1 → Scene 2 (20% to 25%)
        // const transition2 = ScrollTrigger.create({
        //     trigger: wrapperRef.current,
        //     start: '25% top',
        //     end: '32% top',
        //     scrub: true,
        //     onUpdate: (self) => {
        //         setCurrentSceneIndex(1 + self.progress)
        //     },
        //     markers: false,
        // })

        // const transition3 = ScrollTrigger.create({
        //     trigger: wrapperRef.current,
        //     start: '50% top',
        //     end: '55% top',
        //     scrub: true,
        //     onUpdate: (self) => {
        //         setCurrentSceneIndex(2 + self.progress)
        //     },
        //     markers: false,
        // })

        // const transition4 = ScrollTrigger.create({
        //     trigger: wrapperRef.current,
        //     start: '70% top',
        //     end: '75% top',
        //     scrub: true,
        //     onUpdate: (self) => {
        //         setCurrentSceneIndex(3 + self.progress)
        //     },
        //     markers: false,
        // })

        // const transition5 = ScrollTrigger.create({
        //     trigger: wrapperRef.current,
        //     start: '85% top',
        //     end: '90% top',
        //     scrub: true,
        //     onUpdate: (self) => {
        //         setCurrentSceneIndex(4 + self.progress)
        //     },
        //     markers: false,
        // })

    }, [])

    return (
        <div ref={wrapperRef} className="relative w-full" style={{ height }}>
            <div className="sticky top-0 left-0 h-screen w-full">
                <Boxy />
                <LightTrail />
                <Canvas className="w-full h-full" gl={{ antialias: true, autoClear: false }} dpr={[1, 1]}>
                    {showStats && <Stats />}
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
                            {/* <ToneMapping
                                blendFunction={BlendFunction.COLOR_BURN}
                                adaptive={true}
                                resolution={256}
                                middleGrey={1}
                                maxLuminance={26.0}
                                averageLuminance={2}
                                adaptationRate={2}
                            /> */}
                        </EffectComposer>
                    </Suspense>
                    <SceneComposition scenes={scenes} currentSceneIndex={currentSceneIndex} />
                </Canvas>
            </div>
        </div>
    )
}
