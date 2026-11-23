import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { generateBioCellGeometryData, type BioCellGeometryData } from './biocell.worker.js';

function createBioCellGeometryFromData(data: BioCellGeometryData): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(data.uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
  geo.computeVertexNormals();
  return geo;
}

async function loadGeometryData(): Promise<BioCellGeometryData> {
  if (typeof window !== 'undefined' && typeof window.Worker !== 'undefined') {
    try {
      return await new Promise<BioCellGeometryData>((resolve) => {
        const worker = new Worker(
          new URL('./biocell.worker.ts', import.meta.url),
          { type: 'module' }
        );
        const timeout = setTimeout(() => {
          worker.terminate();
          resolve(generateBioCellGeometryData({ nR: 48, nRim: 12, nBack: 36, nTheta: 96 }));
        }, 1500);

        worker.onmessage = (e: MessageEvent<BioCellGeometryData>) => {
          clearTimeout(timeout);
          worker.terminate();
          resolve(e.data);
        };
        worker.onerror = () => {
          clearTimeout(timeout);
          worker.terminate();
          resolve(generateBioCellGeometryData({ nR: 48, nRim: 12, nBack: 36, nTheta: 96 }));
        };
        worker.postMessage({ nR: 48, nRim: 12, nBack: 36, nTheta: 96 });
      });
    } catch {
      // Fallback if worker construction is restricted
    }
  }
  return generateBioCellGeometryData({ nR: 48, nRim: 12, nBack: 36, nTheta: 96 });
}

