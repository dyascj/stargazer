<script lang="ts">
  import { T } from '@threlte/core';
  import { Billboard } from '@threlte/extras';
  import { AdditiveBlending, ShaderMaterial } from 'three';
  import { HELIO_SUN_RADIUS } from '$lib/scene-config';

  /**
   * Screen-space radial glow around the Sun. Makes the Sun read as
   * "the bright thing at the center" from solar system zoom levels
   * where the core sphere is only a few pixels across. Rendered as
   * a large billboard quad with a radial gradient that adds light
   * on top of whatever's behind it (additive blending).
   *
   * Size: 8x the Sun's rendered radius, so the glow is visible even
   * when the Sun itself is tiny. The gradient falls off with a steep
   * curve so the edge is fully transparent.
   */

  const BLOOM_RADIUS = HELIO_SUN_RADIUS * 8;

  const vertexShader = /* glsl */ `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }
  `;

  const fragmentShader = /* glsl */ `
    precision highp float;

    #include <common>
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    void main() {
      #include <logdepthbuf_fragment>

      // Distance from the centre of the quad (0..1 at the edge, 0 at centre).
      vec2 centred = vUv * 2.0 - 1.0;
      float r = length(centred);

      // Steep radial falloff: bright core, soft outer halo.
      float glow = exp(-r * 3.5) * 0.45;
      // Warmer outer fringe.
      float fringe = exp(-r * 1.8) * 0.12;

      float alpha = glow + fringe;
      if (alpha < 0.002) discard;

      // Warm white core blending to golden at the fringe.
      vec3 color = mix(vec3(1.0, 0.95, 0.8), vec3(1.0, 0.7, 0.3), r);
      gl_FragColor = vec4(color * alpha, alpha);
    }
  `;

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: AdditiveBlending,
    toneMapped: false
  });
</script>

<!--
  Billboard quad centred on the Sun (world origin). Threlte's
  <Billboard> auto-rotates the child to face the camera each frame
  so the radial gradient always reads as a circular glow.
-->
<Billboard>
  <T.Mesh>
    <T.PlaneGeometry args={[BLOOM_RADIUS * 2, BLOOM_RADIUS * 2]} />
    <T is={material} />
  </T.Mesh>
</Billboard>
