// biocell.worker.ts - Off-thread geometry generation for MediSlot 3D Bio-Cell Sculpture
// Computes membrane vertices, concentric fold ridges, colors, and UV coordinates off the main UI thread.

export interface BioCellGeometryConfig {
  nR?: number;
  nRim?: number;
  nBack?: number;
  nTheta?: number;
}

export interface BioCellGeometryData {
  positions: Float32Array;
  colors: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function generateBioCellGeometryData(config: BioCellGeometryConfig = {}): BioCellGeometryData {
  const nR = config.nR ?? 48;
  const nRim = config.nRim ?? 12;
  const nBack = config.nBack ?? 36;
  const nTheta = config.nTheta ?? 96;
  const totalRings = nR + nRim + nBack + 1;

  const vertices: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const getRadius = (theta: number) => {
    const base = 2.05;
    const lobe1 = 0.28 * Math.cos(2 * theta - 0.40);
    const lobe2 = 0.16 * Math.sin(3 * theta + 0.50);
    const lobe3 = 0.08 * Math.cos(theta + 1.20);
    const lobe4 = 0.04 * Math.sin(5 * theta - 0.20);
    return base + lobe1 + lobe2 + lobe3 + lobe4;
  };

  const getFrontZ = (s: number, theta: number) => {
    const centerPocket = -0.65 * Math.pow(Math.max(0, 1.0 - s * 2.3), 1.8);
    const ridgePeak = 0.47;
    const ridgeDist = Math.abs(s - ridgePeak) / 0.16;
    const innerTerrace =
      0.32 *
      Math.exp(-ridgeDist * ridgeDist * 2.2) *
      (1.0 + 0.18 * Math.cos(2 * theta - 0.50) + 0.08 * Math.sin(theta));
    const valleyCenter = 0.65;
    const valleyDist = Math.abs(s - valleyCenter) / 0.12;
    const foldGroove = -0.16 * Math.exp(-valleyDist * valleyDist * 3.0);
    const outerRimFlare =
      0.26 *
      Math.pow(smoothstep(0.63, 1.0, s), 1.25) *
      (1.0 + 0.11 * Math.cos(2 * theta - 0.80) + 0.04 * Math.sin(3 * theta + 0.30));

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
      const rimThickness = 0.12 * (1.0 + 0.03 * Math.cos(theta));

      let x = 0;
      let y = 0;
      let z = 0;
      let r = 1.0, g = 1.0, b = 1.0;

      if (isRim) {
        const curR = baseR + 0.052 * Math.sin(rimAlpha);
        x = curR * Math.cos(theta);
        y = curR * Math.sin(theta);
        z = frontZRim - rimThickness * 0.5 * (1.0 - Math.cos(rimAlpha));
        r = 0.93; g = 0.915; b = 0.895;
      } else if (isFront) {
        const curR = rFrac * baseR;
        x = curR * Math.cos(theta);
        y = curR * Math.sin(theta);
        z = getFrontZ(rFrac, theta);

        if (rFrac < 0.36) {
          const warmth = 1.0 - (rFrac / 0.36);
          r = 0.98 - warmth * 0.01;
          g = 0.94 - warmth * 0.03;
          b = 0.89 - warmth * 0.07;
        } else if (rFrac < 0.56) {
          const ridge = 1.0 - Math.abs((rFrac - 0.47) / 0.09);
          r = 0.97 + Math.max(0, ridge) * 0.025;
          g = 0.955 + Math.max(0, ridge) * 0.025;
          b = 0.935 + Math.max(0, ridge) * 0.025;
        } else if (rFrac < 0.73) {
          r = 0.925; g = 0.910; b = 0.885;
        } else {
          r = 0.985; g = 0.975; b = 0.96;
        }
      } else {
        const curR = rFrac * baseR;
        x = curR * Math.cos(theta);
        y = curR * Math.sin(theta);
        const domeDepth = 0.50 * Math.pow(Math.max(0, 1.0 - rFrac * rFrac), 0.72);
        z = frontZRim - rimThickness - domeDepth + 0.03 * Math.cos(theta) * (1.0 - rFrac);
        r = 0.92; g = 0.905; b = 0.88;
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

  return {
    positions: new Float32Array(vertices),
    colors: new Float32Array(colors),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  };
}

// Web Worker message listener
if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = (e: MessageEvent<BioCellGeometryConfig>) => {
    const data = generateBioCellGeometryData(e.data || {});
    // Transfer ArrayBuffers zero-copy
    (self as any).postMessage(
      {
        positions: data.positions,
        colors: data.colors,
        uvs: data.uvs,
        indices: data.indices,
      },
      [
        data.positions.buffer,
        data.colors.buffer,
        data.uvs.buffer,
        data.indices.buffer,
      ]
    );
  };
}