function createAlabasterTexture(): THREE.CanvasTexture {
  const size = 128;
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
        const n1 = Math.sin(x * 0.05 + y * 0.03) * 0.5 + 0.5;
        const n2 = Math.cos(x * 0.02 - y * 0.06) * 0.5 + 0.5;
        const val = Math.floor(228 + (n1 * 0.6 + n2 * 0.4) * 26);
        d[idx] = val;
        d[idx + 1] = Math.floor(val * 0.98);
        d[idx + 2] = Math.floor(val * 0.94);
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createGoldTexture(): THREE.CanvasTexture {
  const size = 128;
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
        const n = Math.sin(y * 0.7) * 0.35 + (Math.random() - 0.5) * 0.30;
        const val = Math.floor(215 + n * 30);
        d[idx] = val;
        d[idx + 1] = val;
        d[idx + 2] = val;
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

function createSoftShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(75, 48, 20, 0.40)');
  gradient.addColorStop(0.35, 'rgba(102, 72, 38, 0.26)');
  gradient.addColorStop(0.70, 'rgba(138, 108, 70, 0.10)');
  gradient.addColorStop(1, 'rgba(138, 108, 70, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

const yieldToMain = () =>
  new Promise<void>((resolve) => {
    if (typeof window !== 'undefined' && 'scheduler' in window && (window as any).scheduler?.yield) {
      (window as any).scheduler.yield().then(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });

export default function BioCellSculpture() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let motionReduced = reducedMotion.matches;
    let renderer: THREE.WebGLRenderer | null = null;
    let disposed = false;
    let frame = 0;
    let lastFrameTime = 0;
    let initTimer: ReturnType<typeof setTimeout> | null = null;
    let observer: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    let pointerDownHandler: ((e: PointerEvent) => void) | null = null;
    let pointerMoveHandler: ((e: PointerEvent) => void) | null = null;
    let pointerUpHandler: (() => void) | null = null;
    let pointerLeaveHandler: (() => void) | null = null;
    let motionChangeHandler: ((e: MediaQueryListEvent) => void) | null = null;
    let visibilityChangeHandler: (() => void) | null = null;

    // Disposables tracking
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];
    const texturesToDispose: THREE.Texture[] = [];

    async function init() {
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

      if (disposed || !host) {
        renderer.dispose();
        return;
      }

      const maxPr = window.innerWidth < 768 ? 1.25 : 1.5;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPr));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;

      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.style.outline = 'none';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
      camera.position.set(0, 0, 7.7);

      // Yield after initial WebGL context creation to avoid blocking main thread
      await yieldToMain();
      if (disposed) return;

      // Studio environment
      const environment = new RoomEnvironment();
      const generator = new THREE.PMREMGenerator(renderer);
      const envTarget = generator.fromScene(environment, 0.04);
      scene.environment = envTarget.texture;
      texturesToDispose.push(envTarget.texture);
      environment.dispose();
      generator.dispose();

      // Yield after PMREM cubemap generation
      await yieldToMain();
      if (disposed) return;

      // Procedural textures
      const alabasterTexture = createAlabasterTexture();
      const goldTexture = createGoldTexture();
      const shadowTexture = createSoftShadowTexture();
      texturesToDispose.push(alabasterTexture, goldTexture, shadowTexture);

      // Yield after procedural texture rasterization
      await yieldToMain();
      if (disposed) return;

      // Shadow plane
      const shadowGeo = new THREE.PlaneGeometry(7.2, 7.2);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      });
      geometriesToDispose.push(shadowGeo);
      materialsToDispose.push(shadowMat);
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.position.set(0.18, -0.40, -0.70);
      scene.add(shadowMesh);

      // Studio lighting
      const keyLight = new THREE.DirectionalLight(0xfff7ee, 2.9);
      keyLight.position.set(-3.5, 4.5, 4.6);
      scene.add(keyLight);

      const nucleusFillLight = new THREE.PointLight(0xff9622, 4.0, 5.2, 1.2);
      nucleusFillLight.position.set(0.02, 0.01, 0.22);
      scene.add(nucleusFillLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
      rimLight.position.set(2.2, 3.4, -3.6);
      scene.add(rimLight);

      const fillLight = new THREE.DirectionalLight(0xffecd6, 1.2);
      fillLight.position.set(4.0, 1.4, 2.2);
      scene.add(fillLight);

      const bounceLight = new THREE.DirectionalLight(0xfff4e6, 0.55);
      bounceLight.position.set(-1.8, -3.0, 1.4);
      scene.add(bounceLight);

      scene.add(new THREE.AmbientLight(0xfffaf6, 0.52));

      const sculptureGroup = new THREE.Group();

      // 1. Central Golden Nucleus
      const nucleusGeo = new THREE.SphereGeometry(0.78, 36, 36);
      geometriesToDispose.push(nucleusGeo);
      const nucleusMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xd5952c),
        emissive: new THREE.Color(0x382004),
        emissiveIntensity: 0.16,
        metalness: 0.90,
        roughness: 0.26,
        bumpMap: goldTexture,
        bumpScale: 0.003,
        clearcoat: 0.52,
        clearcoatRoughness: 0.20,
        reflectivity: 0.92,
        envMapIntensity: 1.55,
      });
      materialsToDispose.push(nucleusMaterial);
      const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMaterial);
      nucleusMesh.position.set(0.02, 0.01, 0.02);
      sculptureGroup.add(nucleusMesh);

      // Yield after lighting and nucleus creation
      await yieldToMain();
      if (disposed) return;

      // 2. Off-Thread Computed Organic Cellular Membrane
      const geoData = await loadGeometryData();
      if (disposed) return;

      const outerGeo = createBioCellGeometryFromData(geoData);
      geometriesToDispose.push(outerGeo);
      const outerMembraneMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xf6f2ea),
        vertexColors: true,
        roughness: 0.28,
        metalness: 0.01,
        clearcoat: 0.50,
        clearcoatRoughness: 0.22,
        sheen: 0.85,
        sheenRoughness: 0.30,
        sheenColor: new THREE.Color(0xfff7ec),
        specularIntensity: 0.95,
        specularColor: new THREE.Color(0xffffff),
        map: alabasterTexture,
        bumpMap: alabasterTexture,
        bumpScale: 0.003,
        side: THREE.DoubleSide,
        envMapIntensity: 1.20,
      });
      materialsToDispose.push(outerMembraneMaterial);
      const outerMesh = new THREE.Mesh(outerGeo, outerMembraneMaterial);
      sculptureGroup.add(outerMesh);

      // Yield after outer cellular membrane creation
      await yieldToMain();
      if (disposed) return;

      // 3. Delicate Champagne-Gold Orbital Ring
      const ringGroup = new THREE.Group();
      const ringRadius = 2.30;
      const ringThickness = 0.012;
      const ringGeo = new THREE.TorusGeometry(ringRadius, ringThickness, 16, 96);
      geometriesToDispose.push(ringGeo);
      const ringMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xdfba76),
        metalness: 0.95,
        roughness: 0.24,
        clearcoat: 0.48,
        clearcoatRoughness: 0.20,
        envMapIntensity: 1.5,
      });
      materialsToDispose.push(ringMaterial);
      const ringMesh = new THREE.Mesh(ringGeo, ringMaterial);
      ringMesh.rotation.order = 'XYZ';
      ringMesh.rotation.set(1.04, 0.42, 0.21);
      ringGroup.add(ringMesh);

      // Two Attached Spheres
      const sphereGeo1 = new THREE.SphereGeometry(0.130, 24, 24);
      const sphereGeo2 = new THREE.SphereGeometry(0.125, 24, 24);
      geometriesToDispose.push(sphereGeo1, sphereGeo2);
      const sphere1 = new THREE.Mesh(sphereGeo1, nucleusMaterial);
      const sphere2 = new THREE.Mesh(sphereGeo2, nucleusMaterial);
      ringGroup.add(sphere1);
      ringGroup.add(sphere2);

      ringGroup.position.set(-0.02, 0.02, 0.04);
      sculptureGroup.add(ringGroup);

      sculptureGroup.rotation.set(0.12, -0.16, 0.03);
      scene.add(sculptureGroup);

      // Yield before interaction and animation setup
      await yieldToMain();
      if (disposed) return;

      // 4. Interaction & Throttled Animation Loop
      let elapsed = 0;
      let previous = 0;
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;
      let rotX = 0.12;
      let rotY = -0.16;
      let targetRotX = 0.12;
      let targetRotY = -0.16;
      let velX = 0;
      let velY = 0;
      let hoverTiltX = 0;
      let hoverTiltY = 0;
      let targetHoverTiltX = 0;
      let targetHoverTiltY = 0;
      let isVisible = true;
      let isInViewport = true;

      const v1Scratch = new THREE.Vector3();
      const v2Scratch = new THREE.Vector3();

      const updateSpheresOnRing = (angleOffset: number) => {
        const theta1 = (150 * Math.PI) / 180 + angleOffset;
        v1Scratch
          .set(Math.cos(theta1) * ringRadius, Math.sin(theta1) * ringRadius, 0)
          .applyEuler(ringMesh.rotation);
        sphere1.position.copy(v1Scratch);

        const theta2 = (15 * Math.PI) / 180 + angleOffset;
        v2Scratch
          .set(Math.cos(theta2) * ringRadius, Math.sin(theta2) * ringRadius, 0)
          .applyEuler(ringMesh.rotation);
        sphere2.position.copy(v2Scratch);
      };

      updateSpheresOnRing(0);

      const renderScene = (time: number) => {
        if (!renderer) return;
        const breath = motionReduced ? 1 : 1 + Math.sin(time * 0.8) * 0.010;
        const floatY = motionReduced ? 0 : Math.sin(time * 0.72) * 0.085;
        sculptureGroup.scale.set(breath, breath, breath);
        sculptureGroup.position.y = floatY;

        const shadowScale = 1 - floatY * 0.18;
        shadowMesh.scale.set(shadowScale, shadowScale, 1);

        updateSpheresOnRing(time * 0.03);
        ringGroup.rotation.z = time * 0.015;

        sculptureGroup.rotation.x = rotX + hoverTiltX;
        sculptureGroup.rotation.y = rotY + hoverTiltY;

        renderer.render(scene, camera);
      };

      const IDLE_FRAME_INTERVAL = 1000 / 30; // 30 FPS when idle floating

      const scheduleNextFrame = () => {
        if (disposed || !isVisible || !isInViewport || motionReduced || frame !== 0) return;
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      };

      const tick = (now: number) => {
        frame = 0;
        if (disposed || !isVisible || !isInViewport || motionReduced) return;

        const minInterval = isDragging ? (1000 / 60) : IDLE_FRAME_INTERVAL;
        if (now - lastFrameTime < minInterval) {
          frame = requestAnimationFrame(tick);
          return;
        }
        lastFrameTime = now;

        const dt = Math.min((now - (previous || now)) / 1000, 0.04);
        previous = now;
        elapsed += dt;

        if (!isDragging) {
          targetRotY += 0.025 * dt;
          targetRotX += velX * dt;
          targetRotY += velY * dt;
          velX *= Math.exp(-dt * 3.0);
          velY *= Math.exp(-dt * 3.0);
        }

        const lerpFactor = Math.min(1, dt * 6.0);
        rotX += (targetRotX - rotX) * lerpFactor;
        rotY += (targetRotY - rotY) * lerpFactor;
        hoverTiltX += (targetHoverTiltX - hoverTiltX) * Math.min(1, dt * 4.5);
        hoverTiltY += (targetHoverTiltY - hoverTiltY) * Math.min(1, dt * 4.5);

        renderScene(elapsed);
        frame = requestAnimationFrame(tick);
      };

      const handleResize = () => {
        if (!host || !renderer) return;
        const rect = host.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        renderer.setSize(rect.width, rect.height);
        camera.aspect = rect.width / rect.height;
        camera.position.z = camera.aspect < 1 ? 8.4 : 7.7;
        camera.updateProjectionMatrix();
        renderScene(elapsed);
      };

      const onPointerDown = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        velX = 0;
        velY = 0;
        targetHoverTiltX = 0;
        targetHoverTiltY = 0;
        host.setPointerCapture(e.pointerId);
        host.style.cursor = 'grabbing';
      };

      const onPointerMove = (e: PointerEvent) => {
        if (isDragging) {
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          targetRotY += dx * 0.007;
          targetRotX += dy * 0.007;
          targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX));
          velY = dx * 0.012;
          velX = dy * 0.012;
          renderScene(elapsed);
          return;
        }

        if (e.pointerType === 'mouse' && !motionReduced) {
          const rect = host.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            targetHoverTiltY = normX * 0.14;
            targetHoverTiltX = normY * 0.1;
          }
        }
      };

      const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        host.style.cursor = 'grab';
      };

      const onPointerLeave = () => {
        targetHoverTiltX = 0;
        targetHoverTiltY = 0;
      };

      const onVisibilityChange = () => {
        isVisible = !document.hidden;
        if (isVisible && isInViewport && !motionReduced) {
          scheduleNextFrame();
        } else if (frame !== 0) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      };

      const onMotionChange = (e: MediaQueryListEvent) => {
        motionReduced = e.matches;
        if (motionReduced) {
          if (frame !== 0) {
            cancelAnimationFrame(frame);
            frame = 0;
          }
          renderScene(elapsed);
        } else {
          scheduleNextFrame();
        }
      };

      observer = new ResizeObserver(handleResize);
      observer.observe(host);

      intersectionObserver =
        typeof IntersectionObserver !== 'undefined'
          ? new IntersectionObserver(
              (entries) => {
                isInViewport = entries[0]?.isIntersecting ?? true;
                if (isInViewport && isVisible && !motionReduced) {
                  scheduleNextFrame();
                } else if (!isInViewport && frame !== 0) {
                  cancelAnimationFrame(frame);
                  frame = 0;
                }
              },
              { threshold: 0.05 }
            )
          : null;
      intersectionObserver?.observe(host);

      pointerDownHandler = onPointerDown;
      pointerMoveHandler = onPointerMove;
      pointerUpHandler = onPointerUp;
      pointerLeaveHandler = onPointerLeave;
      motionChangeHandler = onMotionChange;
      visibilityChangeHandler = onVisibilityChange;

      host.addEventListener('pointerdown', pointerDownHandler);
      host.addEventListener('pointermove', pointerMoveHandler);
      host.addEventListener('pointerup', pointerUpHandler);
      host.addEventListener('pointercancel', pointerUpHandler);
      host.addEventListener('pointerleave', pointerLeaveHandler);
      host.style.cursor = 'grab';

      reducedMotion.addEventListener('change', motionChangeHandler);
      document.addEventListener('visibilitychange', visibilityChangeHandler);

      handleResize();
      setIsReady(true);

      if (!motionReduced) {
        initTimer = setTimeout(() => {
          scheduleNextFrame();
        }, 150);
      } else {
        renderScene(0);
      }
    }

    let initStarted = false;
    let idleCallbackId: number | null = null;
    let fallbackTimerId: ReturnType<typeof setTimeout> | null = null;

    const startInitialization = () => {
      if (initStarted || disposed) return;
      initStarted = true;
      if (idleCallbackId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId);
        idleCallbackId = null;
      }
      if (fallbackTimerId !== null) {
        clearTimeout(fallbackTimerId);
        fallbackTimerId = null;
      }
      cleanupInteractionListeners();
      init();
    };

    const onUserInteraction = () => {
      startInitialization();
    };

    const cleanupInteractionListeners = () => {
      if (host) {
        host.removeEventListener('pointerenter', onUserInteraction);
        host.removeEventListener('pointerdown', onUserInteraction);
      }
    };

    if (host) {
      host.addEventListener('pointerenter', onUserInteraction, { passive: true, once: true });
      host.addEventListener('pointerdown', onUserInteraction, { passive: true, once: true });
    }

    // Defer initialization to browser idle period so it runs cleanly after critical render & hydration
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleCallbackId = (window as any).requestIdleCallback(
        () => {
          startInitialization();
        },
        { timeout: 2500 }
      );
    } else {
      fallbackTimerId = setTimeout(() => {
        startInitialization();
      }, 1200);
    }

    return () => {
      disposed = true;
      cleanupInteractionListeners();
      if (idleCallbackId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (fallbackTimerId !== null) {
        clearTimeout(fallbackTimerId);
      }
      if (initTimer) clearTimeout(initTimer);
      if (frame !== 0) cancelAnimationFrame(frame);
      observer?.disconnect();
      intersectionObserver?.disconnect();

      if (host) {
        if (pointerDownHandler) host.removeEventListener('pointerdown', pointerDownHandler);
        if (pointerMoveHandler) host.removeEventListener('pointermove', pointerMoveHandler);
        if (pointerUpHandler) {
          host.removeEventListener('pointerup', pointerUpHandler);
          host.removeEventListener('pointercancel', pointerUpHandler);
        }
        if (pointerLeaveHandler) host.removeEventListener('pointerleave', pointerLeaveHandler);
      }
      if (motionChangeHandler) reducedMotion.removeEventListener('change', motionChangeHandler);
      if (visibilityChangeHandler) document.removeEventListener('visibilitychange', visibilityChangeHandler);

      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
      texturesToDispose.forEach((t) => t.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[340px] sm:min-h-[420px] lg:min-h-[480px] flex items-center justify-center isolation-isolate select-none">
      {/* Lightweight artistic static fallback - Instant FCP & zero layout shift */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
          isReady ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      >
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
          {/* Soft grounding contact shadow */}
          <div className="absolute -bottom-4 w-52 h-14 bg-[#4b3014]/15 rounded-full blur-xl" />
          
          {/* Pearl-alabaster outer membrane folds */}
          <div className="absolute inset-0 rounded-[44%_56%_50%_50%/52%_48%_52%_48%] bg-gradient-to-tr from-[#ede4d8] via-[#faf7f2] to-[#f4ebe0] shadow-2xl border border-white/70 transform rotate-12" />
          <div className="absolute inset-3 rounded-[52%_48%_55%_45%/45%_55%_45%_55%] bg-gradient-to-br from-white/95 via-[#f8f4ed]/80 to-[#ecdcc8]/60 backdrop-blur-xs transform -rotate-6" />

          {/* Delicate champagne-gold orbital ring */}
          <div className="absolute inset-[-10%] rounded-full border-[1.5px] border-[#dfba76]/70 transform -rotate-25 scale-y-65 shadow-xs" />
          <div className="absolute top-[22%] -right-[6%] w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#f2cc81] to-[#b37c22] shadow-md" />
          <div className="absolute bottom-[20%] -left-[4%] w-4 h-4 rounded-full bg-gradient-to-br from-[#f2cc81] to-[#b37c22] shadow-md" />

          {/* Central liquid amber-gold nucleus */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#f4cd7b] via-[#d5952c] to-[#996016] shadow-xl border border-[#ffe4a0]/40 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 blur-md -translate-x-2 -translate-y-2" />
          </div>
        </div>
      </div>

      <div
        ref={hostRef}
        className={`absolute inset-0 z-0 touch-pan-y transition-opacity duration-500 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
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
