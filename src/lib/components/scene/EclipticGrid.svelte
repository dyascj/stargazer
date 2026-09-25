<script lang="ts">
  import { T } from '@threlte/core';
  import { DoubleSide, ShaderMaterial } from 'three';

  /**
   * Faint ecliptic plane reference disc at y=0. Helps the user see
   * which bodies are above/below the ecliptic (Pluto's 17 deg
   * inclination, comets, etc.) and understand the 3D orientation of
   * the solar system without explicit axis labels.
   *
   * Renders as a flat ring from the Sun outward to ~550 AU (past
   * Neptune at 30 AU, well inside the far plane). The shader fades
   * the disc radially from a soft visible center to fully transparent
   * at the edge, so it never draws a hard boundary.
   *
   * Double-sided so it's visible from above and below. depthWrite
   * off so it doesn't block other geometry.
   */

  const INNER_RADIUS = 3; // scene units; starts just outside the Sun
  const OUTER_RADIUS = 5000; // past Pluto's aphelion (~4931 AU) — covers the full classical solar system
  const SEGMENTS = 128;

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

      // u runs 0..1 radially from inner to outer. Use it to fade
      // out toward the edge. The pow(1-u, 1.5) curve keeps the
      // center visible and the edge fully transparent.
      float radialFade = pow(1.0 - vUv.x, 1.5);

      // Fine concentric ring lines for visual texture. The sin()
      // on the radial coordinate produces subtle brightness
      // variations that read as distance markers.
      float rings = 0.5 + 0.5 * sin(vUv.x * 120.0);
      float ringLine = mix(0.6, 1.0, rings);

      // Radial grid lines (spokes). 12 lines = 30 deg each.
      float angle = vUv.y * 6.283185;
      float spokes = smoothstep(0.0, 0.008, abs(sin(angle * 6.0)));
      float spokeLine = mix(1.0, 0.7, 1.0 - spokes);

      float alpha = radialFade * ringLine * spokeLine * 0.06;
      if (alpha < 0.001) discard;

      gl_FragColor = vec4(0.6, 0.7, 0.85, alpha);
    }
  `;

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: DoubleSide,
    transparent: true,
    depthWrite: false
  });
</script>

<!-- Flat ring in the XZ plane (y=0 = ecliptic). RingGeometry is
     built in XY by default; rotation.x = PI/2 lays it flat. -->
<T.Mesh rotation.x={Math.PI / 2}>
  <T.RingGeometry args={[INNER_RADIUS, OUTER_RADIUS, SEGMENTS, 1]} />
  <T is={material} />
</T.Mesh>
