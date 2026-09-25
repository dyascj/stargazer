<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { Line2 } from 'three/examples/jsm/lines/Line2.js';
  import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
  import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
  import { get } from 'svelte/store';
  import { simTime } from '$stores/simTime';
  import { reducedMotion } from '$stores/reducedMotion';
  import { selection } from '$lib/stores/selection';
  import { getOrbitEllipsePoints, PLANETS } from '$utils/helio';

  /**
   * Closed-curve orbit ellipse for a planet, drawn as a fat line at the
   * planet's true Keplerian orbit. Computed once on mount + refreshed
   * occasionally to account for slow precession of the orbital elements.
   *
   * `planetKey` is a string id matching a key in the helio.ts PLANETS
   * dict — the registry's body ids ('mercury', 'venus', 'earth',
   * 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto') all
   * line up. Unknown keys are silently skipped.
   */

  let {
    planetKey,
    color = 0xffffff,
    opacity = 0.45
  }: { planetKey: string; color?: number; opacity?: number } = $props();

  // Each OrbitEllipse is mounted with one specific planetKey for its
  // lifetime, so we capture into a stable local to silence Svelte's
  // reactive-prop warning.
  // svelte-ignore state_referenced_locally
  const planetKeyStable = planetKey;

  // Skip if the planet doesn't have an entry in helio.ts (e.g. moons,
  // satellites — these don't get heliocentric orbit ellipses).
  if (!(planetKeyStable in PLANETS)) {
    throw new Error(
      `[Stargazer] OrbitEllipse received unknown planetKey: ${planetKeyStable}. ` +
        `Mount this component only for bodies whose ids match a helio.ts PLANETS key.`
    );
  }

  const { size } = useThrelte();
  const SAMPLES = 256;

  // Props are fixed for the lifetime of an OrbitEllipse instance — each
  // is mounted with one specific planet and never re-keyed.
  const initialPlanet = planetKeyStable as keyof typeof PLANETS;
  // svelte-ignore state_referenced_locally
  const initialColor = color;
  // svelte-ignore state_referenced_locally
  const initialOpacity = opacity;

  const geometry = new LineGeometry();
  geometry.setPositions(getOrbitEllipsePoints(initialPlanet, SAMPLES, get(simTime)));

  // Inner orbits slightly thicker for readability at solar system zoom;
  // outer orbits thinner so they don't dominate the scene.
  const semiMajorAU = (PLANETS[planetKeyStable] as { a: number[] }).a[0];
  const lineWidth = Math.max(0.65, 1.15 - semiMajorAU * 0.01);

  const material = new LineMaterial({
    color: initialColor,
    linewidth: lineWidth,
    transparent: true,
    opacity: initialOpacity,
    depthWrite: false
  });
  if (typeof window !== 'undefined') {
    material.resolution.set(window.innerWidth, window.innerHeight);
  }

  const line = new Line2(geometry, material);
  line.frustumCulled = false;
  line.computeLineDistances();

  let lastBuiltAt = get(simTime).getTime();
  let lastResW = 0;
  let lastResH = 0;

  // Selection-aware opacity. The currently selected body's orbit
  // brightens to ~1.6x its base; every other orbit dims to ~0.35x
  // so the selection's context jumps out. Smoothed each frame so
  // transitions are tactile rather than snap.
  const HIGHLIGHT_BOOST = 1.7;
  const DIM_FACTOR = 0.35;
  const SMOOTH_LAMBDA = 0.18;
  let currentOpacity = initialOpacity;

  // Orbit draw animation: when this body becomes the selection, the
  // orbit line "draws itself" from 0 to full over DRAW_DURATION_MS.
  // Animates the instanceCount on the Line2's instanced geometry.
  const DRAW_DURATION_MS = 800;
  let drawAnimStart = 0;
  let drawAnimActive = false;
  let prevSelected = false;
  const instanceCount =
    (geometry as unknown as { instanceCount?: number }).instanceCount ?? SAMPLES;

  useTask(() => {
    if (typeof window !== 'undefined') {
      const w = size.current.width;
      const h = size.current.height;
      if (w !== lastResW || h !== lastResH) {
        material.resolution.set(w, h);
        lastResW = w;
        lastResH = h;
      }
    }
    if (Math.abs(get(simTime).getTime() - lastBuiltAt) > 86400000 * 30) {
      geometry.setPositions(getOrbitEllipsePoints(initialPlanet, SAMPLES, get(simTime)));
      line.computeLineDistances();
      geometry.computeBoundingSphere();
      lastBuiltAt = get(simTime).getTime();
    }

    // Selection-aware emphasis. Compare against the body id; the
    // OrbitEllipse is mounted with planetKey === body id.
    const sel = get(selection);
    const isSelected = sel === planetKeyStable;

    let target = initialOpacity;
    if (isSelected) {
      target = Math.min(1, initialOpacity * HIGHLIGHT_BOOST);
    } else if (sel && sel !== 'solarSystem') {
      target = initialOpacity * DIM_FACTOR;
    }
    currentOpacity += (target - currentOpacity) * SMOOTH_LAMBDA;
    material.opacity = currentOpacity;

    // Orbit draw animation: when this body is newly selected, animate
    // the line from 0 segments to full over DRAW_DURATION_MS.
    if (isSelected && !prevSelected && !get(reducedMotion)) {
      drawAnimActive = true;
      drawAnimStart = performance.now();
    }
    prevSelected = isSelected;

    if (drawAnimActive) {
      const dt = performance.now() - drawAnimStart;
      const progress = Math.min(1, dt / DRAW_DURATION_MS);
      // Ease-out for a decelerating draw effect
      const eased = 1 - Math.pow(1 - progress, 3);
      const count = Math.max(1, Math.floor(eased * instanceCount));
      (geometry as unknown as { instanceCount: number }).instanceCount = count;
      if (progress >= 1) {
        drawAnimActive = false;
        (geometry as unknown as { instanceCount: number }).instanceCount = instanceCount;
      }
    }
  });
</script>

<T is={line} />
