<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import {
    AdditiveBlending,
    MathUtils,
    PlaneGeometry,
    ShaderMaterial,
    type Mesh,
    type PerspectiveCamera
  } from 'three';
  import { SUN_RADIUS } from '$lib/scene-config';
  import { glowFragment, glowVertex, sunFragment, sunVertex } from './shaders';
  import { lens } from './overlay';
  import { UNIT_SPHERE } from './textures';

  /**
   * The Sun at its true radius, limb-darkened, with a lens glow sized in
   * screen space: a broad halo when the Sun is a distant point, a thin corona
   * when its disc fills the view.
   */

  const surface = new ShaderMaterial({
    vertexShader: sunVertex,
    fragmentShader: sunFragment,
    uniforms: { uIntensity: { value: 7 } }
  });
  const glow = new ShaderMaterial({
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    uniforms: { uCore: { value: 0.2 }, uStrength: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending
  });
  const quad = new PlaneGeometry(2, 2);
  let halo: Mesh | undefined = $state();
  const { camera, size } = useThrelte();

  useTask(
    () => {
      if (!halo) return;
      const cam = camera.current as PerspectiveCamera;
      const distance = cam.position.length();
      const { focal } = lens(cam, size.current.width, size.current.height);
      const discPixels = (focal * SUN_RADIUS) / Math.max(distance, SUN_RADIUS);
      const haloPixels = Math.max(discPixels * 2.6, 70);
      halo.scale.setScalar((haloPixels * distance) / focal);
      halo.quaternion.copy(cam.quaternion);
      glow.uniforms.uCore.value = discPixels / haloPixels;
      glow.uniforms.uStrength.value = MathUtils.lerp(
        1,
        0.55,
        MathUtils.smoothstep(discPixels, 20, 300)
      );
    },
    { after: 'camera' }
  );
</script>

<T.Mesh geometry={UNIT_SPHERE} material={surface} scale={SUN_RADIUS} />
<T.Mesh bind:ref={halo} geometry={quad} material={glow} renderOrder={3} />
