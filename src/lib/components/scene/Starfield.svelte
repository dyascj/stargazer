<script lang="ts">
  import { T } from '@threlte/core';
  import { BackSide, Matrix4, Mesh, ShaderMaterial } from 'three';
  import { GALACTIC_TO_SCENE } from '$utils/frames';
  import { loadTexture, UNIT_SPHERE } from './textures';

  /**
   * Milky Way skybox. The vertex shader drops the view translation, so the sky
   * is centered on the camera at any distance and can never clip. The texture
   * is in galactic coordinates (Galactic Center at its middle, the south
   * galactic pole at its top edge); `orientation` turns it into the scene's
   * J2000 ecliptic frame.
   */

  const TEXTURE_TO_GALACTIC = new Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
  const orientation = new Matrix4().multiplyMatrices(GALACTIC_TO_SCENE, TEXTURE_TO_GALACTIC);

  const material = new ShaderMaterial({
    uniforms: { uMap: { value: null }, uBrightness: { value: 0.75 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 direction = mat3(viewMatrix) * mat3(modelMatrix) * position;
        gl_Position = projectionMatrix * vec4(direction, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uBrightness;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(texture2D(uMap, vUv).rgb * uBrightness, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: BackSide,
    depthTest: false,
    depthWrite: false
  });
  void loadTexture('/textures/starfield_milkyway_8k.jpg').then((map) => {
    material.uniforms.uMap.value = map;
  });

  const sky = new Mesh(UNIT_SPHERE, material);
  sky.quaternion.setFromRotationMatrix(orientation);
  sky.renderOrder = -1000;
  sky.frustumCulled = false;
</script>

<T is={sky} />
