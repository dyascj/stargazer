<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { DirectionalLight, Matrix4, Vector3, type Group } from 'three';
  import { onMount } from 'svelte';
  import { EARTH_RADIUS, KM_TO_SCENE } from '$lib/scene-config';
  import { iss } from '$stores/iss';
  import { simTime } from '$stores/simTime';
  import { ecfKmToEarthLocal } from '$utils/earth';
  import { positionOf } from './bodyState';

  /**
   * The ISS at its true 109 m span, mounted in Earth's rotating frame. The
   * truss lies along the orbit normal, the modules point along the velocity,
   * and the solar arrays extend toward and away from Earth; the arrays'
   * sun-tracking rotation is not modeled. Far away, the shared marker stands in.
   *
   * Model units: the truss is 0.062 long.
   */

  const SCALE = (0.109 * KM_TO_SCENE) / 0.062;
  const truss = '#c9c9c9';
  const module = '#ececec';
  const array = '#23262b';
  const radiator = '#f2f2f2';
  const wings = [-0.026, -0.014, 0.014, 0.026];

  let group: Group | undefined = $state();
  const position = new Vector3();
  const ahead = new Vector3();
  const up = new Vector3();
  const normal = new Vector3();
  const forward = new Vector3();
  const basis = new Matrix4();
  const date = new Date();
  const world = new Vector3();
  const fromEarth = new Vector3();

  // Sunlight for the model, switched off while the station is in Earth's shadow.
  const sunlight = new DirectionalLight(0xffffff, 2.4);
  const { scene } = useThrelte();
  onMount(() => {
    scene.add(sunlight, sunlight.target);
    return () => void scene.remove(sunlight, sunlight.target);
  });

  useTask(
    () => {
      if (!group) return;
      const now = $simTime.getTime();
      date.setTime(now);
      const state = iss.at(date);
      date.setTime(now + 1000);
      const next = state && iss.at(date);
      group.visible = !!state && !!next;
      if (!state || !next) return;
      ecfKmToEarthLocal(next.ecfKm, ahead);
      ecfKmToEarthLocal(state.ecfKm, position);
      group.position.copy(position);
      up.copy(position).normalize();
      normal.crossVectors(position, ahead).normalize();
      forward.crossVectors(normal, up);
      group.quaternion.setFromRotationMatrix(basis.makeBasis(normal, up, forward));

      group.getWorldPosition(world);
      sunlight.target.position.copy(world);
      const earth = positionOf('earth');
      if (!earth) return;
      fromEarth.copy(world).sub(earth);
      const along = -fromEarth.dot(world) / world.length();
      const offAxis = Math.sqrt(Math.max(fromEarth.lengthSq() - along * along, 0));
      sunlight.intensity = along < 0 && offAxis < EARTH_RADIUS ? 0 : 2.4;
    },
    { after: 'bodies' }
  );
</script>

<T.Group bind:ref={group} visible={false}>
  <T.Group scale={SCALE}>
    <T.Mesh>
      <T.BoxGeometry args={[0.062, 0.0035, 0.0035]} />
      <T.MeshStandardMaterial color={truss} metalness={0.6} roughness={0.4} />
    </T.Mesh>
    {#each wings as x (x)}
      {#each [0.014, -0.014] as y (y)}
        <T.Mesh position={[x, y, 0]}>
          <T.BoxGeometry args={[0.0025, 0.022, 0.014]} />
          <T.MeshStandardMaterial color={array} metalness={0.3} roughness={0.35} />
        </T.Mesh>
      {/each}
    {/each}
    {#each [0.012, -0.012] as z (z)}
      <T.Mesh position={[0, 0, z]}>
        <T.BoxGeometry args={[0.012, 0.001, 0.011]} />
        <T.MeshStandardMaterial color={radiator} metalness={0.1} roughness={0.7} />
      </T.Mesh>
    {/each}
    <T.Mesh rotation.x={Math.PI / 2}>
      <T.CylinderGeometry args={[0.0042, 0.0042, 0.022, 16]} />
      <T.MeshStandardMaterial color={module} metalness={0.3} roughness={0.5} />
    </T.Mesh>
    {#each [-0.006, 0.006] as x (x)}
      {#each [0.004, -0.004] as z (z)}
        <T.Mesh position={[x, -0.0006, z]} rotation.x={Math.PI / 2}>
          <T.CylinderGeometry args={[0.0034, 0.0034, 0.014, 16]} />
          <T.MeshStandardMaterial color={module} metalness={0.3} roughness={0.5} />
        </T.Mesh>
      {/each}
    {/each}
  </T.Group>
</T.Group>
