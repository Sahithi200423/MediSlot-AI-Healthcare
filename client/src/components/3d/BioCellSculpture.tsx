import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Creates the organic, multi-tiered cellular membrane geometry matching the
 * reference luxury medical art installation:
 * - Smooth concave central pocket cradling the golden nucleus
 * - Broad, softly rounded inner concentric fold / lip
 * - Gentle valley transition
 * - Flared undulating outer cellular petal/rim
 * - Continuous rounded biological rim edge
 * - Smooth convex rear organic shell
 */
function createBioCellMembraneGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();

  const nR = 88; // Radial subdivisions on front face
  const nRim = 18; // Edge curvature subdivisions
  const nBack = 64; // Radial subdivisions on rear convex dome
  const nTheta = 180; // Azimuthal angle subdivisions (silky smooth curves)

  const totalRings = nR + nRim + nBack + 1;
  const vertices: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Organic perimeter radius matching reference screenshot's biological lobes
  const getRadius = (theta: number) => {
    return (
      1.92 *
      (1.0 +
        0.085 * Math.cos(theta - 0.75) +
        0.068 * Math.cos(2 * theta - 1.25) +
        0.030 * Math.sin(3 * theta + 0.35) -
        0.022 * Math.cos(4 * theta))
    );
  };

  const smoothstep = (min: number, max: number, value: number) => {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  };

  // Front surface elevation profile: multi-tiered organic cellular cup
  const getFrontZ = (s: number, theta: number) => {
    // 1. Central hollow pocket for golden nucleus
    const centerPocket = -0.46 * Math.exp(-Math.pow(s / 0.35, 2));

    // 2. Inner concentric fold creating layered depth
    const innerTerrace =
      0.17 *
      Math.exp(-Math.pow((s - 0.48) / 0.13, 2)) *
      (1.0 + 0.08 * Math.cos(theta - 0.6));

    // 3. Gentle valley transition
    const foldGroove = -0.05 * Math.exp(-Math.pow((s - 0.66) / 0.10, 2));

    // 4. Undulating flared outer rim
    const outerRimFlare =
      0.25 *
      Math.pow(smoothstep(0.62, 1.0, s), 1.25) *
      (1.0 + 0.14 * Math.cos(2 * theta - 0.7) + 0.06 * Math.sin(3 * theta + 0.2));

    return centerPocket + innerTerrace + foldGroove + outerRimFlare;
  };

  for (let ring = 0; ring < totalRings; ring++) {
    let rFrac = 0;
    let isFront = true;
    let isRim = false;
    let rimAlpha = 0;

    if (ring <= nR) {
      rFrac = ring / nR;
      isFront = true;
    } else if (ring <= nR + nRim) {
      isRim = true;
      rimAlpha = ((ring - nR) / nRim) * Math.PI;
    } else {
      const backStep = ring - (nR + nRim);
      rFrac = 1.0 - backStep / nBack;
      isFront = false;
    }

    for (let j = 0; j <= nTheta; j++) {
      const theta = (j / nTheta) * Math.PI * 2;
      const baseR = getRadius(theta);
      const frontZRim = getFrontZ(1.0, theta);
      const rimThickness = 0.095 * (1.0 + 0.04 * Math.cos(theta));

      let x = 0;
      let y = 0;
      let z = 0;
      let r = 1.0, g = 1.0, b = 1.0;

      if (isRim) {
        const curR = baseR + 0.048 * Math.sin(rimAlpha);
        x = curR * Math.cos(theta);
        y = curR * Math.sin(theta);
        z = frontZRim - rimThickness * 0.5 * (1.0 - Math.cos(rimAlpha));
        r = 0.99; g = 0.98; b = 0.96;
      } else if (isFront) {
        const curR = rFrac * baseR;
        x = curR * Math.cos(theta);
        y = curR * Math.sin(theta);
        z = getFrontZ(rFrac, theta);

        if (rFrac < 0.38) {
          const warmth = 1.0 - (rFrac / 0.38);
          r = 1.0 - warmth * 0.01;
          g = 0.98 - warmth * 0.03;
          b = 0.95 - warmth * 0.07;
        } else if (rFrac < 0.58) {
          r = 0.995; g = 0.99; b = 0.98;
        } else {
          r = 0.99; g = 0.985; b = 0.97;
        }
      } else {
        const curR = rFrac * baseR;
        x = curR * Math.cos(theta);
        y = curR * Math.sin(theta);
        const domeDepth = 0.52 * Math.pow(Math.max(0, 1.0 - rFrac * rFrac), 0.72);
        z = frontZRim - rimThickness - domeDepth + 0.035 * Math.cos(theta) * (1.0 - rFrac);
        r = 0.97; g = 0.96; b = 0.94;
      }

      vertices.push(x, y, z);
      colors.push(r, g, b);
      uvs.push(j / nTheta, ring / (totalRings - 1));
    }
  }

  const ringStride = nTheta + 1;
  for (let ring = 0; ring < totalRings - 1; ring++) {
    for (let j = 0; j < nTheta; j++) {
      const a = ring * ringStride + j;
      const b = (ring + 1) * ringStride + j;
      const c = (ring + 1) * ringStride + (j + 1);
      const d = ring * ringStride + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  return geo;
}

/**
 * Generates a subtle procedural satin/pearl micro-texture on canvas
 */
function createMicroTexture(type: 'pearl' | 'gold'): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const imgData = ctx.createImageData(size, size);
    const d = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        if (type === 'pearl') {
          const n =
            Math.sin(x * 0.12) * Math.cos(y * 0.12) * 0.5 +
            Math.sin(x * 0.28 + y * 0.24) * 0.3;
          const val = Math.floor(225 + n * 20);
          d[idx] = val;
          d[idx + 1] = val;
          d[idx + 2] = val;
          d[idx + 3] = 255;
        } else {
          const n =
            Math.sin(y * 0.8) * 0.4 +
            (Math.random() - 0.5) * 0.35;
          const val = Math.floor(215 + n * 35);
          d[idx] = val;
          d[idx + 1] = val;
          d[idx + 2] = val;
          d[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(type === 'pearl' ? 4 : 8, type === 'pearl' ? 4 : 8);
  return texture;
}

/**
 * Creates a soft radial shadow texture for realistic ground contact
 */
function createSoftShadowTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(84, 55, 26, 0.22)');
  gradient.addColorStop(0.35, 'rgba(110, 80, 48, 0.14)');
  gradient.addColorStop(0.70, 'rgba(140, 110, 75, 0.05)');
  gradient.addColorStop(1, 'rgba(140, 110, 75, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

export default function BioCellSculpture() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let motionReduced = reducedMotion.matches;
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setAvailable(false);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.outline = 'none';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(0, 0, 8.4);

    // High-fidelity studio PMREM environment for pearl & gold reflections
    const environment = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    const envTarget = generator.fromScene(environment, 0.04);
    scene.environment = envTarget.texture;
    environment.dispose();
    generator.dispose();

    // Procedural micro-textures for museum-grade material finishes
    const pearlTexture = createMicroTexture('pearl');
    const goldTexture = createMicroTexture('gold');
    const shadowTexture = createSoftShadowTexture();

    // Soft realistic circular contact shadow plane behind sculpture
    const shadowGeo = new THREE.PlaneGeometry(6.2, 6.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0.2, -0.3, -0.8);
    scene.add(shadowMesh);

    // Studio lighting matching the approved reference photograph:
    // 1. Key Light from top-left (warm daylight ivory casting soft specular highlights)
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 3.8);
    keyLight.position.set(-3.8, 4.8, 5.0);
    scene.add(keyLight);

    // 2. Warm golden cavity fill light to create the warm amber glow on the translucent inner cup
    const nucleusFillLight = new THREE.PointLight(0xff9e2e, 4.0, 6.0, 1.2);
    nucleusFillLight.position.set(0.04, 0.02, 0.22);
    scene.add(nucleusFillLight);

    // 3. Rim/Back light to highlight the translucent undulating membrane edges
    const rimLight = new THREE.DirectionalLight(0xffffff, 2.4);
    rimLight.position.set(2.4, 3.6, -3.8);
    scene.add(rimLight);

    // 4. Soft right fill light
    const fillLight = new THREE.DirectionalLight(0xffecd8, 1.4);
    fillLight.position.set(4.2, 1.4, 2.0);
    scene.add(fillLight);

    // 5. Subtle warm bottom bounce
    const bounceLight = new THREE.DirectionalLight(0xfff5e8, 0.7);
    bounceLight.position.set(-2.2, -3.4, 1.6);
    scene.add(bounceLight);

    // 6. Ambient soft studio illumination
    scene.add(new THREE.AmbientLight(0xfffaf6, 0.65));

    // Master sculpture group
    const sculptureGroup = new THREE.Group();

    // -------------------------------------------------------------------------
    // 1. WARM METALLIC GOLDEN NUCLEUS (Central Spherical Orb)
    // -------------------------------------------------------------------------
    const nucleusGeo = new THREE.SphereGeometry(0.72, 64, 64);
    const nucleusMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xdca034), // Rich warm 24K gold
      emissive: new THREE.Color(0x361d02),
      emissiveIntensity: 0.16,
      metalness: 0.95,
      roughness: 0.28, // Luxury satin sheen
      bumpMap: goldTexture,
      bumpScale: 0.005,
      clearcoat: 0.42,
      clearcoatRoughness: 0.20,
      reflectivity: 0.94,
      envMapIntensity: 1.65,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMaterial);
    nucleusMesh.position.set(0.03, 0.01, 0.02);
    sculptureGroup.add(nucleusMesh);

    // -------------------------------------------------------------------------
    // 2. SCULPTED ORGANIC CELLULAR MEMBRANE (Pearl-Alabaster, Translucent Folds)
    // -------------------------------------------------------------------------
    const outerGeo = createBioCellMembraneGeometry();
    const outerMembraneMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xfcfbfa),
      vertexColors: true,
      roughness: 0.20, // Silky frosted alabaster luster
      metalness: 0.02,
      clearcoat: 0.45,
      clearcoatRoughness: 0.18,
      transmission: 0.68, // Luminous semi-translucent frosted glass / jade depth
      thickness: 1.8,
      ior: 1.48,
      attenuationColor: new THREE.Color(0xfff7eb),
      attenuationDistance: 2.0,
      sheen: 0.90,
      sheenRoughness: 0.30,
      sheenColor: new THREE.Color(0xfff7ed),
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      bumpMap: pearlTexture,
      bumpScale: 0.004,
      side: THREE.DoubleSide,
      envMapIntensity: 1.30,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMembraneMaterial);
    sculptureGroup.add(outerMesh);

    // -------------------------------------------------------------------------
    // 3. DELICATE CHAMPAGNE-GOLD ORBITAL RING & ATTACHED SPHERES
    // -------------------------------------------------------------------------
    const ringGroup = new THREE.Group();

    // Slender champagne-gold orbital ring
    const ringRadius = 2.42;
    const ringThickness = 0.0125;
    const ringGeo = new THREE.TorusGeometry(ringRadius, ringThickness, 32, 240);
    const ringMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xdfba78), // Delicate champagne gold
      metalness: 0.95,
      roughness: 0.22,
      clearcoat: 0.45,
      clearcoatRoughness: 0.20,
      envMapIntensity: 1.5,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMaterial);

    // Exact Euler rotation matching reference screenshot:
    // Ring ellipse major axis oriented from bottom-left to top-right
    // Sweeps forward (Z > 0) in lower-left, loops behind (Z < 0) in upper-right
    ringMesh.rotation.order = 'XYZ';
    ringMesh.rotation.set(1.066, 0.436, 0.229);
    ringGroup.add(ringMesh);

    // Two Golden Spheres attached directly onto the orbital ring:
    // Sphere 1: Lower-left (~8 o'clock on the ring, sweeping forward in front)
    // Sphere 2: Upper-right (~2 o'clock on the ring, sweeping behind)
    const sphereGeo1 = new THREE.SphereGeometry(0.135, 32, 32);
    const sphereGeo2 = new THREE.SphereGeometry(0.125, 32, 32);

    const sphere1 = new THREE.Mesh(sphereGeo1, nucleusMaterial);
    const sphere2 = new THREE.Mesh(sphereGeo2, nucleusMaterial);
    ringGroup.add(sphere1);
    ringGroup.add(sphere2);

    ringGroup.position.set(-0.02, 0.02, 0.04);
    sculptureGroup.add(ringGroup);

    // Initial orientation matching reference screenshot: slight forward tilt, angled towards viewer
    sculptureGroup.rotation.set(0.14, -0.18, 0.04);
    scene.add(sculptureGroup);

    // -------------------------------------------------------------------------
    // 4. INTERACTION & ANIMATION PHYSICS
    // -------------------------------------------------------------------------
    let frame = 0;
    let elapsed = 0;
    let previous = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let rotX = 0.14;
    let rotY = -0.18;
    let targetRotX = 0.14;
    let targetRotY = -0.18;
    let velX = 0;
    let velY = 0;
    let isVisible = true;
    let isDisposed = false;

    // Helper to calculate exact 3D position along the tilted ring
    const updateSpheresOnRing = (angleOffset: number) => {
      // Lower-left sphere (sweeping forward at ~150 deg on the ring)
      const theta1 = (150 * Math.PI) / 180 + angleOffset;
      const v1 = new THREE.Vector3(
        Math.cos(theta1) * ringRadius,
        Math.sin(theta1) * ringRadius,
        0
      ).applyEuler(ringMesh.rotation);
      sphere1.position.copy(v1);

      // Upper-right sphere (sweeping behind at ~0 deg on the ring)
      const theta2 = (0 * Math.PI) / 180 + angleOffset;
      const v2 = new THREE.Vector3(
        Math.cos(theta2) * ringRadius,
        Math.sin(theta2) * ringRadius,
        0
      ).applyEuler(ringMesh.rotation);
      sphere2.position.copy(v2);
    };

    updateSpheresOnRing(0);

    const renderScene = (time: number) => {
      // Subtle organic breathing animation
      const breath = 1 + Math.sin(time * 0.9) * 0.012;
      sculptureGroup.scale.set(breath, breath, breath);

      // Gentle orbital progression
      updateSpheresOnRing(time * 0.08);
      ringGroup.rotation.z = time * 0.035;

      sculptureGroup.rotation.x = rotX;
      sculptureGroup.rotation.y = rotY;

      renderer.render(scene, camera);
    };

    const tick = (now: number) => {
      frame = 0;
      if (isDisposed || !isVisible || motionReduced) return;
      const dt = Math.min((now - (previous || now)) / 1000, 0.04);
      previous = now;
      elapsed += dt;

      if (!isDragging) {
        // Gentle, slow automatic rotation
        targetRotY += 0.045 * dt;

        // Inertia damping
        targetRotX += velX * dt;
        targetRotY += velY * dt;
        velX *= Math.exp(-dt * 3.0);
        velY *= Math.exp(-dt * 3.0);
      }

      // Smooth lerp toward target rotation
      rotX += (targetRotX - rotX) * Math.min(1, dt * 6.0);
      rotY += (targetRotY - rotY) * Math.min(1, dt * 6.0);

      renderScene(elapsed);
      frame = requestAnimationFrame(tick);
    };

    const handleResize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      renderer.setSize(rect.width, rect.height);
      camera.aspect = rect.width / rect.height;
      camera.position.z = camera.aspect < 1 ? 9.2 : 8.4;
      camera.updateProjectionMatrix();
      renderScene(elapsed);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // Allow natural touch scrolling on mobile
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velX = 0;
      velY = 0;
      host.setPointerCapture(e.pointerId);
      host.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      targetRotY += dx * 0.007;
      targetRotX += dy * 0.007;

      // Keep targetRotX within comfortable viewing angles
      targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX));

      velY = dx * 0.012;
      velX = dy * 0.012;

      renderScene(elapsed);
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      host.style.cursor = 'grab';
    };

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && !motionReduced) {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(frame);
      }
    };

    const onMotionChange = (e: MediaQueryListEvent) => {
      motionReduced = e.matches;
      if (motionReduced) {
        cancelAnimationFrame(frame);
        renderScene(elapsed);
      } else {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(host);

    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerup', onPointerUp);
    host.addEventListener('pointercancel', onPointerUp);
    host.style.cursor = 'grab';

    reducedMotion.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibilityChange);

    handleResize();
    if (!motionReduced) {
      frame = requestAnimationFrame(tick);
    } else {
      renderScene(0);
    }

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();

      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerup', onPointerUp);
      host.removeEventListener('pointercancel', onPointerUp);
      reducedMotion.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      outerGeo.dispose();
      nucleusGeo.dispose();
      ringGeo.dispose();
      sphereGeo1.dispose();
      sphereGeo2.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTexture.dispose();
      pearlTexture.dispose();
      goldTexture.dispose();
      outerMembraneMaterial.dispose();
      nucleusMaterial.dispose();
      ringMaterial.dispose();
      envTarget.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[440px] md:min-h-[500px] flex items-center justify-center isolation-isolate select-none">
      <div
        ref={hostRef}
        className="absolute inset-0 z-0 touch-pan-y"
        role="img"
        aria-label="Interactive 3D cellular vitality sculpture with pearl alabaster membrane, golden nucleus, and orbital ring"
      >
        {!available && (
          <div
            className="absolute inset-0 flex items-center justify-center text-6xl text-[#4a6356]/30"
            aria-hidden="true"
          >
            ⚕
          </div>
        )}
      </div>
    </div>
  );
}
