/**
 * GLSL for bodies. Lighting is done in world orientation (rotation only) or in
 * view space, never with absolute world positions, so shading stays precise
 * millions of units from the origin. Colors are linear and pass through the
 * renderer's tone mapping and output color space.
 */

const common = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
`;

/** Body-local world-oriented offset (for ring shadows) and view direction in world orientation. */
export const surfaceVertex = /* glsl */ `
  ${common}
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vOffset;
  varying vec3 vToCamera;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vOffset = mat3(modelMatrix) * position;
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vToCamera = -(transpose(mat3(viewMatrix)) * view.xyz);
    gl_Position = projectionMatrix * view;
    #include <logdepthbuf_vertex>
  }
`;

export const surfaceFragment = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_fragment>
  uniform sampler2D uAlbedo;
  uniform sampler2D uNight;
  uniform sampler2D uClouds;
  uniform sampler2D uRingAlpha;
  uniform vec3 uSolidColor;
  uniform float uTextured;
  uniform float uEarth;
  uniform vec3 uSunDir;
  uniform float uSunIntensity;
  uniform float uAmbient;
  uniform float uAltitude;
  uniform float uRings;
  uniform vec3 uRingNormal;
  uniform vec2 uRingRadii;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vOffset;
  varying vec3 vToCamera;

  void main() {
    #include <logdepthbuf_fragment>
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vToCamera);
    float NdotL = dot(N, uSunDir);
    vec3 albedo = uTextured > 0.5 ? texture2D(uAlbedo, vUv).rgb : uSolidColor;
    vec3 surface = albedo;
    float clouds = 0.0;
    if (uEarth > 0.5) {
      clouds = texture2D(uClouds, vUv).r;
      albedo = mix(albedo, vec3(0.66), clouds * 0.9);
    }
    // Lambert with a slightly softened terminator, as scattering in a real
    // atmosphere or regolith never produces a hard edge.
    float light = max(NdotL, 0.0) * smoothstep(-0.02, 0.06, NdotL);
    vec3 color = albedo * light * uSunIntensity + albedo * uAmbient;

    if (uEarth > 0.5) {
      // Ocean glint: oceans are the dark, blue-dominant texels of the day map.
      float ocean =
        smoothstep(0.015, 0.05, surface.b - surface.r) * (1.0 - smoothstep(0.08, 0.2, surface.g));
      vec3 H = normalize(uSunDir + V);
      float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(H, V), 0.0), 5.0);
      float glint = pow(max(dot(N, H), 0.0), 90.0) * (0.6 + 4.0 * fresnel);
      color += vec3(1.0, 0.93, 0.82) * glint * ocean * (1.0 - clouds) * light * uSunIntensity;
      // City lights fade in through civil twilight.
      vec3 city = max(texture2D(uNight, vUv).rgb - vec3(0.035, 0.035, 0.06), 0.0);
      float night = 1.0 - smoothstep(-0.12, 0.04, NdotL);
      // City lights are point sources that a 2 km-per-texel map can only smear;
      // soften them at grazing angles and in low orbit, where the smear shows.
      float legible = smoothstep(0.05, 0.35, dot(N, V)) * mix(0.3, 1.0, smoothstep(0.1, 1.0, uAltitude));
      color += city * vec3(1.0, 0.82, 0.55) * night * (1.0 - clouds * 0.85) * legible * 1.6;
    }

    if (uRings > 0.5) {
      // March toward the Sun to the ring plane and dim by the ring's opacity there.
      float along = dot(uSunDir, uRingNormal);
      float t = -dot(vOffset, uRingNormal) / (abs(along) > 1e-4 ? along : 1e-4);
      if (t > 0.0) {
        float r = length(vOffset + uSunDir * t);
        float u = (r - uRingRadii.x) / (uRingRadii.y - uRingRadii.x);
        if (u > 0.0 && u < 1.0) color *= 1.0 - texture2D(uRingAlpha, vec2(u, 0.5)).a * 0.9;
      }
    }

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Atmosphere shell rendered from inside or outside; integrates density along the
 * view ray in view space. Blend with ONE, ONE_MINUS_SRC_ALPHA (premultiplied).
 */
export const atmosphereVertex = /* glsl */ `
  ${common}
  varying vec3 vView;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vView = view.xyz;
    gl_Position = projectionMatrix * view;
    #include <logdepthbuf_vertex>
  }
