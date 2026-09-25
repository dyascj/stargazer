<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import {
    BufferAttribute,
    BufferGeometry,
    Color,
    DynamicDrawUsage,
    NormalBlending,
    PerspectiveCamera,
    Points,
    ShaderMaterial
  } from 'three';
  import type { ObjectType } from '$lib/registry/types';
  import { selection } from '$stores/selection';
  import { introComplete } from '$stores/scene';
  import { reducedMotion } from '$stores/reducedMotion';
  import { BODIES, BODY_COUNT, indexOf, positions } from './bodyState';
  import { hooks, markerSize, screen, updateOverlay } from './overlay';

  /**
   * One draw call for every body's constant-size marker, positioned relative
   * to the camera: a crisp dot with a soft glow, tinted by kind. The selected
   * body turns accent cyan inside a thin ring that springs in and breathes.
   */

  const TINT: Partial<Record<ObjectType, string>> = {
    star: '#fff1d6',
    planet: '#f0f0f0',
    'dwarf-planet': '#d8cfc4',
    'trans-neptunian': '#cbc2b7',
    moon: '#c4c4c4',
    asteroid: '#b8ada0',
    comet: '#d3ebf6',
    'earth-satellite': '#e6edf3',
    spacecraft: '#d4ecf5',
    lander: '#d4ecf5'
  };
  const ACCENT = new Color('#00b2ff');
  const baseColors = BODIES.map((body) => new Color(TINT[body.type] ?? '#d4d4d4'));
  // Worlds drawn as textured spheres read as selected by their label; the ring is for small things.
  const ringLimit = Float64Array.from(BODIES, (body) =>
    body.rendererKind === 'planet-body' ? 10 : 64
  );

  const relative = new Float32Array(BODY_COUNT * 3);
  const colors = new Float32Array(BODY_COUNT * 3);
  const alphas = new Float32Array(BODY_COUNT);
  const sizes = new Float32Array(BODY_COUNT);
  const rings = new Float32Array(BODY_COUNT);
  const geometry = new BufferGeometry();
  const attribute = (array: Float32Array, size: number) =>
    new BufferAttribute(array, size).setUsage(DynamicDrawUsage);
  const positionAttribute = attribute(relative, 3);
  const colorAttribute = attribute(colors, 3);
  const alphaAttribute = attribute(alphas, 1);
  const sizeAttribute = attribute(sizes, 1);
  const ringAttribute = attribute(rings, 1);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('aColor', colorAttribute);
  geometry.setAttribute('aAlpha', alphaAttribute);
  geometry.setAttribute('aSize', sizeAttribute);
  geometry.setAttribute('aRing', ringAttribute);

  const material = new ShaderMaterial({
    uniforms: { uPixelRatio: { value: 1 }, uAccent: { value: ACCENT }, uRingAlpha: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aAlpha;
      attribute float aSize;
      attribute float aRing;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vSize;
      varying float vExtent;
      varying float vRing;
      void main() {
        vColor = aColor;
        vAlpha = aAlpha;
        vSize = aSize;
        vRing = aRing;
        vExtent = aRing > 0.0 ? aRing * 2.0 + 6.0 : aSize + 10.0;
        gl_PointSize = vExtent * uPixelRatio;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        if (aAlpha <= 0.004 && aRing <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uAccent;
      uniform float uRingAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vSize;
      varying float vExtent;
      varying float vRing;
      void main() {
        float r = length(gl_PointCoord - 0.5) * vExtent;
        float edge = vSize * 0.5;
        float disc = (1.0 - smoothstep(edge - 0.6, edge + 0.6, r)) * vAlpha;
        float glow = exp(-max(r - edge, 0.0) / 2.2) * vAlpha * 0.28;
        float ring = vRing > 0.0 ? (1.0 - smoothstep(0.3, 1.0, abs(r - vRing))) * uRingAlpha : 0.0;
        float light = max(disc, glow);
        vec3 color = vColor * light + uAccent * ring;
        float alpha = max(light, ring);
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(color / alpha, alpha);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: NormalBlending
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 10;

  const { camera, size, renderer } = useThrelte();
  let selectedIndex = $derived(indexOf($selection));
  let selectedAt = 0;
  let lastSelected = -2;
  let fade = 0;

  useTask(
    'overlay',
    (delta) => {
      const cam = camera.current as PerspectiveCamera;
      const { width, height } = size.current;
      updateOverlay(cam, width, height, selectedIndex, hooks.hovered);
      points.position.copy(cam.position);
      material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      // Markers arrive once the opening camera move settles.
      fade = $introComplete ? Math.min(1, fade + delta / 0.6) : 0;
      if (selectedIndex !== lastSelected) {
        lastSelected = selectedIndex;
        selectedAt = performance.now();
      }
      const t = (performance.now() - selectedAt) / 1000;
      const still = $reducedMotion;
      const spring = still ? 1 : 1 + 0.5 * Math.exp(-7 * t) * Math.cos(11 * t);
      material.uniforms.uRingAlpha.value =
        fade * (still ? 0.9 : Math.min(1, t * 5) * (0.78 + 0.17 * Math.cos(t * 2.4)));
      for (let i = 0; i < BODY_COUNT; i++) {
        const p = positions[i];
        relative[i * 3] = p.x - cam.position.x;
        relative[i * 3 + 1] = p.y - cam.position.y;
        relative[i * 3 + 2] = p.z - cam.position.z;
        const color = i === selectedIndex ? ACCENT : baseColors[i];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        alphas[i] = screen.markerAlpha[i] * fade * (i === hooks.hovered ? 1.15 : 1);
        sizes[i] = markerSize[i];
        rings[i] =
          i === selectedIndex && screen.depth[i] > 0 && screen.radius[i] < ringLimit[i]
            ? (Math.max(screen.radius[i], markerSize[i] / 2) + 6) * spring
            : 0;
      }
      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;
      alphaAttribute.needsUpdate = true;
      sizeAttribute.needsUpdate = true;
      ringAttribute.needsUpdate = true;
      hooks.afterFrame?.();
    },
    { after: 'camera' }
  );
</script>

<T is={points} />
