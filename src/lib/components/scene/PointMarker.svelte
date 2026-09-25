<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import {
    BufferAttribute,
    BufferGeometry,
    Color,
    MathUtils,
    PerspectiveCamera,
    Points,
    ShaderMaterial,
    Vector3,
    type Group,
    type Mesh
  } from 'three';
  import { get } from 'svelte/store';
  import { reducedMotion } from '$stores/reducedMotion';
  import { simTime } from '$stores/simTime';
  import { selection } from '$lib/stores/selection';
  import { getWorldPosition } from '$lib/registry/registry';
  import { enterBody, leaveBody } from '$utils/sceneCursor';
  import { markPendingClick } from '$utils/sceneClick';
  import { isPointMarker, type PointMarkerMetadata, type TrackedObject } from '$lib/registry/types';

  /**
   * Point marker renderer: constant-pixel-size dot for spacecraft, landers,
   * minor bodies, and curated Earth satellites — anything too small for a full mesh.
   *
   * Visual:
   *   - Anti-aliased circle via custom fragment shader (PointsMaterial only gives squares).
   *   - When selected, an outer ring expands and fades in a ~1.6s loop without blocking
   *     the dot itself.
   *
   * Constant-pixel sizing is achieved with `gl_PointSize = uPixelSize`
   * in the vertex shader (no `sizeAttenuation`), so the dot stays the
   * same screen size whether the body is 1 or 16,000 scene units away.
   *
   * Labels for point markers are NOT rendered here — they're managed
   * centrally by `LabelLayer.svelte` so the visibility-tier system can
   * decide which labels show at any zoom level.
   *
   * Position comes from the registry walk every frame, identical to
   * PlanetBody.
   */

  let { object: objectProp }: { object: TrackedObject } = $props();

  // svelte-ignore state_referenced_locally
  const object = objectProp;

  if (!isPointMarker(object)) {
    throw new Error(
      `[Stargazer] PointMarker received non-point-marker object: ${object.id} (kind ${object.rendererKind})`
    );
  }
  const meta: PointMarkerMetadata = object.metadata;
  const basePixelSize = meta.pixelSize ?? 11;

  // Click target hit radius in screen pixels. Slightly larger than the
  // visible dot (basePixelSize ~11) so the user gets a forgiving hit
  // area. The actual world-space radius is computed each frame so the
  // sphere stays the same on-screen size whether the body is 1 or
  // 16,000 scene units away. This is critical: a fixed world-space
  // radius would either be invisible-tiny for far bodies or engulf
  // half the scene for close ones, causing the wrong body to win the
  // raycast hit test when click spheres overlap.
  const CLICK_PIXEL_RADIUS = 14;

  function handlePointerDown(event: { stopPropagation: () => void }): void {
    event.stopPropagation();
    markPendingClick(object.id);
  }

  // gl_PointSize has to be large enough to contain the BIGGEST visual
  // (the pulse ring at peak expansion). The dot itself only fills the
  // inner `1 / pulseScale` of that quad. Using ~3.4× gives the pulse
  // room to expand to 3.4× the dot radius before fading out.
  const PULSE_SCALE = 3.4;
  const pointSize = basePixelSize * PULSE_SCALE;

  // ── One-vertex point geometry ─────────────────────────────────────────
  // The vertex sits at (0,0,0) in the group's local frame; the group's
  // position is updated each frame by useTask. One Points instance per
  // body keeps each body independent for selection / per-body coloring.
  const positions = new Float32Array([0, 0, 0]);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.boundingSphere = null;

  // ── Custom shader: circle dot + optional expanding pulse ring ────────
  //
  // Vertex: standard projection, fixed pixel size.
  // Fragment: distance from the point centre. The inner `dotR` radius
  //           is the solid circle. When `uSelected > 0`, an outer ring
  //           grows from `dotR` to 1.0 over the loop, fading from full
  //           to zero opacity. The two layers are combined with `max`
  //           so the dot stays solid while the ring orbits it.

  const vertexShader = /* glsl */ `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    uniform float uPointSize;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uPointSize;
      #include <logdepthbuf_vertex>
    }
  `;

  const fragmentShader = /* glsl */ `
    #include <common>
    #include <logdepthbuf_pars_fragment>

    uniform vec3 uColor;
    uniform float uPulseScale;    // gl_PointSize / dotPixelSize
    uniform float uSelected;      // 0 or 1
    uniform float uPulsePhase;    // 0..1, animated when selected

    void main() {
      #include <logdepthbuf_fragment>

      // Centred coords in the point quad: 0 at centre, 1 at the edge.
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      float r = length(cxy);

      // Solid dot occupies the inner 1/uPulseScale of the quad.
      float dotR = 1.0 / uPulseScale;
      float dotEdge = fwidth(r) * 1.5;
      float dotAlpha = 1.0 - smoothstep(dotR - dotEdge, dotR, r);

      // Pulse ring (only when selected). Starts at the dot's edge and
      // expands to the quad edge while fading to zero opacity. The
      // ring is a thin annulus, ~12% of the radius wide.
      float ringR = mix(dotR, 0.95, uPulsePhase);
      float ringHalfWidth = 0.07;
      float ringInner = ringR - ringHalfWidth;
      float ringOuter = ringR + ringHalfWidth;
      float ringMask =
        smoothstep(ringInner - dotEdge, ringInner, r)
        * (1.0 - smoothstep(ringOuter - dotEdge, ringOuter, r));
      float ringAlpha = (1.0 - uPulsePhase) * uSelected * ringMask * 0.85;

      float a = max(dotAlpha, ringAlpha);
      if (a < 0.01) discard;

      gl_FragColor = vec4(uColor, a);
    }
  `;

  const material = new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(meta.color) },
      uPointSize: { value: pointSize },
      uPulseScale: { value: PULSE_SCALE },
      uSelected: { value: 0 },
      uPulsePhase: { value: 0 }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false
  });

  const pointMesh = new Points(geometry, material);
  pointMesh.frustumCulled = false;

  // ── Per-frame state ───────────────────────────────────────────────────
  let groupRef: Group | undefined = $state();
  let clickTargetRef: Mesh | undefined = $state();
  const worldPos = new Vector3();
  const scratch = new Vector3();
  const cameraToBody = new Vector3();

  // 1.6-second pulse cycle. The phase is a 0..1 ramp; 0 = ring at the
  // dot's edge full-opacity, 1 = ring at the quad edge, fully faded.
  const PULSE_PERIOD_SEC = 1.6;
  let elapsedSec = 0;

  // Pull camera + viewport size out of the Threlte context so we can
  // re-derive the click sphere's world-space radius each frame from
  // the desired pixel size.
  const { camera, size } = useThrelte();

  useTask((dt) => {
    if (!groupRef) return;

    // Position update from the registry walk.
    const pos = getWorldPosition(object.id, get(simTime), worldPos, scratch);
    if (pos) {
      groupRef.position.copy(pos);
      groupRef.visible = true;
    } else {
      groupRef.visible = false;
      return;
    }

    // Per-frame click sphere rescale. We want the sphere to occupy a
    // constant `CLICK_PIXEL_RADIUS` pixels on screen regardless of
    // camera distance. For a perspective camera at distance D from
    // the body with vertical fov φ, a sphere of radius R covers
    //   pixels = (R / D) × (canvasHeight / tan(φ/2))
    // so the inverse is
    //   R = pixels × D × tan(φ/2) / canvasHeight
    if (clickTargetRef) {
      const cam = camera.current;
      cameraToBody.copy(groupRef.position).sub(cam.position);
      const distance = cameraToBody.length();
      let worldRadius: number;
      if (cam instanceof PerspectiveCamera) {
        const tanHalfFov = Math.tan(MathUtils.degToRad(cam.fov) / 2);
        const pixelHeight = size.current.height || 1;
        worldRadius = (CLICK_PIXEL_RADIUS * distance * tanHalfFov) / pixelHeight;
      } else {
        // Orthographic fallback: use a small absolute size.
        worldRadius = 0.01;
      }
      // Floor the radius so a body at the camera origin still has a
      // hittable target. The 0.001 is well below any visible scale.
      clickTargetRef.scale.setScalar(Math.max(0.001, worldRadius));
    }

    // Selection + pulse uniforms.
    const isSelected = get(selection) === object.id;
    material.uniforms.uSelected.value = isSelected ? 1 : 0;
    if (isSelected && !get(reducedMotion)) {
      elapsedSec += dt;
      const phase = (elapsedSec % PULSE_PERIOD_SEC) / PULSE_PERIOD_SEC;
      material.uniforms.uPulsePhase.value = phase;
    } else {
      // Reset so the next selection starts fresh from the dot.
      elapsedSec = 0;
      material.uniforms.uPulsePhase.value = 0;
    }
  });
</script>

<T.Group bind:ref={groupRef}>
  <T is={pointMesh} />
  <!--
    Invisible click target. Unit-radius sphere whose `scale` is rewritten
    each frame so it occupies a constant ~14 pixels on screen, exactly
    matching the visible dot's footprint. Critical: a fixed world-space
    radius would either be invisible-tiny for far bodies or huge enough
    to engulf neighbours for close bodies, causing the wrong body to win
    raycast hits when click spheres overlap.
  -->
  <T.Mesh
    bind:ref={clickTargetRef}
    onpointerdown={handlePointerDown}
    onpointerover={() => enterBody(object.name)}
    onpointerout={() => leaveBody()}
  >
    <T.SphereGeometry args={[1, 8, 8]} />
    <T.MeshBasicMaterial transparent opacity={0} depthWrite={false} />
  </T.Mesh>
</T.Group>
