<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { prefersReducedMotion } from 'svelte/motion';
  import {
    CircleGeometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    RingGeometry,
    Vector3,
    type PerspectiveCamera
  } from 'three';
  import { EARTH_RADIUS } from '$lib/scene-config';
  import { simTime } from '$stores/simTime';
  import { geographicToEarthLocal, geographicToInertialDirection } from '$utils/earth';
  import { positionOf } from './bodyState';
  import { lens } from './overlay';

  /**
   * A launch pad's marker: a dot with rings pulsing out of it, a constant size
   * on screen. It lives in Earth's rotating frame, so it turns with the ground,
   * and hides once the pad rotates past the horizon or Earth shrinks to a dot.
   */

  let { latitude, longitude }: { latitude: number; longitude: number } = $props();

  const COLOR = 0x5cd5ff; // --accent-strong
  const DOT_PX = 4;
  const RING_PX = 36;
  const PERIOD_S = 2.4;
  const MIN_EARTH_PX = 24;

  const material = (opacity: number) =>
    new MeshBasicMaterial({
      color: COLOR,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false
    });
  const dot = new Mesh(new CircleGeometry(1, 32), material(1));
  const ringGeometry = new RingGeometry(0.82, 1, 64);
  const rings = [0, 0.5].map((offset) => ({ mesh: new Mesh(ringGeometry, material(0)), offset }));
  const group = new Group();
  for (const mesh of [dot, ...rings.map((ring) => ring.mesh)]) {
    mesh.renderOrder = 3;
    group.add(mesh);
  }

  const up = new Vector3();
  const site = new Vector3();
  const toCamera = new Vector3();
  const { camera, size } = useThrelte();
  let clock = 0;

  $effect(() => {
    geographicToEarthLocal(latitude, longitude, up);
    group.position.copy(up).multiplyScalar(EARTH_RADIUS);
    group.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), up);
  });

  useTask(
    (delta) => {
      const earth = positionOf('earth');
      const cam = camera.current as PerspectiveCamera;
      if (!earth) return void (group.visible = false);
      geographicToInertialDirection(latitude, longitude, up, $simTime);
      site.copy(earth).addScaledVector(up, EARTH_RADIUS);
      toCamera.copy(cam.position).sub(site);
      const distance = toCamera.length();
      const { focal } = lens(cam, size.current.width, size.current.height);
      const earthPx = (focal * EARTH_RADIUS) / cam.position.distanceTo(earth);
      group.visible = toCamera.dot(up) > 0 && earthPx > MIN_EARTH_PX;
      if (!group.visible) return;

      const perPixel = distance / focal;
      dot.scale.setScalar(DOT_PX * perPixel);
      clock = (clock + delta / PERIOD_S) % 1;
      for (const { mesh, offset } of rings) {
        // Reduced motion keeps one still ring instead of the pulse.
        const phase = prefersReducedMotion.current ? (offset ? 1 : 0.55) : (clock + offset) % 1;
        mesh.scale.setScalar((DOT_PX + (RING_PX - DOT_PX) * phase) * perPixel);
        (mesh.material as MeshBasicMaterial).opacity = 0.85 * (1 - phase) ** 1.6;
      }
    },
    { after: 'camera' }
  );
</script>

<T is={group} />