`;

export const atmosphereFragment = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_fragment>
  uniform vec3 uCenter;
  uniform float uRadius;
  uniform float uTop;
  uniform vec3 uSunView;
  uniform vec3 uColor;
  uniform float uDensity;
  uniform float uSunIntensity;
  varying vec3 vView;

  vec2 sphere(vec3 dir, float radius) {
    float b = dot(dir, uCenter);
    float c = dot(uCenter, uCenter) - radius * radius;
    float h = b * b - c;
    if (h < 0.0) return vec2(-1.0);
    h = sqrt(h);
    return vec2(b - h, b + h);
  }

  void main() {
    #include <logdepthbuf_fragment>
    vec3 dir = normalize(vView);
    vec2 shell = sphere(dir, uTop);
    if (shell.y <= 0.0) discard;
    vec2 ground = sphere(dir, uRadius);
    float start = max(shell.x, 0.0);
    float end = ground.x > 0.0 ? ground.x : shell.y;
    float thickness = uTop - uRadius;
    float stride = (end - start) / 8.0;
    float lit = 0.0;
    float sunset = 0.0;
    for (int i = 0; i < 8; i++) {
      vec3 p = dir * (start + stride * (float(i) + 0.5)) - uCenter;
      float r = length(p);
      float density = exp(-4.0 * max(r - uRadius, 0.0) / thickness);
      float mu = dot(p / r, uSunView);
      float sun = smoothstep(-0.18, 0.2, mu);
      lit += density * sun;
      sunset += density * sun * (1.0 - smoothstep(0.0, 0.35, mu));
    }
    float scale = stride / thickness * uDensity;
    lit *= scale;
    sunset *= scale;
    bool toGround = ground.x > 0.0;
    // Forward scattering brightens the limb when looking toward the Sun.
    float forward = 1.0 + (toGround ? 0.2 : 1.5) * pow(max(dot(dir, uSunView), 0.0), 6.0);
    float haze = 1.0 - exp(-lit * 0.9);
    vec3 color = uColor * haze * forward;
    color += vec3(1.0, 0.42, 0.16) * (1.0 - exp(-sunset * 0.5)) * 0.6;
    // Premultiplied output: over the ground, haze also veils what is behind it, so
    // long grazing paths from low orbit read as blue haze instead of washing out.
    // Sky rays stay purely additive.
    float veil = toGround ? haze * 0.45 : 0.0;
    if (toGround) color *= 0.55;
    gl_FragColor = vec4(color * uSunIntensity, veil);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const ringVertex = /* glsl */ `
  ${common}
  varying vec3 vOffset;
  varying vec3 vToCamera;
  void main() {
    vOffset = mat3(modelMatrix) * position;
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vToCamera = -(transpose(mat3(viewMatrix)) * view.xyz);
    gl_Position = projectionMatrix * view;
    #include <logdepthbuf_vertex>
  }
`;

export const ringFragment = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_fragment>
  uniform sampler2D uAlpha;
  uniform vec2 uRingRadii;
  uniform float uPlanetRadius;
  uniform vec3 uNormal;
  uniform vec3 uSunDir;
  uniform float uSunIntensity;
  varying vec3 vOffset;
  varying vec3 vToCamera;

  void main() {
    #include <logdepthbuf_fragment>
    float u = (length(vOffset) - uRingRadii.x) / (uRingRadii.y - uRingRadii.x);
    if (u < 0.0 || u > 1.0) discard;
    vec4 ring = texture2D(uAlpha, vec2(u, 0.5));
    float sunSide = dot(uNormal, uSunDir);
    float viewSide = dot(uNormal, vToCamera);
    // Sunlit face scatters back; the unlit face glows only where light gets through.
    float lit = sunSide * viewSide > 0.0
      ? 0.4 + 0.6 * sqrt(abs(sunSide))
      : (1.0 - ring.a) * 0.9 + 0.05;
    // Saturn's shadow: points behind the planet within its radius of the Sun line.
    float along = dot(vOffset, uSunDir);
    float off = length(vOffset - along * uSunDir);
    float shadow = along < 0.0 ? smoothstep(uPlanetRadius * 0.985, uPlanetRadius * 1.015, off) : 1.0;
    vec3 color = ring.rgb * lit * shadow * uSunIntensity;
    gl_FragColor = vec4(color, ring.a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const sunVertex = surfaceVertex;

export const sunFragment = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_fragment>
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vToCamera;
  varying vec2 vUv;
  varying vec3 vOffset;
  void main() {
    #include <logdepthbuf_fragment>
    float mu = max(dot(normalize(vNormal), normalize(vToCamera)), 0.0);
    // Photospheric limb darkening (quadratic law, visible band).
    float darkening = 1.0 - 0.47 * (1.0 - mu) - 0.23 * (1.0 - mu) * (1.0 - mu);
    vec3 limb = mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.93, 0.84), sqrt(mu));
    gl_FragColor = vec4(limb * darkening * uIntensity, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Camera-facing glow quad; `uCore` is the Sun's disc radius as a fraction of the quad. */
export const glowVertex = /* glsl */ `
  ${common}
  varying vec2 vUv;
  void main() {
    vUv = uv * 2.0 - 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    #include <logdepthbuf_vertex>
  }
`;

export const glowFragment = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_fragment>
  uniform float uCore;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    #include <logdepthbuf_fragment>
    float r = length(vUv);
    if (r >= 1.0) discard;
    float x = max(r - uCore, 0.0) / max(1.0 - uCore, 1e-3);
    float glow = 0.55 * exp(-9.0 * x) + 0.22 * exp(-3.2 * x);
    glow *= (1.0 - r) * (1.0 - r);
    gl_FragColor = vec4(vec3(1.0, 0.86, 0.66) * glow * uStrength, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
