<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { HTML } from '@threlte/extras';
  import { MathUtils, PerspectiveCamera, Vector3, type Group } from 'three';
  import { get } from 'svelte/store';
  import { simTime } from '$stores/simTime';
  import { selection, SOLAR_SYSTEM_VIEW } from '$lib/stores/selection';
  import { getById, getWorldPosition } from '$lib/registry/registry';
  import { isPlanetBody } from '$lib/registry/types';

  /**
   * NASA Eyes-style four-corner selection bracket.
   *
   * Mounted inside the Canvas so it can read the camera matrix and the
   * canvas size directly. A `<T.Group>` rides each frame to the
   * selected body's world position; a Threlte `<HTML>` (anchored at
   * that group, transform=false, center=true) places a div at the
   * body's projected screen position. The div contains an SVG with
   * four L-shaped corner brackets, sized to fit the body's
   * screen-space radius.
   *
   * Visual:
   *   - Brackets are blue with a soft glow.
   *   - The whole reticle fades in / out with `opacity` + a tiny
   *     `scale` bounce on selection change.
   *   - When in solar-system view, no reticle renders.
   *
   * Sizing:
   *   - For planet bodies, the body's actual radius (meta.radius)
   *     is projected to pixels via the perspective math.
   *   - For point markers, satellites and the Sun, we fall back to
   *     a small constant pixel radius (matching the dot's hit area)
   *     since these don't have a meaningful world-space radius.
   *   - The reticle padding adds ~14 px on each side so the brackets
   *     hug the body without touching it.
   */

  const { camera, size } = useThrelte();

  const worldPos = new Vector3();
  const scratch = new Vector3();
  const cameraToBody = new Vector3();

  let groupRef: Group | undefined = $state();
  let pixelRadius = $state(40);
  let visible = $state(false);
  let selectedId = $state<string | null>(null);

  // Constant fall-back radius for non-planet bodies (point markers,
  // satellites, the Sun's tiny click-in core when fully zoomed out).
  // The body's dot is ~11 px so the reticle sits comfortably outside.
  const POINT_MARKER_PIXEL_RADIUS = 22;
  // Padding (in px) added to the body's projected radius before the
  // reticle is sized — keeps the brackets from touching the surface.
  const RETICLE_PADDING_PX = 16;
  // Smoothing on the radius so it transitions cleanly when flying to
  // a body of a different size.
  const RADIUS_SMOOTH_LAMBDA = 0.22;

  useTask(() => {
    const sel = get(selection);
    if (sel === SOLAR_SYSTEM_VIEW) {
      visible = false;
      selectedId = null;
      return;
    }
    const obj = getById(sel);
    if (!obj) {
      visible = false;
      selectedId = null;
      return;
    }

    const pos = getWorldPosition(obj.id, get(simTime), worldPos, scratch);
    if (!pos || !groupRef) {
      visible = false;
      return;
    }
    groupRef.position.copy(pos);

    // Compute the body's screen-space radius from the perspective math.
    // Planet bodies use their actual world radius; everything else falls
    // back to the constant pixel radius.
    const cam = camera.current;
    cameraToBody.copy(pos).sub(cam.position);
    const distance = cameraToBody.length();

    let projectedPixelRadius: number;
    if (cam instanceof PerspectiveCamera && isPlanetBody(obj)) {
      const tanHalfFov = Math.tan(MathUtils.degToRad(cam.fov) / 2);
      const pixelHeight = size.current.height || 1;
      // pixels = (worldRadius / distance) × (height / (2 × tan(fov/2)))
      projectedPixelRadius = (obj.metadata.radius / distance) * (pixelHeight / (2 * tanHalfFov));
    } else {
      projectedPixelRadius = POINT_MARKER_PIXEL_RADIUS;
    }

    // Clamp so very far / very close bodies still get a sensible
    // reticle. Lower bound: tiny dot still gets a visible reticle.
    // Upper bound: a body filling the screen doesn't get a reticle
    // bigger than the viewport.
    const minPx = 22;
    const maxPx = (size.current.height || 1) * 0.45;
    projectedPixelRadius = Math.max(minPx, Math.min(maxPx, projectedPixelRadius));

    // Smooth the radius so size changes feel mechanical, not snappy.
    pixelRadius += (projectedPixelRadius - pixelRadius) * RADIUS_SMOOTH_LAMBDA;

    // Reset the smoother on first selection of a new body so the
    // reticle doesn't slide in from the previous body's size.
    if (sel !== selectedId) {
      pixelRadius = projectedPixelRadius;
      selectedId = sel;
    }

    visible = true;
  });

  // Total pixel size of the reticle SVG (diameter + padding on both sides)
  let svgSize = $derived(Math.round((pixelRadius + RETICLE_PADDING_PX) * 2));
</script>

<T.Group bind:ref={groupRef}>
  <HTML transform={false} pointerEvents="none" center zIndexRange={[35, 0]}>
    <div
      class="reticle"
      class:visible
      style="width: {svgSize}px; height: {svgSize}px;"
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="reticle-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g
          stroke="rgba(232,68,30,0.9)"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
          filter="url(#reticle-glow)"
        >
          <!-- top-left -->
          <path d="M 4 22 L 4 4 L 22 4" />
          <!-- top-right -->
          <path d="M 78 4 L 96 4 L 96 22" />
          <!-- bottom-right -->
          <path d="M 96 78 L 96 96 L 78 96" />
          <!-- bottom-left -->
          <path d="M 22 96 L 4 96 L 4 78" />
        </g>
      </svg>
    </div>
  </HTML>
</T.Group>

<style>
  .reticle {
    position: relative;
    opacity: 0;
    transform: scale(0.85);
    transition-property: opacity, transform;
    transition-duration: 240ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
    pointer-events: none;
  }
  .reticle.visible {
    opacity: 1;
    transform: scale(1);
  }
  .reticle svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
</style>
