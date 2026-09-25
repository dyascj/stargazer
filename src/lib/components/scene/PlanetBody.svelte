<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { useTexture } from '@threlte/extras';
  import {
    BackSide,
    Color,
    DoubleSide,
    LinearFilter,
    LinearMipmapLinearFilter,
    Matrix4,
    RepeatWrapping,
    ShaderMaterial,
    Vector3,
    type Group
  } from 'three';
  import { get } from 'svelte/store';
  import type { Snippet } from 'svelte';
  import { brightLighting } from '$stores/ui';
  import { poleQuaternion } from '$utils/pole';
  import { simTime } from '$stores/simTime';
  import { getGmstRadians } from '$utils/earth';
  import { getById, getWorldPosition } from '$lib/registry/registry';
  import { enterBody, leaveBody } from '$utils/sceneCursor';
  import { markPendingClick } from '$utils/sceneClick';
  import { isPlanetBody, type PlanetBodyMetadata, type TrackedObject } from '$lib/registry/types';

  /**
   * Generic planet / moon / dwarf-planet renderer.
   *
   * Replaces the per-body Earth/Moon/Mars components with a single
   * metadata-driven body. Adding a new planet is now a registry entry —
   * no new Svelte component required.
   *
   * Group hierarchy (nested for clean separation of concerns):
   *
   *   <Group ref={positionRef}>           ← position + pole orientation
   *     <Group ref={spinRef}>             ← spins around local Y (the
   *       <Mesh> surface </Mesh>            pole axis after the outer
   *       <Mesh> atmosphere </Mesh>          group's tilt is applied)
   *       {@render children}              ← satellites/orbit lines that
   *     </Group>                            need to inherit the spin
   *     <Mesh> ring disc </Mesh>          ← in the pole-tilted frame
   *   </Group>                              but does NOT spin with body
   *
   * Earth's GMST rotation goes on the inner spin group; the obliquity
   * tilt goes on the outer position group. Mars/Jupiter/Saturn/etc use
   * a pole-direction quaternion on the outer group + an IAU W-formula
   * spin angle on the inner group. Saturn's rings stay in the outer
   * group so they remain fixed in inertial space while Saturn spins
   * underneath them.
   */

  let { object: objectProp, children }: { object: TrackedObject; children?: Snippet } = $props();

  // svelte-ignore state_referenced_locally
  const object = objectProp;

  if (!isPlanetBody(object)) {
    throw new Error(
      `[Stargazer] PlanetBody received non-planet-body object: ${object.id} (kind ${object.rendererKind})`
    );
  }
  const meta: PlanetBodyMetadata = object.metadata;

  function handlePointerDown(event: { stopPropagation: () => void }): void {
    event.stopPropagation();
    markPendingClick(object.id);
  }

  // Hover brightness: bump the shader brightness by 0.12 when hovered
  // for immediate visual feedback that the body is interactive.
  const HOVER_BRIGHTNESS_BOOST = 0.12;
  let hovered = $state(false);

  function onHoverEnter(): void {
    hovered = true;
    enterBody(object.name);
  }
  function onHoverLeave(): void {
    hovered = false;
    leaveBody();
  }

  // ── Constants for the IAU W formula ─────────────────────────────────────
  const J2000_MS = Date.UTC(2000, 0, 1, 12);
  const DEG_TO_RAD = Math.PI / 180;

  // ── Surface shader ─────────────────────────────────────────────────────
  const useTextureMode = !!meta.textureUrl;

  const vertexShader = /* glsl */ `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vSurfaceUv;
    varying vec3 vNormal;

    void main() {
      vSurfaceUv = uv;
      vNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }
  `;

  const texturedFragment = /* glsl */ `
    precision highp float;

    #include <common>
    #include <logdepthbuf_pars_fragment>

    uniform sampler2D uAlbedo;
    uniform sampler2D uClouds;
    uniform float uHasClouds;
    uniform vec3 uSunDir;
    uniform float uAmbient;
    uniform float uBrightness;

    varying vec2 vSurfaceUv;
    varying vec3 vNormal;

    void main() {
      #include <logdepthbuf_fragment>
      vec2 uv = vSurfaceUv;

      vec3 albedo = texture2D(uAlbedo, uv).rgb;
      if (uHasClouds > 0.5) {
        float clouds = texture2D(uClouds, uv).r;
        albedo = mix(albedo, vec3(0.95), clouds * 0.85);
      }

      float lambert = dot(normalize(vNormal), uSunDir);
      float diffuse = pow(max(lambert, 0.0), 0.62);
      vec3 color = albedo * (diffuse * uBrightness + uAmbient);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const solidFragment = /* glsl */ `
    precision highp float;

    #include <common>
    #include <logdepthbuf_pars_fragment>

    uniform vec3 uSolidColor;
    uniform vec3 uSunDir;
    uniform float uAmbient;
    uniform float uBrightness;

    varying vec3 vNormal;

    void main() {
      #include <logdepthbuf_fragment>
      float lambert = dot(normalize(vNormal), uSunDir);
      float diffuse = pow(max(lambert, 0.0), 0.62);
      vec3 color = uSolidColor * (diffuse * uBrightness + uAmbient);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const surfaceUniforms: Record<string, { value: unknown }> = useTextureMode
    ? {
        uAlbedo: { value: null },
        uClouds: { value: null },
        uHasClouds: { value: 0 },
        uSunDir: { value: new Vector3(1, 0, 0) },
        uAmbient: { value: 0.035 },
        uBrightness: { value: 1.05 }
      }
    : {
        uSolidColor: { value: new Color(meta.solidColor ?? '#888888') },
        uSunDir: { value: new Vector3(1, 0, 0) },
        uAmbient: { value: 0.035 },
        uBrightness: { value: 1.05 }
      };

  const surfaceMaterial = new ShaderMaterial({
    vertexShader,
    fragmentShader: useTextureMode ? texturedFragment : solidFragment,
    uniforms: surfaceUniforms
  });

  if (useTextureMode && meta.textureUrl) {
    const baseTextures = useTexture([meta.textureUrl]);
    baseTextures.then(([albedo]) => {
      albedo.wrapS = RepeatWrapping;
      albedo.minFilter = LinearMipmapLinearFilter;
      albedo.magFilter = LinearFilter;
      albedo.generateMipmaps = true;
      albedo.needsUpdate = true;
      surfaceMaterial.uniforms.uAlbedo.value = albedo;
      surfaceMaterial.uniformsNeedUpdate = true;
    });
  }

  if (object.id === 'earth') {
    useTexture(['/textures/earth_clouds_2k.webp']).then(([clouds]) => {
      clouds.wrapS = RepeatWrapping;
      surfaceMaterial.uniforms.uClouds.value = clouds;
      surfaceMaterial.uniforms.uHasClouds.value = 1;
    });
  }

  // ── Atmosphere fresnel shell ────────────────────────────────────────────
  // Configurable color via `meta.atmosphereColor`; defaults to Earth's
  // blue if unset. Renders on Venus (sulfuric cloud haze), Earth (N2/O2
  // Rayleigh scatter), and Titan (orange CH4/N2 haze).
  const atmosColor = meta.atmosphereColor ?? [0.35, 0.6, 1.0];

  const atmosphereVertex = /* glsl */ `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec3 vNormal;
    varying vec3 vView;
    varying vec3 vWorldNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vView = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }
  `;

  const atmosphereFragment = /* glsl */ `
    #include <common>
    #include <logdepthbuf_pars_fragment>

    uniform vec3 uAtmosColor;
    uniform vec3 uSunDir;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vView;
    void main() {
      #include <logdepthbuf_fragment>
      float rim = pow(clamp(1.0 + dot(normalize(vNormal), normalize(vView)), 0.0, 1.0), 3.0);
      float sunlight = smoothstep(-0.25, 0.6, dot(normalize(vWorldNormal), uSunDir));
      gl_FragColor = vec4(uAtmosColor, rim * (0.06 + 0.42 * sunlight));
    }
  `;

  // ── Ring shader (Saturn) ────────────────────────────────────────────────
  // Samples a horizontal alpha strip along the radial direction (u).
  // Lights both sides equally with abs(dot(normal, sunDir)) so the
  // rings dim during equinoxes when the Sun is edge-on.
  const ringVertex = /* glsl */ `
    uniform float uInnerRadius;
    uniform float uOuterRadius;
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec3 vOffset;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = vec2((length(position.xy) - uInnerRadius) / (uOuterRadius - uInnerRadius), 0.5);
      vOffset = (modelMatrix * vec4(position, 0.0)).xyz;
      vNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }
  `;

  const ringFragment = /* glsl */ `
    precision highp float;

    #include <common>
    #include <logdepthbuf_pars_fragment>

    uniform float uPlanetRadius;
    uniform sampler2D uAlpha;
    uniform vec3 uColor;
    uniform vec3 uSunDir;

    varying vec3 vOffset;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      #include <logdepthbuf_fragment>
      // The alpha strip is sampled along the radial direction. v=0.5
      // picks the centerline of the 1-pixel-tall strip.
      vec4 ringSample = texture2D(uAlpha, vec2(vUv.x, 0.5));
      // Solar System Scope's alpha strip uses the alpha channel for
      // transparency and the RGB for the ring color (matched to a
      // realistic palette). We multiply by uColor as a tint.
      float alpha = ringSample.a;
      vec3 ringColor = sqrt(ringSample.rgb) * uColor;

      // Both sides lit equally — the ring particles scatter sunlight
      // through to the opposite face.
      float lambert = abs(dot(normalize(vNormal), uSunDir));
      float along = -dot(vOffset, uSunDir);
      float shadowDistance = length(vOffset + along * uSunDir);
      float shadow = along > 0.0 ? smoothstep(uPlanetRadius * 0.98, uPlanetRadius * 1.02, shadowDistance) : 1.0;
      float shading = (0.65 + 0.35 * lambert) * (0.12 + 0.88 * shadow);

      gl_FragColor = vec4(ringColor * shading, alpha);
    }
  `;

  // Build the ring material (only used if hasRings is set). Defined as a
  // const so the Svelte compiler doesn't flag it as a non-reactive
  // update — we mutate `material.uniforms.uAlpha.value`, not the
  // reference itself.
  const ringMaterial: ShaderMaterial | null = meta.hasRings
    ? new ShaderMaterial({
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        uniforms: {
          uAlpha: { value: null },
          uInnerRadius: { value: meta.hasRings.innerRadius },
          uOuterRadius: { value: meta.hasRings.outerRadius },
          uPlanetRadius: { value: meta.radius },
          uColor: { value: new Color(meta.hasRings.color ?? '#ffffff') },
          uSunDir: { value: new Vector3(1, 0, 0) }
        }
      })
    : null;

  if (meta.hasRings && ringMaterial) {
    const ringTextures = useTexture([meta.hasRings.textureUrl]);
    ringTextures.then(([ringTex]) => {
      ringTex.wrapS = RepeatWrapping;
      ringTex.minFilter = LinearFilter;
      ringTex.magFilter = LinearFilter;
      ringTex.generateMipmaps = false;
      ringTex.needsUpdate = true;
      ringMaterial.uniforms.uAlpha.value = ringTex;
      ringMaterial.uniformsNeedUpdate = true;
    });
  }

  // ── Per-frame state ─────────────────────────────────────────────────────
  let positionGroupRef: Group | undefined = $state();
  let spinGroupRef: Group | undefined = $state();
  const worldPos = new Vector3();
  const scratch = new Vector3();
  const sunDir = new Vector3();

  // Pole orientation — built once at mount if a poleVec is provided.
  const poleQuat = meta.poleVec ? poleQuaternion(meta.poleVec) : null;

  // Tidal-lock helpers — only used when rotationModel === 'tidal-lock'.
  const xAxis = new Vector3();
  const yAxis = new Vector3();
  const zAxis = new Vector3();
  const worldUp = new Vector3(0, 1, 0);
  const tidalMatrix = new Matrix4();
  const offsetFromParent = new Vector3();

  useTask(() => {
    if (!positionGroupRef || !spinGroupRef) return;

    const date = get(simTime);

    // Position via registry parent walk. If null (e.g. a satellite whose
    // live source isn't ready), park the body off-screen for this frame.
    const pos = getWorldPosition(object.id, date, worldPos, scratch);
    if (!pos) {
      positionGroupRef.position.set(0, 1e9, 0);
      return;
    }
    positionGroupRef.position.copy(pos);

    // Sun direction in world space — for the Lambert shader.
    if (meta.lightingFromParent && object.parent) {
      const parent = getById(object.parent);
      if (parent) {
        const parentPos = parent.offsetFn(date, scratch);
        if (parentPos) {
          sunDir.copy(parentPos).normalize().negate();
        } else {
          sunDir.copy(pos).normalize().negate();
        }
      } else {
        sunDir.copy(pos).normalize().negate();
      }
    } else {
      sunDir.copy(pos).normalize().negate();
    }
    surfaceMaterial.uniforms.uSunDir.value.copy(sunDir);
    if (ringMaterial) {
      ringMaterial.uniforms.uSunDir.value.copy(sunDir);
    }

    // Hover brightness: smoothly animate the shader brightness up when
    // hovered, back down when not. Gives immediate visual feedback.
    surfaceMaterial.uniforms.uAmbient.value = get(brightLighting) ? 0.3 : 0.035;
    const targetBrightness = 1.08 + (hovered ? HOVER_BRIGHTNESS_BOOST : 0);
    const currentBrightness = surfaceMaterial.uniforms.uBrightness.value as number;
    surfaceMaterial.uniforms.uBrightness.value =
      currentBrightness + (targetBrightness - currentBrightness) * 0.2;

    // Outer group (positionGroupRef): pole orientation only — does NOT
    // include the sidereal spin. Inner group (spinGroupRef) handles spin.
    if (meta.rotationModel === 'tidal-lock') {
      // Tidal-locked bodies have no separate spin; the orientation is
      // entirely determined by the position vector. Apply to the outer
      // group (the inner group stays at identity).
      const parentOffset = object.offsetFn(date, offsetFromParent);
      if (parentOffset) {
        xAxis.copy(parentOffset).normalize().negate();
        yAxis.copy(worldUp).addScaledVector(xAxis, -worldUp.dot(xAxis)).normalize();
        zAxis.crossVectors(xAxis, yAxis);
        tidalMatrix.makeBasis(xAxis, yAxis, zAxis);
        positionGroupRef.quaternion.setFromRotationMatrix(tidalMatrix);
        spinGroupRef.rotation.set(0, 0, 0);
      }
    } else if (meta.rotationModel === 'gmst' && meta.obliquityRad !== undefined) {
      // Earth: outer group gets the obliquity tilt around scene X.
      // Inner group gets the GMST rotation around the (now-tilted)
      // local Y axis = Earth's geographic axis.
      positionGroupRef.rotation.x = -meta.obliquityRad;
      positionGroupRef.rotation.y = 0;
      positionGroupRef.rotation.z = 0;
      spinGroupRef.rotation.x = 0;
      spinGroupRef.rotation.y = getGmstRadians(date);
      spinGroupRef.rotation.z = 0;
    } else if (poleQuat) {
      // Mars / Mercury / Venus / Jupiter / Saturn / Uranus / Neptune /
      // Pluto: outer group gets the IAU pole orientation as a
      // quaternion. Inner group gets the IAU W-formula spin if the
      // body has rotation rate metadata.
      positionGroupRef.quaternion.copy(poleQuat);
      if (
        meta.rotationModel === 'iau-w' &&
        meta.rotationW0Deg !== undefined &&
        meta.rotationRateDegPerDay !== undefined
      ) {
        const daysSinceJ2000 = (date.getTime() - J2000_MS) / 86_400_000;
        const wDeg = meta.rotationW0Deg + meta.rotationRateDegPerDay * daysSinceJ2000;
        const wRad = ((wDeg % 360) + 360) % 360;
        spinGroupRef.rotation.set(0, wRad * DEG_TO_RAD, 0);
      } else {
        spinGroupRef.rotation.set(0, 0, 0);
      }
    } else if (meta.obliquityRad !== undefined) {
      // Static obliquity, no spin (fallback).
      positionGroupRef.rotation.x = -meta.obliquityRad;
      positionGroupRef.rotation.y = 0;
      positionGroupRef.rotation.z = 0;
      spinGroupRef.rotation.set(0, 0, 0);
    }
  });
</script>

<T.Group bind:ref={positionGroupRef}>
  <!-- Spinning sub-group: surface, atmosphere, and any children that
       need to inherit the daily rotation (e.g. Earth's satellite
       markers, which use Earth-fixed lat/lon). -->
  <T.Group bind:ref={spinGroupRef}>
    <!-- Surface mesh — geodesic icosphere at the body's per-LOD detail. -->
    <T.Mesh
      onpointerdown={handlePointerDown}
      onpointerover={onHoverEnter}
      onpointerout={onHoverLeave}
    >
      <T.SphereGeometry args={[meta.radius, 96, 64]} />
      <T is={surfaceMaterial} />
    </T.Mesh>

    {#if meta.hasAtmosphere}
      <!-- Fresnel rim glow shell (Earth, Venus, Titan). -->
      <T.Mesh scale={1.04}>
        <T.SphereGeometry args={[meta.radius, 64, 48]} />
        <T.ShaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={{ uAtmosColor: { value: atmosColor }, uSunDir: { value: sunDir } }}
          depthWrite={false}
          side={BackSide}
          transparent
        />
      </T.Mesh>
    {/if}

    <!-- Children mounted in this body's spinning frame. Used by Earth
         to host satellite markers, footprints, and orbit lines (which
         are tracked in Earth-fixed lat/lon and need GMST inheritance). -->
    {@render children?.()}
  </T.Group>

  {#if meta.hasRings && ringMaterial}
    <!-- Ring disc — sits in the body's equatorial plane (perpendicular
         to the local Y / pole axis), but OUTSIDE the spin group, so it
         stays fixed in inertial space while the body rotates underneath.
         RingGeometry is built in the XY plane by default; we rotate it
         90° around X so it lies in the XZ plane (the equatorial plane). -->
    <T.Mesh rotation={[Math.PI / 2, 0, 0]}>
      <T.RingGeometry args={[meta.hasRings.innerRadius, meta.hasRings.outerRadius, 128, 1]} />
      <T is={ringMaterial} />
    </T.Mesh>
  {/if}
</T.Group>
