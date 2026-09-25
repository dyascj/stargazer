<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import {
    AdditiveBlending,
    BackSide,
    Color,
    DoubleSide,
    FrontSide,
    MathUtils,
    PerspectiveCamera,
    Quaternion,
    ShaderMaterial,
    Vector2,
    Vector3,
    type Group,
    type Texture
  } from 'three';
  import type { Snippet } from 'svelte';
  import { get } from 'svelte/store';
  import { KM_TO_SCENE } from '$lib/scene-config';
  import { getById } from '$lib/registry/registry';
  import { isPlanetBody, type PlanetBodyMetadata, type TrackedObject } from '$lib/registry/types';
  import { brightLighting } from '$stores/ui';
  import { simTime } from '$stores/simTime';
  import { getGmstRadians } from '$utils/earth';
  import { poleQuaternion } from '$utils/pole';
  import { iauRotationRad, tidalLockQuaternion } from '$utils/rotation';
  import { indexOf, positions, valid } from './bodyState';
  import {
    atmosphereFragment,
    atmosphereVertex,
    ringFragment,
    ringVertex,
    surfaceFragment,
    surfaceVertex
  } from './shaders';
  import { loadTexture, UNIT_SPHERE } from './textures';

  /**
   * Any resolved world: planet, dwarf planet, or moon, at true size.
   *
   *   position group  (world position + pole orientation; rings live here)
   *     spin group    (daily rotation: GMST for Earth, IAU W elsewhere)
   *       surface, and children in the body-fixed frame (Earth's satellites)
   *     atmosphere shell
   */

  let { object, children }: { object: TrackedObject; children?: Snippet } = $props();
  // svelte-ignore state_referenced_locally
  const body = object;
  if (!isPlanetBody(body)) throw new Error(`PlanetBody needs a planet-body: ${body.id}`);
  const meta: PlanetBodyMetadata = body.metadata;
  const index = indexOf(body.id);
  const parentIndex = indexOf(body.parent);
  const parentPole =
    getById(body.parent) && isPlanetBody(getById(body.parent)!)
      ? (getById(body.parent)!.metadata as PlanetBodyMetadata).poleVec
      : undefined;
  const isEarth = body.id === 'earth';
  const SUN_INTENSITY = 1.15;
  const ringNormal = new Vector3();

  const surface = new ShaderMaterial({
    vertexShader: surfaceVertex,
    fragmentShader: surfaceFragment,
    uniforms: {
      uAlbedo: { value: null },
      uNight: { value: null },
      uClouds: { value: null },
      uRingAlpha: { value: null },
      uSolidColor: { value: new Color(meta.solidColor ?? '#8a8a8a') },
      uTextured: { value: 0 },
      uEarth: { value: 0 },
      uSunDir: { value: new Vector3(1, 0, 0) },
      uSunIntensity: { value: SUN_INTENSITY },
      uAmbient: { value: 0 },
      uAltitude: { value: 1 },
      uRings: { value: 0 },
      uRingNormal: { value: ringNormal },
      uRingRadii: { value: new Vector2(meta.hasRings?.innerRadius, meta.hasRings?.outerRadius) }
    }
  });

  const atmosphereTop = meta.atmosphere ? meta.radius + meta.atmosphere.heightKm * KM_TO_SCENE : 0;
  const atmosphere = meta.atmosphere
    ? new ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: {
          uCenter: { value: new Vector3() },
          uRadius: { value: meta.radius },
          uTop: { value: atmosphereTop },
          uSunView: { value: new Vector3() },
          uColor: { value: new Vector3(...meta.atmosphere.color) },
          uDensity: { value: meta.atmosphere.density },
          uSunIntensity: { value: SUN_INTENSITY }
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending
      })
    : null;

  const rings = meta.hasRings
    ? new ShaderMaterial({
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        uniforms: {
          uAlpha: { value: null },
          uRingRadii: { value: new Vector2(meta.hasRings.innerRadius, meta.hasRings.outerRadius) },
          uPlanetRadius: { value: meta.radius },
          uNormal: { value: ringNormal },
          uSunDir: { value: surface.uniforms.uSunDir.value },
          uSunIntensity: { value: SUN_INTENSITY }
        },
        transparent: true,
        depthWrite: false,
        side: DoubleSide
      })
    : null;

  let requested = false;
  function requestTextures(): void {
    requested = true;
    const set = (name: string, flag?: string) => (texture: Texture) => {
      surface.uniforms[name].value = texture;
      if (flag) surface.uniforms[flag].value = 1;
    };
    if (meta.textureUrl) void loadTexture(meta.textureUrl).then(set('uAlbedo', 'uTextured'));
    if (isEarth)
      void Promise.all([
        loadTexture('/textures/earth_night_2k.webp'),
        loadTexture('/textures/earth_clouds_2k.webp', false)
      ]).then(([night, clouds]) => {
        set('uNight')(night);
        set('uClouds', 'uEarth')(clouds);
      });
    if (meta.hasRings && rings)
      void loadTexture(meta.hasRings.textureUrl).then((texture) => {
        rings.uniforms.uAlpha.value = texture;
        set('uRingAlpha', 'uRings')(texture);
      });
  }

  const poleQuat = meta.poleVec ? poleQuaternion(meta.poleVec) : null;
  if (poleQuat) ringNormal.set(0, 1, 0).applyQuaternion(poleQuat);
  const extent = Math.max(meta.radius, atmosphereTop, meta.hasRings?.outerRadius ?? 0);
  const tidal = new Quaternion();
  const offset = new Vector3();
  const { camera, size } = useThrelte();
  let group: Group | undefined = $state();
  let spin: Group | undefined = $state();

  useTask(
    () => {
      if (!group || !spin) return;
      if (!valid[index]) {
        group.visible = false;
        return;
      }
      const position = positions[index];
      const cam = camera.current as PerspectiveCamera;
      const distance = cam.position.distanceTo(position);
      const focal = size.current.height / 2 / Math.tan(MathUtils.degToRad(cam.fov) / 2);
      const pixels = (focal * extent) / distance;
      group.visible = pixels > 0.5;
      if (!group.visible) return;
      if (!requested && pixels > 1.5) requestTextures();
      group.position.copy(position);

      const date = get(simTime);
      const sunDir = surface.uniforms.uSunDir.value as Vector3;
      sunDir.copy(position).negate().normalize();
      surface.uniforms.uAmbient.value = get(brightLighting) ? 0.12 : 0.004;
      surface.uniforms.uAltitude.value = distance / meta.radius - 1;

      if (meta.rotationModel === 'tidal-lock' && parentIndex >= 0) {
        offset.copy(position).sub(positions[parentIndex]);
        group.quaternion.copy(tidalLockQuaternion(offset, parentPole, tidal));
      } else if (meta.rotationModel === 'gmst' && meta.obliquityRad !== undefined) {
        group.rotation.set(-meta.obliquityRad, 0, 0);
        spin.rotation.set(0, getGmstRadians(date), 0);
      } else if (poleQuat) {
        group.quaternion.copy(poleQuat);
        spin.rotation.set(0, iauRotationRad(meta, date) ?? 0, 0);
      }

      if (atmosphere) {
        const inside = distance < atmosphereTop;
        atmosphere.side = inside ? BackSide : FrontSide;
        atmosphere.depthTest = !inside;
        atmosphere.uniforms.uCenter.value.copy(position).applyMatrix4(cam.matrixWorldInverse);
        atmosphere.uniforms.uSunView.value.copy(sunDir).transformDirection(cam.matrixWorldInverse);
      }
    },
    { after: 'camera' }
  );
</script>

<T.Group bind:ref={group} visible={false}>
  <T.Group bind:ref={spin}>
    <T.Mesh geometry={UNIT_SPHERE} material={surface} scale={meta.radius} />
    {@render children?.()}
  </T.Group>
  {#if atmosphere}
    <T.Mesh geometry={UNIT_SPHERE} material={atmosphere} scale={atmosphereTop} renderOrder={2} />
  {/if}
  {#if meta.hasRings && rings}
    <T.Mesh rotation.x={Math.PI / 2} renderOrder={1}>
      <T.RingGeometry args={[meta.hasRings.innerRadius, meta.hasRings.outerRadius, 256, 1]} />
      <T is={rings} />
    </T.Mesh>
  {/if}
</T.Group>
