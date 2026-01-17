"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useControls } from 'leva';
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";


const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform vec2 uPrevMouse;
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uColorMix;
  uniform float uVelocity;
  uniform float uDecay;
  uniform float uDiffusion;
  uniform float uLightningWidth;
  uniform float uLightningIntensity;
  uniform float uDrift;
  uniform float uDistortionStrength;
  uniform float uDistortionRadius;
  varying vec2 vUv;

  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // FBM (Fractional Brownian Motion) noise
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    
    return value;
  }

  void main() {
    vec2 uv = vUv;
    
    // Add drift to UV coordinates using FBM
    vec2 drift = vec2(
      fbm(uv * 2.0 + uTime * 0.3) * uDrift,
      fbm(uv * 2.0 + uTime * 0.3 + 100.0) * uDrift
    );
    
    // Add distortion around mouse using FBM
    float distToMouse = distance(uv, uMouse);
    float distortionFalloff = smoothstep(uDistortionRadius, 0.0, distToMouse);
    vec2 distortion = vec2(
      fbm(uv * 10.0 + uTime * 2.0),
      fbm(uv * 10.0 + uTime * 2.0 + 50.0)
    ) * uDistortionStrength * distortionFalloff * uVelocity;
    
    vec2 driftedUv = uv + drift + distortion;
    
    vec4 current = texture2D(uTexture, driftedUv);
    
    // Stronger decay for sharper edges
    vec4 trail = current * uDecay;
    
    // Calculate mouse velocity and direction
    vec2 mouseDir = uMouse - uPrevMouse;
    float mouseDist = length(mouseDir);
    vec2 mouseNorm = mouseDist > 0.0 ? normalize(mouseDir) : vec2(0.0);
    
    // Distance from current mouse position
    float dist = distance(uv, uMouse);
    
    // Lightning effect along mouse trail using FBM
    float lightning = 0.0;
    if (mouseDist > 0.001) {
      // Project point onto mouse path
      float t = clamp(dot(uv - uPrevMouse, mouseDir) / dot(mouseDir, mouseDir), 0.0, 1.0);
      vec2 projection = uPrevMouse + t * mouseDir;
      float distToPath = distance(uv, projection);
      
      // Add FBM noise for lightning branches
      float noise = fbm(uv * 30.0 + uTime * 3.0);
      float noise2 = fbm(uv * 50.0 - uTime * 4.0);
      
      // Main lightning bolt - sharper edges
      lightning = smoothstep(uLightningWidth * 0.8, 0.0, distToPath + noise * 0.015);
      lightning *= smoothstep(0.0, 0.2, t) * smoothstep(1.0, 0.8, t);
      
      // Add sharp branches
      float branches = smoothstep(uLightningWidth * 1.5, 0.0, distToPath + noise2 * 0.03);
      branches *= step(0.7, abs(noise)) * 0.6;
      lightning += branches;
      
      // Intensity based on velocity - more responsive
      lightning *= smoothstep(0.0, 0.02, mouseDist) * uVelocity * uLightningIntensity;
      
      // Add sharp core
      float core = smoothstep(uLightningWidth * 0.3, 0.0, distToPath);
      lightning += core * uVelocity * uLightningIntensity * 0.5;
    }
    
    // Sharper glow at mouse position
    float glow = smoothstep(0.06, 0.0, dist) * uVelocity * 0.8;
    
    // Faster fluid diffusion with more spread
    vec2 pixelSize = vec2(1.0) / vec2(512.0);
    vec4 neighbor = vec4(0.0);
    float spreadRadius = 1.5 * uDiffusion;
    
    // Sample in a wider pattern for faster spread
    neighbor += texture2D(uTexture, driftedUv + vec2(pixelSize.x * spreadRadius, 0.0)) * 0.15;
    neighbor += texture2D(uTexture, driftedUv - vec2(pixelSize.x * spreadRadius, 0.0)) * 0.15;
    neighbor += texture2D(uTexture, driftedUv + vec2(0.0, pixelSize.y * spreadRadius)) * 0.15;
    neighbor += texture2D(uTexture, driftedUv - vec2(0.0, pixelSize.y * spreadRadius)) * 0.15;
    neighbor += texture2D(uTexture, driftedUv + pixelSize * spreadRadius) * 0.1;
    neighbor += texture2D(uTexture, driftedUv - pixelSize * spreadRadius) * 0.1;
    neighbor += texture2D(uTexture, driftedUv + vec2(pixelSize.x, -pixelSize.y) * spreadRadius) * 0.1;
    neighbor += texture2D(uTexture, driftedUv + vec2(-pixelSize.x, pixelSize.y) * spreadRadius) * 0.1;
    
    trail = max(trail, neighbor * 0.96);
    
    // Color mixing with variation using FBM
    float colorVar = fbm(uv * 3.0 + uTime * 0.5) * 0.3;
    vec3 color = mix(uColor1, uColor2, uColorMix + colorVar);
    
    // Add new lightning and glow with higher intensity
    trail.rgb += (lightning + glow) * color * 5.0;
    
    // Clamp to prevent overflow
    trail.rgb = clamp(trail.rgb, 0.0, 3.0);
    
    gl_FragColor = vec4(trail.rgb, 1.0);
  }
