import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export default function BioCellSculpture() {
  const hostRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<() => void>(() => {});
  const [available, setAvailable] = useState(true);
  const [spins, setSpins] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let motionReduced = reducedMotion.matches;
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setAvailable(false);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.outline = 'none';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(0, 0.05, 8.4);

    // Realistic reflections via RoomEnvironment
    const environment = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    const envTarget = generator.fromScene(environment, 0.04);
    scene.environment = envTarget.texture;
    environment.dispose();
    generator.dispose();

    // Soft medical studio lighting
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.3);
    keyLight.position.set(-3, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd1fae5, 1.5);
    rimLight.position.set(4, 2, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.8);
    fillLight.position.set(0, -3, 3);
    scene.add(fillLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // --- Primary Bio-Cellular Organic Form ---
    // Mathematically displaced organic cellular membrane representing vital biological harmony
    const baseGeometry = new THREE.SphereGeometry(1, 128, 96);
    const position = baseGeometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      const angle = Math.atan2(y, x);
      const radial = Math.hypot(x, y);

      // Biological 5-lobed cellular undulation with smooth gradient attenuation
      const cellUndulation = 1 + 0.26 * Math.cos(5 * angle) * Math.pow(radial, 2.0);
      const depthFlattening = 0.58;
      position.setXYZ(i, x * cellUndulation, y * cellUndulation, z * depthFlattening);
    }
    baseGeometry.computeVertexNormals();

    // Clinical Sage & Jade Porcelain physical material
    const bioMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4a6b5d, // Hospital clinical sage
      roughness: 0.32,
      metalness: 0.06,
      envMapIntensity: 0.72,
      clearcoat: 0.65,
      clearcoatRoughness: 0.28,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xd1fae5), // Gentle opalescent healthcare glow
      sheenRoughness: 0.5,
    });

    const sculptureGroup = new THREE.Group();
    const cellMesh = new THREE.Mesh(baseGeometry, bioMaterial);
    cellMesh.scale.setScalar(1.32);
    sculptureGroup.add(cellMesh);

    // Inner vital cellular core (subtle nucleus glow)
    const nucleusGeometry = new THREE.IcosahedronGeometry(0.55, 3);
    const nucleusMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe17145, // Warm terracotta vitality core
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 1.0,
      transmission: 0.1,
      opacity: 0.85,
      transparent: true,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    sculptureGroup.add(nucleusMesh);

    sculptureGroup.rotation.set(-0.16, -0.32, 0.14);
    scene.add(sculptureGroup);

    // --- Orbiting Metabolic Nodes (Circulatory Vitality Pearls) ---
    const orbGeometry = new THREE.SphereGeometry(1, 36, 32);

    // Pearl 1: Oxygenating Pearl (Soft Ivory / Champagne)
    const pearlMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfbf9f5,
      roughness: 0.18,
      metalness: 0.22,
      clearcoat: 1.0,
    });
    const pearlOrb = new THREE.Mesh(orbGeometry, pearlMaterial);
    pearlOrb.scale.setScalar(0.2);
    scene.add(pearlOrb);

    // Pearl 2: Arterial Hematology Node (Deep Wine / Crimson)
    const wineMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x762f31,
      roughness: 0.24,
      metalness: 0.12,
      clearcoat: 0.7,
    });
    const wineOrb = new THREE.Mesh(orbGeometry, wineMaterial);
    wineOrb.scale.setScalar(0.13);
    scene.add(wineOrb);

    // Animation & physics loop state
    let frame = 0;
    let elapsed = 0;
    let previous = 0;
    let drag = false;
    let lastX = 0;
    let lastY = 0;
    let movement = 0;
    let rotation = 0.14;
    let targetTilt = -0.32;
    let tilt = -0.32;
    let velocity = 0;
    let bounce = 0;
    let visible = true;
    let disposed = false;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      renderer.setSize(rect.width, rect.height);
      camera.aspect = rect.width / rect.height;
      camera.position.z = camera.aspect < 1 ? 9.6 : 8.4;
      camera.updateProjectionMatrix();
      renderStill();
    };

    const draw = (time: number) => {
      // Harmonic Lissajous biological trajectories for orbiting cellular nodes
      pearlOrb.position.set(
        Math.cos(time * 0.42 + 0.6) * 1.96,
        Math.sin(time * 0.42 + 0.6) * 1.54,
        Math.sin(time * 0.42 + 0.6) * 0.88
      );
      wineOrb.position.set(
        Math.cos(time * 0.35 + 3.4) * 2.05,
        Math.sin(time * 0.35 + 3.4) * 1.62,
        Math.cos(time * 0.35 + 3.4) * 0.58
      );

      // Subtle vital respiration heartbeat pulse
      sculptureGroup.rotation.set(-0.16 + Math.sin(time * 0.4) * 0.06, tilt, rotation);
      sculptureGroup.position.y = Math.sin(time * 0.8) * 0.09;
      const pulse = 1 + Math.sin(time * 1.6) * 0.015 + Math.sin(bounce) * Math.min(bounce * 0.016, 0.06);
      sculptureGroup.scale.setScalar(pulse);

      renderer.render(scene, camera);
    };

    function renderStill() {
      draw(elapsed);
    }

    const tick = (now: number) => {
      frame = 0;
      if (disposed || !visible || motionReduced) return;
      const dt = Math.min((now - (previous || now)) / 1000, 0.045);
      previous = now;
      elapsed += dt;

      if (!drag) {
        rotation += 0.055 * dt + velocity * dt;
        velocity *= Math.exp(-dt * 2.2);
        targetTilt = -0.32 + Math.sin(elapsed * 0.35) * 0.18;
      }

      tilt += (targetTilt - tilt) * Math.min(1, dt * 5.5);
      bounce = Math.max(0, bounce - dt * 6.5);

      draw(elapsed);
      host.dataset.rotation = rotation.toFixed(3);
      frame = requestAnimationFrame(tick);
    };

    const syncPlayback = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      host.dataset.motion = motionReduced ? 'reduced' : 'animated';
      if (motionReduced || !visible) renderStill();
      else frame = requestAnimationFrame(tick);
    };

    const onMotionChange = (event: MediaQueryListEvent) => {
      motionReduced = event.matches;
      syncPlayback();
    };

    const spin = () => {
      if (motionReduced) {
        rotation += Math.PI / 3;
        renderStill();
        host.dataset.rotation = rotation.toFixed(3);
      } else {
        velocity = 5.8;
        bounce = 7.5;
      }
      setSpins((v) => v + 1);
    };
    spinRef.current = spin;

    // Pointer events for desktop natural interaction
    const down = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return; // Preserve touch scrolling on mobile
      drag = true;
      movement = 0;
      lastX = event.clientX;
      lastY = event.clientY;
      host.setPointerCapture(event.pointerId);
      host.classList.add('is-dragging');
    };

    const move = (event: PointerEvent) => {
      if (!drag) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      movement += Math.abs(dx) + Math.abs(dy);
      rotation -= dy * 0.007;
      targetTilt += dx * 0.008;
      tilt = targetTilt;
      velocity = dx * 0.014;
      lastX = event.clientX;
      lastY = event.clientY;
      renderStill();
    };

    const up = () => {
      if (!drag) return;
      drag = false;
      host.classList.remove('is-dragging');
      if (movement < 6) spin();
    };

    const onVisibility = () => {
      visible = !document.hidden;
      syncPlayback();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);

    host.addEventListener('pointerdown', down);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', up);
    host.addEventListener('pointercancel', up);
    reducedMotion.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    syncPlayback();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener('pointerdown', down);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerup', up);
      host.removeEventListener('pointercancel', up);
      reducedMotion.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibility);

      baseGeometry.dispose();
      nucleusGeometry.dispose();
      orbGeometry.dispose();
      bioMaterial.dispose();
      nucleusMaterial.dispose();
      pearlMaterial.dispose();
      wineMaterial.dispose();
      envTarget.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      spinRef.current = () => {};
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col items-center justify-center isolation-isolate select-none">
      <span className="absolute top-4 right-6 text-[9px] uppercase tracking-[1.4px] text-[#8b7566] dark:text-[#c4b5a8] z-10 font-editorial-sans font-medium">
        FIG. 01 — VITAL METABOLISM & CELLULAR HARMONY
      </span>

      {/* Soft radial ground impression */}
      <div 
        className="absolute bottom-12 left-1/4 w-1/2 h-6 bg-[#4a6b5d] dark:bg-[#7e8a59] opacity-20 blur-xl rounded-full pointer-events-none transform -rotate-3" 
        aria-hidden="true" 
      />

      <div
        ref={hostRef}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing touch-pan-y"
        role="img"
        aria-label="An interactive, real-time 3D cellular vitality sculpture with orbiting metabolic pearls"
      >
        {!available && (
          <div className="absolute inset-0 flex items-center justify-center text-7xl text-[#4a6b5d]/30" aria-hidden="true">
            ⚕
          </div>
        )}
      </div>

      {/* Control Strip */}
      <div className="absolute bottom-4 left-0 right-0 z-10 flex flex-col items-center gap-2 pointer-events-auto">
        {available && (
          <button
            type="button"
            className="pill-button group hover:shadow-md transition-all"
            onClick={() => spinRef.current()}
            aria-label="Interact with and spin the cellular vitality sculpture"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="group-hover:rotate-45 transition-transform">
              <path d="M16.5 7a7 7 0 1 0 .5 5M16.5 2.5V7H12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Explore Vital Perspective</span>
          </button>
        )}
        <span className="text-xs italic font-editorial-serif text-[#8b7566] dark:text-[#c4b5a8]">
          drag to inspect biological resonance
        </span>
      </div>

      <span className="sr-only" aria-live="polite">
        {spins > 0 ? `Cellular vitality model rotated ${spins} ${spins === 1 ? 'time' : 'times'}.` : ''}
      </span>
    </div>
  );
}
