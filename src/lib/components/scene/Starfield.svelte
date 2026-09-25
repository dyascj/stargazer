<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { useTexture } from '@threlte/extras';
  import { BackSide, ShaderMaterial, Vector3, type Mesh } from 'three';

  /**
   * Starfield sphere covers the entire viewport at radius 500. Because
   * MeshBasicMaterial caps output at the texture's intrinsic brightness
   * (it has no exposure / tone-mapping plumbing), we use a tiny custom
   * shader that multiplies the sampled colour by a brightness factor.
   * This is the cleanest "lift the whole scene" knob — every pixel that
   * isn't covered by Earth, Moon, or ISS is starfield, so brightening
   * here brightens the whole viewport.
   */

  const texturePromise = useTexture('/textures/starfield_milkyway_8k.jpg');

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

    uniform sampler2D uMap;
    uniform float uBrightness;
    uniform vec3 uAmbientCast;
    varying vec2 vUv;
    void main() {
      #include <logdepthbuf_fragment>
      vec4 c = texture2D(uMap, vUv);
      // Multiply the texture by brightness, then add a small constant
      // colour cast so the darkest pixels get a faint cool tint instead
      // of pure black. Mimics the renderer clear-colour, but applied at
      // the layer that actually fills the viewport.
      gl_FragColor = vec4(c.rgb * uBrightness + uAmbientCast, 1.0);
    }
  `;

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: BackSide,
    uniforms: {
      uMap: { value: null },
      uBrightness: { value: 0.9 },
      // Faint near-white lift with the smallest hint of cool blue.
      // RGB in [0,1]. Same colour also applied as scene.background in
      // World.svelte for consistency.
      uAmbientCast: { value: new Vector3(0.004, 0.006, 0.012) }
    }
  });

  texturePromise.then((tex) => {
    material.uniforms.uMap.value = tex;
    material.uniformsNeedUpdate = true;
  });

  // Follow the camera each frame so the starfield sphere is always
  // centered around the viewer. Without this, flying out to Mars puts
  // the camera ~50,000 scene units outside the sphere — and because the
  // mesh uses BackSide rendering, you'd see nothing at all.
  let meshRef: Mesh | undefined = $state();
  const { camera } = useThrelte();
  useTask(() => {
    if (meshRef) {
      meshRef.position.copy(camera.current.position);
    }
  });
</script>

<!--
  Sphere radius needs to be larger than the maximum body-to-camera
  distance the user can reach. With camera maxDistance = 60000 from
  origin (so the user can fly out to Voyager 1 at ~16500 scene units),
  the worst case is camera at 60000 and a distant body on the opposite
  side at ~16500: ~76500 from camera. 80000 covers that with margin.
  Log depth buffer (enabled across all custom shaders) means the
  larger sphere has no precision cost.
-->
<T.Mesh bind:ref={meshRef}>
  <T.SphereGeometry args={[80000, 64, 64]} />
  <T is={material} />
</T.Mesh>
