<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import {
    AdditiveBlending,
    MathUtils,
    PlaneGeometry,
    ShaderMaterial,
    Vector3,
    type Mesh
  } from 'three';
  import { AU_TO_SCENE } from '$lib/scene-config';
  import type { TrackedObject } from '$lib/registry/types';
  import { indexOf, positions, valid } from './bodyState';

  /**
   * A soft, camera-facing ion tail pointing away from the Sun. Illustrative:
   * length grows as the inverse square of heliocentric distance and the tail
   * fades out beyond about 5 AU, where sublimation shuts down.
   */

  let { object }: { object: TrackedObject } = $props();
  // svelte-ignore state_referenced_locally
  const index = indexOf(object.id);

  const geometry = new PlaneGeometry(1, 2, 24, 1).translate(0.5, 0, 0);
  const material = new ShaderMaterial({
    uniforms: {
      uAxis: { value: new Vector3() },
      uSide: { value: new Vector3() },
      uLength: { value: 1 },
      uIntensity: { value: 0 }
    },
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      uniform vec3 uAxis;
      uniform vec3 uSide;
      uniform float uLength;
      varying vec2 vTail;
      void main() {
        vTail = position.xy;
        float width = uLength * (0.004 + 0.07 * position.x);
        vec3 offset = uAxis * position.x * uLength + uSide * position.y * width;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(offset, 1.0);
        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform float uIntensity;
      varying vec2 vTail;
      void main() {
        #include <logdepthbuf_fragment>
        float along = pow(1.0 - vTail.x, 1.8);
        float across = exp(-3.5 * vTail.y * vTail.y);
        gl_FragColor = vec4(vec3(0.62, 0.8, 1.0) * along * across * uIntensity, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending
  });
  let mesh: Mesh | undefined = $state();
  const { camera } = useThrelte();

  useTask(
    () => {
      if (!mesh) return;
      const position = positions[index];
      const au = position.length() / AU_TO_SCENE;
      const intensity = valid[index] ? 1 - MathUtils.smoothstep(au, 2.5, 5) : 0;
      mesh.visible = intensity > 0;
      if (!mesh.visible) return;
      mesh.position.copy(position);
      const axis = material.uniforms.uAxis.value as Vector3;
      axis.copy(position).normalize();
      const side = material.uniforms.uSide.value as Vector3;
      side.copy(position).sub(camera.current.position).cross(axis).normalize();
      material.uniforms.uLength.value = Math.min(0.35, 0.12 / (au * au)) * AU_TO_SCENE;
      material.uniforms.uIntensity.value = intensity * 0.9;
    },
    { after: 'camera' }
  );
</script>

<T.Mesh bind:ref={mesh} {geometry} {material} frustumCulled={false} renderOrder={4} />