`;

const displayFragmentShader = `
  uniform sampler2D uTexture;
  varying vec2 vUv;
  
  void main() {
    vec4 color = texture2D(uTexture, vUv);
    // Reduced bloom for sharper look
    vec2 pixelSize = vec2(1.0) / vec2(512.0);
    vec4 bloom = vec4(0.0);
    for(float x = -1.5; x <= 1.5; x += 1.0) {
      for(float y = -1.5; y <= 1.5; y += 1.0) {
        bloom += texture2D(uTexture, vUv + vec2(x, y) * pixelSize) * 0.06;
      }
    }
    color = mix(color, bloom, 0.2);
    gl_FragColor = color;
  }
`;

export default function LightTrail({
  colorMix: defaultColorMix = 0.5,
  tint: defaultTint = new THREE.Color(0x0082f7),
  decay: defaultDecay = 0.80,
  diffusion: defaultDiffusion = 3.7,
  lightningWidth: defaultLightningWidth = 0.09,
  lightningIntensity: defaultLightningIntensity = 2.6,
  drift: defaultDrift = 0.03,
  distortionStrength: defaultDistortionStrength = 0.2,
  distortionRadius: defaultDistortionRadius = 0.1,
  blendMode: defaultBlendMode = THREE.AdditiveBlending,
}) {
  const { viewport, gl } = useThree();
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const prevMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const velocity = useRef(0);

  // Leva controls
  const {
    colorMix,
    tint,
    decay,
    diffusion,
    lightningWidth,
    lightningIntensity,
    drift,
    distortionStrength,
    distortionRadius,
  } = useControls('Light Trail', {
    colorMix: { value: defaultColorMix, min: 0, max: 1, step: 0.01 },
    tint: { value: `#${defaultTint.getHexString()}` },
    decay: { value: defaultDecay, min: 0.8, max: 0.99, step: 0.01 },
    diffusion: { value: defaultDiffusion, min: 0, max: 5, step: 0.1 },
    lightningWidth: { value: defaultLightningWidth, min: 0.01, max: 0.5, step: 0.01 },
    lightningIntensity: { value: defaultLightningIntensity, min: 0, max: 10, step: 0.1 },
    drift: { value: defaultDrift, min: 0, max: 0.05, step: 0.001 },
    distortionStrength: { value: defaultDistortionStrength, min: 0, max: 1, step: 0.01 },
    distortionRadius: { value: defaultDistortionRadius, min: 0, max: 0.5, step: 0.01 },
  });

  // Convert tint string to THREE.Color
  const tintColor = useMemo(() => new THREE.Color(tint), [tint]);

  // Create render targets for ping-pong
  const renderTargetA = useMemo(() => {
    return new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    });
  }, []);

  const renderTargetB = useMemo(() => {
    return new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    });
  }, []);

  const fboScene = useMemo(() => new THREE.Scene(), []);
  const fboCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  // Shader material for FBO (simulation)
  const fboMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: null },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uTime: { value: 0 },
        uColor1: { value: tintColor },
        uColor2: { value: new THREE.Color(0xfffffff) },
        uColorMix: { value: colorMix },
        uVelocity: { value: 0 },
        uDecay: { value: decay },
        uDiffusion: { value: diffusion },
        uLightningWidth: { value: lightningWidth },
        uLightningIntensity: { value: lightningIntensity },
        uDrift: { value: drift },
        uDistortionStrength: { value: distortionStrength },
        uDistortionRadius: { value: distortionRadius },
      },
    });
  }, [tintColor, colorMix, decay, diffusion, lightningWidth, lightningIntensity, drift, distortionStrength, distortionRadius]);

  // Display material
  const displayMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: displayFragmentShader,
      uniforms: {
        uTexture: { value: null },
      },
      transparent: true,
      blending: defaultBlendMode,
      depthWrite: false,
    });
  }, [defaultBlendMode]);

  // FBO mesh
  const fboMesh = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2, 2);
    return new THREE.Mesh(geo, fboMaterial);
  }, [fboMaterial]);

  useEffect(() => {
    fboScene.add(fboMesh);
    
    // Clear both render targets to black
    gl.setRenderTarget(renderTargetA);
    gl.clearColor(0, 0, 0, 1);
    gl.clear();
    gl.setRenderTarget(renderTargetB);
    gl.clearColor(0, 0, 0, 1);
    gl.clear();
    gl.setRenderTarget(null);
    
    return () => fboScene.remove(fboMesh);
  }, [fboScene, fboMesh, gl, renderTargetA, renderTargetB]);

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (event) => {
      prevMouse.current.copy(mouse.current);
      mouse.current.x = event.clientX / window.innerWidth;
      mouse.current.y = 1.0 - (event.clientY / window.innerHeight);
      
      // Calculate velocity with higher sensitivity
      const dx = mouse.current.x - prevMouse.current.x;
      const dy = mouse.current.y - prevMouse.current.y;
      velocity.current = Math.sqrt(dx * dx + dy * dy) * 15.0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const currentFBO = useRef(renderTargetA);
  const previousFBO = useRef(renderTargetB);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Update FBO shader uniforms (ping-pong technique)
    fboMaterial.uniforms.uTexture.value = previousFBO.current.texture;
    fboMaterial.uniforms.uMouse.value.copy(mouse.current);
    fboMaterial.uniforms.uPrevMouse.value.copy(prevMouse.current);
    fboMaterial.uniforms.uTime.value = time;
    fboMaterial.uniforms.uColor1.value.copy(tintColor);
    fboMaterial.uniforms.uColorMix.value = colorMix;
    fboMaterial.uniforms.uVelocity.value = Math.min(velocity.current, 8.0);
    fboMaterial.uniforms.uDecay.value = decay;
    fboMaterial.uniforms.uDiffusion.value = diffusion;
    fboMaterial.uniforms.uLightningWidth.value = lightningWidth;
    fboMaterial.uniforms.uLightningIntensity.value = lightningIntensity;
    fboMaterial.uniforms.uDrift.value = drift;
    fboMaterial.uniforms.uDistortionStrength.value = distortionStrength;
    fboMaterial.uniforms.uDistortionRadius.value = distortionRadius;

    // Render to current FBO (reading from previous)
    gl.setRenderTarget(currentFBO.current);
    gl.render(fboScene, fboCamera);
    gl.setRenderTarget(null);

    // Update display material to show current FBO
    displayMaterial.uniforms.uTexture.value = currentFBO.current.texture;

    // Decay velocity
    velocity.current *= 0.93;

    // Swap FBOs (ping-pong)
    const temp = currentFBO.current;
    currentFBO.current = previousFBO.current;
    previousFBO.current = temp;
  });

  return (
    <>
      
      {/* Lightning trail effect */}
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <primitive object={displayMaterial} attach="material" />
      </mesh>
    </>
  );
}
