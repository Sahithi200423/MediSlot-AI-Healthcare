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

    // --- Primary Bio-Cellular Organic Form (Pearl-White Alabaster Translucent Membrane) ---
    const baseGeometry = new THREE.SphereGeometry(1.32, 128, 96);
    const position = baseGeometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      const angle = Math.atan2(y, x);
      const radial = Math.hypot(x, y);

      // Biological undulating cellular fold matching screenshot
      const cellUndulation = 1 + 0.16 * Math.cos(3 * angle + 0.4) * Math.min(1.2, radial) + 0.08 * Math.sin(2 * angle);
      const depthFlattening = 0.60 + 0.12 * Math.cos(radial * 1.5);
      position.setXYZ(i, x * cellUndulation, y * cellUndulation, z * depthFlattening);
    }
    baseGeometry.computeVertexNormals();

    // Pearl-White Alabaster Translucent Biological Membrane Material
    const bioMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfcfbfa, // Translucent pearl white
      roughness: 0.18,
      metalness: 0.03,
      transmission: 0.72, // Glass-like cellular transmission revealing nucleus
      thickness: 1.6,
      ior: 1.44,
      clearcoat: 0.92,
      clearcoatRoughness: 0.12,
      attenuationColor: new THREE.Color(0xf6eed8),
      attenuationDistance: 2.4,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      envMapIntensity: 1.1,
    });

    const sculptureGroup = new THREE.Group();
    const cellMesh = new THREE.Mesh(baseGeometry, bioMaterial);
    sculptureGroup.add(cellMesh);

    // Warm Golden Nucleus in Center
    const nucleusGeometry = new THREE.SphereGeometry(0.72, 64, 64);
    const nucleusMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdfa544, // Warm radiant amber-gold
      roughness: 0.22,
      metalness: 0.85,
      clearcoat: 0.95,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      envMapIntensity: 1.6,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    sculptureGroup.add(nucleusMesh);

    // Thin Orbital Ring with Golden Spheres (matching screenshot)
    const ringGroup = new THREE.Group();
    
    // Orbital Wire 1 (Inclined ellipse)
    const ringGeo1 = new THREE.TorusGeometry(2.36, 0.015, 24, 160);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0xd6c2a4, // Champagne gold wire
      metalness: 0.7,
      roughness: 0.3,
      clearcoat: 0.8,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat);
    ringMesh1.rotation.set(Math.PI / 3.4, Math.PI / 6, 0);
    ringGroup.add(ringMesh1);

    // Orbital Wire 2 (Secondary delicate cross ring)
    const ringGeo2 = new THREE.TorusGeometry(2.46, 0.012, 24, 160);
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat);
    ringMesh2.rotation.set(-Math.PI / 4, -Math.PI / 5, Math.PI / 8);
    ringGroup.add(ringMesh2);

    // Gold Spheres on Orbit
    const pearlGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const goldPearlMat = new THREE.MeshPhysicalMaterial({
      color: 0xdfa544,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 1.0,
    });
    const pearl1 = new THREE.Mesh(pearlGeo, goldPearlMat);
    const pearl2 = new THREE.Mesh(pearlGeo, goldPearlMat);
    const pearl3 = new THREE.Mesh(pearlGeo, goldPearlMat);
    ringGroup.add(pearl1);
    ringGroup.add(pearl2);
    ringGroup.add(pearl3);

    sculptureGroup.add(ringGroup);

    sculptureGroup.rotation.set(-0.12, -0.28, 0.1);
    scene.add(sculptureGroup);

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
      // Rotate orbital rings and position golden spheres along the orbit trajectory
      ringGroup.rotation.y = time * 0.12;
      ringGroup.rotation.x = Math.sin(time * 0.18) * 0.08;

      // Position pearls on orbital trajectories matching screenshot
      const a1 = time * 0.5;
      const r1 = 2.36;
      pearl1.position.set(
        Math.cos(a1) * r1,
        Math.sin(a1) * r1 * Math.sin(Math.PI / 3.4),
        Math.sin(a1) * r1 * Math.cos(Math.PI / 3.4)
      );

      const a2 = a1 + Math.PI;
      pearl2.position.set(
        Math.cos(a2) * r1,
        Math.sin(a2) * r1 * Math.sin(Math.PI / 3.4),
        Math.sin(a2) * r1 * Math.cos(Math.PI / 3.4)
      );

      const a3 = -time * 0.38 + 1.2;
      const r2 = 2.46;
      pearl3.position.set(
        Math.cos(a3) * r2 * Math.cos(-Math.PI / 4),
        Math.sin(a3) * r2,
        Math.cos(a3) * r2 * Math.sin(-Math.PI / 4)
      );

      // Subtle vital respiration heartbeat pulse
      sculptureGroup.rotation.set(-0.12 + Math.sin(time * 0.35) * 0.05, tilt, rotation);
      sculptureGroup.position.y = Math.sin(time * 0.7) * 0.08;
      const pulse = 1 + Math.sin(time * 1.5) * 0.012 + Math.sin(bounce) * Math.min(bounce * 0.015, 0.05);
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
      ringGeo1.dispose();
      ringGeo2.dispose();
      pearlGeo.dispose();
      bioMaterial.dispose();
      nucleusMaterial.dispose();
      ringMat.dispose();
      goldPearlMat.dispose();
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
