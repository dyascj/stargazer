<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { MathUtils, Matrix4, PerspectiveCamera, Vector3, type Group, type Mesh } from 'three';
  import type { SatelliteStore } from '$stores/satelliteFactory';
  import { get } from 'svelte/store';
  import { simTime } from '$stores/simTime';
  import { latLonAltToVec3 } from '$utils/coords';
  import { EARTH_RADIUS, EARTH_RADIUS_KM } from '$lib/scene-config';
  import { enterBody, leaveBody } from '$utils/sceneCursor';
  import { markPendingClick } from '$utils/sceneClick';
  import { getById } from '$lib/registry/registry';
  import IssModel from './IssModel.svelte';

  /**
   * Click target hit radius in screen pixels. Same convention as
   * PointMarker — see PointMarker.svelte for the rationale.
   */
  const CLICK_PIXEL_RADIUS = 14;

  /**
   * Generic satellite marker. Source-agnostic — give it any SatelliteStore
   * (wheretheiss-backed for ISS, SGP4-backed for Tiangong, anything else
   * down the line) and a label string, and it positions itself + orients
   * its model along the velocity vector.
   *
   * The 3D model is currently the parametric ISS truss (since both ISS
   * and Tiangong have the same structural pattern of central body +
   * solar arrays at this resolution). We can swap to per-satellite
   * models later if we want station-specific shapes.
   */

  let { store, bodyId }: { store: SatelliteStore; bodyId: string } = $props();

  function handlePointerDown(event: { stopPropagation: () => void }): void {
    event.stopPropagation();
    markPendingClick(bodyId);
  }

  // Look up the registry name once at mount so the hover tooltip can
  // show "International Space Station" instead of just the id.
  // svelte-ignore state_referenced_locally
  const bodyName = getById(bodyId)?.name ?? bodyId;

  // The store prop is fixed for the lifetime of this instance — each
  // SatelliteMarker is mounted with one specific store and never swapped.
  // svelte-ignore state_referenced_locally
  const data = store.data;

  const target = new Vector3();
  const current = new Vector3();
  const future = new Vector3();

  // Orientation basis vectors. The marker is mounted as a child of the
  // rotating Earth group, so all positions and orientations live in
  // Earth-local (Earth-fixed) coordinates — the same math as the
  // geocentric scene with Earth at local origin.
  const forward = new Vector3();
  const radialUp = new Vector3();
  const side = new Vector3();
  const yAxis = new Vector3();
  const orientationMatrix = new Matrix4();

  let groupRef: Group | undefined = $state();
  let clickTargetRef: Mesh | undefined = $state();
  const worldPosScratch = new Vector3();
  const cameraToBody = new Vector3();

  // Camera + viewport size from Threlte context for the per-frame
  // screen-space click sphere rescale.
  const { camera, size } = useThrelte();

  useTask(() => {
    if (!groupRef) return;
    const state = store.at(get(simTime));
    groupRef.visible = !!state;
    if (!state) return;

    // Earth-fixed lat/lon converted to local Earth-relative Cartesian.
    // The parent group's GMST rotation transforms this into inertial
    // space automatically.
    const [x, y, z] = latLonAltToVec3(
      state.latitude,
      state.longitude,
      state.altitudeKm,
      EARTH_RADIUS,
      EARTH_RADIUS_KM
    );
    target.set(x, y, z);

    current.copy(target);
    groupRef.position.copy(current);

    // Velocity-aligned orientation, computed in local Earth frame.
    // The parent rotation will compose this with Earth's GMST rotation
    // to give the right world-space orientation.
    const next = store.at(new Date(get(simTime).getTime() + 1000));
    if (next) {
      future.set(
        ...latLonAltToVec3(
          next.latitude,
          next.longitude,
          next.altitudeKm,
          EARTH_RADIUS,
          EARTH_RADIUS_KM
        )
      );
      forward.copy(future).sub(current);
    } else forward.set(0, 0, 0);
    if (forward.lengthSq() > 1e-12) {
      forward.normalize();
      radialUp.copy(current).normalize();
      yAxis.copy(radialUp).addScaledVector(forward, -radialUp.dot(forward)).normalize();
      side.crossVectors(forward, yAxis);
      orientationMatrix.makeBasis(forward, yAxis, side);
      groupRef.quaternion.setFromRotationMatrix(orientationMatrix);
    }

    // Per-frame click sphere rescale to screen-space pixels. Same
    // approach as PointMarker. groupRef is nested inside Earth's
    // rotating frame, so we need its WORLD position for the camera
    // distance calculation; getWorldPosition walks the parent chain.
    if (clickTargetRef) {
      groupRef.getWorldPosition(worldPosScratch);
      const cam = camera.current;
      cameraToBody.copy(worldPosScratch).sub(cam.position);
      const distance = cameraToBody.length();
      let worldRadius: number;
      if (cam instanceof PerspectiveCamera) {
        const tanHalfFov = Math.tan(MathUtils.degToRad(cam.fov) / 2);
        const pixelHeight = size.current.height || 1;
        worldRadius = (CLICK_PIXEL_RADIUS * distance * tanHalfFov) / pixelHeight;
      } else {
        worldRadius = 0.01;
      }
      clickTargetRef.scale.setScalar(Math.max(0.001, worldRadius));
    }
  });
</script>

{#if $data}
  <T.Group bind:ref={groupRef}>
    <IssModel />
    <!--
      Invisible click target. Sized to comfortably contain the
      parametric ISS model (~0.062 long across the truss). The user
      clicks anywhere on the visible model and the raycaster picks up
      this transparent sphere first. Pass-through to the registry id
      for selection.
    -->
    <T.Mesh
      bind:ref={clickTargetRef}
      onpointerdown={handlePointerDown}
      onpointerover={() => enterBody(bodyName)}
      onpointerout={() => leaveBody()}
    >
      <T.SphereGeometry args={[1, 8, 8]} />
      <T.MeshBasicMaterial transparent opacity={0} depthWrite={false} />
    </T.Mesh>
  </T.Group>
{/if}
