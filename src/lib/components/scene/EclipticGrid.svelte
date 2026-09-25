<script lang="ts">
  import { T } from '@threlte/core';
  import { DoubleSide, ShaderMaterial } from 'three';
  import { AU_TO_SCENE, SUN_RADIUS } from '$lib/scene-config';

  /**
   * Faint reference disc in the J2000 ecliptic plane: circles every AU out to
   * 5 AU, then every 5 AU out to 50 AU, with 30° spokes. Lines keep a constant
   * pixel width and the disc fades toward its edge.
   */

  const OUTER_AU = 50;
  const material = new ShaderMaterial({
    uniforms: { uAu: { value: AU_TO_SCENE } },
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec2 vPlane;
      void main() {
        vPlane = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform float uAu;
      varying vec2 vPlane;
      float grid(float value, float spacing) {
        float cell = value / spacing;
        return 1.0 - smoothstep(0.0, fwidth(cell) * 1.2, abs(fract(cell - 0.5) - 0.5));
      }
      void main() {
        #include <logdepthbuf_fragment>
        float au = length(vPlane) / uAu;
        float circles = au < 5.0 ? grid(au, 1.0) : grid(au, 5.0);
        float angle = atan(vPlane.y, vPlane.x) / (PI / 6.0);
        float spokes = grid(angle, 1.0) * smoothstep(0.3, 1.0, au);
        float alpha = max(circles, spokes * 0.6) * 0.16 * (1.0 - smoothstep(20.0, ${OUTER_AU}.0, au));
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(vec3(0.62, 0.7, 0.78), alpha);
        #include <colorspace_fragment>
      }
    `,
    side: DoubleSide,
    transparent: true,
    depthWrite: false
  });
</script>

<T.Mesh rotation.x={-Math.PI / 2} {material} renderOrder={1}>
  <T.RingGeometry args={[SUN_RADIUS * 2, OUTER_AU * AU_TO_SCENE, 256, 1]} />
</T.Mesh>
