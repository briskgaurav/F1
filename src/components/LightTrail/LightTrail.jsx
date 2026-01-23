"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useControls } from 'leva';

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
    
    // Add new lightning and glow with reduced intensity
    trail.rgb += (lightning + glow) * color * 10.5;
    
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
    color = mix(color, bloom, 0.01);
    // Reduce overall opacity
    color.rgb *= 0.05;
    gl_FragColor = color;
  }
`;

// Standalone component that renders to its own canvas (not affected by R3F postprocessing)
export default function LightTrail({
  colorMix: defaultColorMix = 0.5,
  tint: defaultTint = new THREE.Color("#aaaaaa"),
  decay: defaultDecay = 0.80,
  diffusion: defaultDiffusion = 3.7,
  lightningWidth: defaultLightningWidth = 0.09,
  lightningIntensity: defaultLightningIntensity = 2.6,
  drift: defaultDrift = 0.03,
  distortionStrength: defaultDistortionStrength = 0.2,
  distortionRadius: defaultDistortionRadius = 0.1,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const fboSceneRef = useRef(null);
  const fboCameraRef = useRef(null);
  const fboMaterialRef = useRef(null);
  const displayMaterialRef = useRef(null);
  const renderTargetARef = useRef(null);
  const renderTargetBRef = useRef(null);
  const currentFBORef = useRef(null);
  const previousFBORef = useRef(null);
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const prevMouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const velocityRef = useRef(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(Date.now());

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

  const tintColor = useMemo(() => new THREE.Color(tint), [tint]);

  // Initialize Three.js
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    rendererRef.current = renderer;

    // Create scenes and cameras
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    sceneRef.current = scene;
    cameraRef.current = camera;

    const fboScene = new THREE.Scene();
    const fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    fboSceneRef.current = fboScene;
    fboCameraRef.current = fboCamera;

    // Create render targets
    const rtOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    };
    renderTargetARef.current = new THREE.WebGLRenderTarget(512, 512, rtOptions);
    renderTargetBRef.current = new THREE.WebGLRenderTarget(512, 512, rtOptions);
    currentFBORef.current = renderTargetARef.current;
    previousFBORef.current = renderTargetBRef.current;

    // Create FBO material
    const fboMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: null },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uTime: { value: 0 },
        uColor1: { value: tintColor.clone() },
        uColor2: { value: new THREE.Color(0x000000) },
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
    fboMaterialRef.current = fboMaterial;

    const fboMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fboMaterial);
    fboScene.add(fboMesh);

    // Create display material
    const displayMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: displayFragmentShader,
      uniforms: {
        uTexture: { value: null },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    displayMaterialRef.current = displayMaterial;

    const displayMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), displayMaterial);
    scene.add(displayMesh);

    // Clear render targets
    renderer.setRenderTarget(renderTargetARef.current);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.setRenderTarget(renderTargetBRef.current);
    renderer.clear();
    renderer.setRenderTarget(null);

    // Handle resize
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Handle mouse move
    const handleMouseMove = (event) => {
      prevMouseRef.current.copy(mouseRef.current);
      mouseRef.current.x = event.clientX / window.innerWidth;
      mouseRef.current.y = 1.0 - (event.clientY / window.innerHeight);
      
      const dx = mouseRef.current.x - prevMouseRef.current.x;
      const dy = mouseRef.current.y - prevMouseRef.current.y;
      velocityRef.current = Math.sqrt(dx * dx + dy * dy) * 15.0;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      const time = (Date.now() - startTimeRef.current) / 1000;
      const fboMat = fboMaterialRef.current;
      const displayMat = displayMaterialRef.current;

      if (fboMat && displayMat) {
        // Update uniforms
        fboMat.uniforms.uTexture.value = previousFBORef.current.texture;
        fboMat.uniforms.uMouse.value.copy(mouseRef.current);
        fboMat.uniforms.uPrevMouse.value.copy(prevMouseRef.current);
        fboMat.uniforms.uTime.value = time;
        fboMat.uniforms.uVelocity.value = Math.min(velocityRef.current, 8.0);

        // Render to FBO
        renderer.setRenderTarget(currentFBORef.current);
        renderer.render(fboSceneRef.current, fboCameraRef.current);
        renderer.setRenderTarget(null);

        // Update display
        displayMat.uniforms.uTexture.value = currentFBORef.current.texture;

        // Render to screen
        renderer.render(sceneRef.current, cameraRef.current);

        // Decay velocity
        velocityRef.current *= 0.93;

        // Swap FBOs
        const temp = currentFBORef.current;
        currentFBORef.current = previousFBORef.current;
        previousFBORef.current = temp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      renderTargetARef.current?.dispose();
      renderTargetBRef.current?.dispose();
    };
  }, []);

  // Update uniforms when controls change
  useEffect(() => {
    if (fboMaterialRef.current) {
      fboMaterialRef.current.uniforms.uColor1.value.copy(tintColor);
      fboMaterialRef.current.uniforms.uColorMix.value = colorMix;
      fboMaterialRef.current.uniforms.uDecay.value = decay;
      fboMaterialRef.current.uniforms.uDiffusion.value = diffusion;
      fboMaterialRef.current.uniforms.uLightningWidth.value = lightningWidth;
      fboMaterialRef.current.uniforms.uLightningIntensity.value = lightningIntensity;
      fboMaterialRef.current.uniforms.uDrift.value = drift;
      fboMaterialRef.current.uniforms.uDistortionStrength.value = distortionStrength;
      fboMaterialRef.current.uniforms.uDistortionRadius.value = distortionRadius;
    }
  }, [tintColor, colorMix, decay, diffusion, lightningWidth, lightningIntensity, drift, distortionStrength, distortionRadius]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
