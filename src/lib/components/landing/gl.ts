/**
 * Self-contained three.js scenes for the landing page, loaded with a dynamic
 * import after first paint. Independent of the explorer's Threlte scene.
 *
 *  - mountHero: orbital sunrise over Earth's limb (the brand mark, rendered live).
 *  - mountWorld: a single lit planet for the featured-worlds chapter.
 */
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  NoColorSpace,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  RingGeometry,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
  ACESFilmicToneMapping,
  DoubleSide
} from 'three';

const DEG = Math.PI / 180;
const loader = new TextureLoader();
const textures = new Map<string, Promise<Texture>>();

function loadTexture(url: string, renderer: WebGLRenderer, color = true): Promise<Texture> {
  if (!textures.has(url)) {
    textures.set(
      url,
      loader.loadAsync(url).then((texture) => {
        texture.colorSpace = color ? SRGBColorSpace : NoColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        return texture;
      })
    );
  }
  return textures.get(url)!;
}

function createRenderer(canvas: HTMLCanvasElement, mobile: boolean) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  return renderer;
}

/** Render loop that only runs while active and the tab is visible. */
function loop(frame: (time: number, dt: number) => void) {
  let raf = 0;
  let active = true;
  let last = performance.now();
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    frame(now / 1000, Math.min(0.05, (now - last) / 1000));
    last = now;
  };
  const sync = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (active && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  document.addEventListener('visibilitychange', sync);
  sync();
  return {
    setActive(value: boolean) {
      active = value;
      sync();
    },
    stop() {
      active = false;
      sync();
      document.removeEventListener('visibilitychange', sync);
    }
  };
}

const planetVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/** Lambert surface with optional clouds, warm grazing light, and an atmospheric rim. */
const planetFragment = /* glsl */ `
  uniform sampler2D map;
  uniform sampler2D cloudMap;
  uniform float clouds;
  uniform float cloudOffset;
  uniform vec3 sunDir;
  uniform vec3 rimColor;
  uniform float rim;
  uniform float ambient;
  uniform float opacity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(cameraPosition - vPosition);
    float ndl = dot(n, sunDir);
    vec3 albedo = texture2D(map, vUv).rgb;
    float c = clouds * texture2D(cloudMap, vUv + vec2(cloudOffset, 0.0)).r;
    albedo = mix(albedo, vec3(0.92), c);
    vec3 sunlight = mix(vec3(1.0, 0.42, 0.16), vec3(1.0, 0.98, 0.95), smoothstep(0.0, 0.3, ndl));
    vec3 color = albedo * (max(ndl, 0.0) * sunlight * 1.35 + ambient);
    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.5);
    color += rimColor * fresnel * rim * smoothstep(-0.2, 0.45, ndl);
    gl_FragColor = vec4(color * opacity, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function planetMaterial(map: Texture, extra: Record<string, { value: unknown }> = {}) {
  return new ShaderMaterial({
    vertexShader: planetVertex,
    fragmentShader: planetFragment,
    transparent: true,
    uniforms: {
      map: { value: map },
      cloudMap: { value: map },
      clouds: { value: 0 },
      cloudOffset: { value: 0 },
      sunDir: { value: new Vector3(0, 0, 1) },
      rimColor: { value: new Color(0.35, 0.6, 1) },
      rim: { value: 0 },
      ambient: { value: 0.012 },
      opacity: { value: 1 },
      ...extra
    }
  });
}

/* ------------------------------------------------------------------------ */
/* Hero                                                                      */
/* ------------------------------------------------------------------------ */

/** Analytic single-shell glow: density from the ray's closest approach altitude. */
const atmosphereFragment = /* glsl */ `
  uniform vec3 sunDir;
  uniform float planetRadius;
  uniform float scaleHeight;
  uniform float intensity;
  varying vec3 vPosition;
  void main() {
    vec3 rd = normalize(vPosition - cameraPosition);
    vec3 closest = cameraPosition + rd * -dot(cameraPosition, rd);
    float altitude = length(closest) - planetRadius;
    float density = altitude > 0.0
      ? exp(-altitude / scaleHeight)
      : exp(altitude / (scaleHeight * 0.3));
    float facing = dot(normalize(closest), sunDir);
    float lit = smoothstep(-0.32, 0.3, facing);
    float mu = max(dot(rd, sunDir), 0.0);
    float mie = pow(mu, 10.0);
    float glare = pow(mu, 400.0);
    vec3 blue = vec3(0.22, 0.5, 1.0);
    vec3 warm = vec3(1.0, 0.5, 0.2);
    float lowBand = exp(-abs(altitude) / (scaleHeight * 0.45));
    vec3 color = blue * density * lit * (0.55 + 1.4 * mie);
    color += warm * lowBand * smoothstep(-0.45, 0.15, facing) * (1.1 * mie + 3.0 * glare);
    gl_FragColor = vec4(color * intensity, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Billboarded sun with a four-point diffraction star, echoing the brand mark. */
const sunFragment = /* glsl */ `
  uniform float intensity;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float core = exp(-r * r * 2200.0) * 14.0;
    float halo = exp(-r * 26.0) * 0.9 + exp(-r * 7.0) * 0.12;
    float spikeX = exp(-abs(p.y) * 300.0) * exp(-abs(p.x) * 7.0);
    float spikeY = exp(-abs(p.x) * 300.0) * exp(-abs(p.y) * 7.0);
    float streak = exp(-abs(p.y) * 900.0) * exp(-abs(p.x) * 2.5) * 0.12;
    vec3 color = vec3(1.0, 0.95, 0.88) * (core + halo + (spikeX + spikeY) * 1.1 + streak);
    gl_FragColor = vec4(color * intensity, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const starVertex = /* glsl */ `
  attribute float size;
  attribute float seed;
  uniform float time;
  uniform float pixelRatio;
  varying float vBrightness;
  varying vec3 vColor;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * pixelRatio;
    vBrightness = (0.35 + 0.65 * seed) * (0.8 + 0.2 * sin(time * (0.6 + seed * 1.8) + seed * 60.0));
    vColor = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.9, 0.78), fract(seed * 7.13));
  }
`;

const starFragment = /* glsl */ `
  uniform float opacity;
  varying float vBrightness;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vColor * a * vBrightness * opacity, 1.0);
  }
`;

const passVertex = /* glsl */ `
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

function createStars(count: number, radius: number) {
  const positions: number[] = [];
  const sizes: number[] = [];
  const seeds: number[] = [];
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    positions.push(radius * s * Math.cos(theta), radius * u, radius * s * Math.sin(theta));
    const seed = Math.random();
    seeds.push(seed);
    sizes.push(seed > 0.985 ? 3.2 : 0.9 + Math.pow(Math.random(), 3) * 1.8);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('seed', new Float32BufferAttribute(seeds, 1));
  return geometry;
}

export interface HeroOptions {
  mobile: boolean;
  /** Called once textures are ready and the first frame has rendered. */
  onReady?: () => void;
}

export async function mountHero(canvas: HTMLCanvasElement, { mobile, onReady }: HeroOptions) {
  const renderer = createRenderer(canvas, mobile);
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.01, 2000);

  const earthMap = await loadTexture('/textures/earth_albedo_2k.webp', renderer);
  const earthMaterial = planetMaterial(earthMap, {
    rim: { value: 0.5 },
    ambient: { value: 0.01 }
  });
  earthMaterial.transparent = false;
  const earth = new Mesh(new SphereGeometry(1, 160, 120), earthMaterial);
  earth.rotation.z = 23.44 * DEG;
  scene.add(earth);
  // Clouds are a large download; desktop only, faded in when ready.
  let cloudTarget = 0;
  if (!mobile) {
    loadTexture('/textures/earth_clouds_2k.webp', renderer, false).then((clouds) => {
      earthMaterial.uniforms.cloudMap.value = clouds;
      cloudTarget = 1;
    });
  }

  const atmosphere = new Mesh(
    new SphereGeometry(1.12, 128, 96),
    new ShaderMaterial({
      vertexShader: passVertex,
      fragmentShader: atmosphereFragment,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      uniforms: {
        sunDir: earthMaterial.uniforms.sunDir,
        planetRadius: { value: 1 },
        scaleHeight: { value: 0.011 },
        intensity: { value: 0 }
      }
    })
  );
  atmosphere.renderOrder = 2;
  scene.add(atmosphere);

  const sunMaterial = new ShaderMaterial({
    vertexShader: passVertex,
    fragmentShader: sunFragment,
    blending: AdditiveBlending,
    depthWrite: false,
    transparent: true,
    uniforms: { intensity: { value: 0 } }
  });
  const sun = new Mesh(new PlaneGeometry(1, 1), sunMaterial);
  sun.renderOrder = 3;
  scene.add(sun);

  const starMaterial = new ShaderMaterial({
    vertexShader: starVertex,
    fragmentShader: starFragment,
    blending: AdditiveBlending,
    depthWrite: false,
    transparent: true,
    uniforms: {
      time: { value: 0 },
      pixelRatio: { value: renderer.getPixelRatio() },
      opacity: { value: 0 }
    }
  });
  const stars = new Points(createStars(mobile ? 1400 : 2600, 900), starMaterial);
  scene.add(stars);

  // Composition: the camera sits above the planet; the limb's top crosses the
  // screen at `limbY` (NDC) and the sun rises at azimuth `sunAzimuth` along it.
  const distance = 1.7;
  const limbRadius = Math.asin(1 / distance);
  let limbY = 0;
  let sunAzimuth = 0;

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scroll = 0;
  let clock = 0;
  const center = new Vector3(0, 0, -1);
  const up = new Vector3(0, 1, 0);
  const right = new Vector3(1, 0, 0);
  const dir = new Vector3();

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const portrait = camera.aspect < 0.9;
    camera.fov = portrait ? 52 : 30;
    limbY = portrait ? 0.14 : 0.12;
    sunAzimuth = (portrait ? 9 : 16) * DEG;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

  function frame(time: number, dt: number) {
    clock += dt;
    const intro = easeOut(clock / 7);
    const fade = easeOut(clock / 2.2);

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2.5);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2.5);

    // Pitch the camera so the limb lands at limbY; scrolling lowers the horizon.
    const halfFov = (camera.fov / 2) * DEG;
    const pitch = limbRadius - Math.atan((limbY - scroll * 0.35) * Math.tan(halfFov));
    const yaw = pointer.x * 1.4 * DEG;
    camera.position.set(0, 0, distance);
    dir
      .set(0, Math.sin(pitch + pointer.y * 0.8 * DEG), -Math.cos(pitch + pointer.y * 0.8 * DEG))
      .applyAxisAngle(up, -yaw);
    camera.lookAt(dir.add(camera.position));

    // Sun: starts just below the limb and rises over it; scroll lifts it further.
    const elevation = (-1.1 + 2.7 * intro + scroll * 3) * DEG;
    const angle = limbRadius + elevation;
    dir
      .copy(center)
      .multiplyScalar(Math.cos(angle))
      .addScaledVector(up, Math.sin(angle) * Math.cos(sunAzimuth))
      .addScaledVector(right, Math.sin(angle) * Math.sin(sunAzimuth))
      .normalize();
    sun.position.copy(camera.position).addScaledVector(dir, 800);
    sun.quaternion.copy(camera.quaternion);
    sun.scale.setScalar(800 * 2 * Math.tan((mobile ? 26 : 20) * DEG));
    earthMaterial.uniforms.sunDir.value.copy(sun.position).normalize();

    const visible = Math.min(1, Math.max(0, (elevation / DEG + 0.9) / 1.6));
    sunMaterial.uniforms.intensity.value = fade * (0.12 + 0.88 * visible);
    atmosphere.material.uniforms.intensity.value = fade * 1.3;
    starMaterial.uniforms.opacity.value = fade;
    starMaterial.uniforms.time.value = time;
    renderer.toneMappingExposure = 0.2 + 0.8 * fade;

    const clouds = earthMaterial.uniforms.clouds;
    clouds.value += (cloudTarget * 0.85 - clouds.value) * Math.min(1, dt * 1.5);
    earthMaterial.uniforms.cloudOffset.value = -clock * 0.0012;
    earth.rotation.y = 2.2 + clock * 0.006;

    renderer.render(scene, camera);
  }

  frame(0, 0);
  onReady?.();
  const running = loop(frame);

  return {
    /** Pointer position in [-1, 1] on both axes. */
    setPointer(x: number, y: number) {
      pointer.tx = x;
      pointer.ty = y;
    },
    /** Hero scroll progress in [0, 1]. */
    setScroll(value: number) {
      scroll = value;
    },
    setActive: running.setActive,
    destroy() {
      running.stop();
      observer.disconnect();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof Mesh || object instanceof Points) {
          object.geometry.dispose();
          (object.material as ShaderMaterial).dispose();
        }
      });
    }
  };
}

/* ------------------------------------------------------------------------ */
/* Featured world                                                            */
/* ------------------------------------------------------------------------ */

export interface WorldSpec {
  id: string;
  texture: string;
  tiltDeg: number;
  /** Rotation speed, radians per second (illustrative, not physical). */
  spin: number;
  rim?: [number, number, number];
  clouds?: string;
  rings?: { inner: number; outer: number; texture: string } | null;
}

/** Ring-plane position in planet radii, oriented in world space. */
const ringVertex = /* glsl */ `
  varying vec3 vRelative;
  void main() {
    mat3 basis = mat3(modelMatrix);
    vRelative = basis * position / length(basis[0]);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const ringFragment = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 sunDir;
  uniform float inner;
  uniform float outer;
  uniform float opacity;
  varying vec3 vRelative;
  void main() {
    vec3 p = vRelative;
    vec4 texel = texture2D(map, vec2(clamp((length(p) - inner) / (outer - inner), 0.0, 1.0), 0.5));
    // Planet shadow: points behind the planet relative to the sun.
    float along = dot(p, sunDir);
    float offAxis = length(p - along * sunDir);
    float shadow = along < 0.0 ? smoothstep(0.96, 1.04, offAxis) : 1.0;
    vec3 color = texel.rgb * (0.25 + 0.95 * shadow);
    gl_FragColor = vec4(color * texel.a * opacity, texel.a * opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function mountWorld(canvas: HTMLCanvasElement, { mobile }: { mobile: boolean }) {
  const renderer = createRenderer(canvas, mobile);
  const scene = new Scene();
  const camera = new PerspectiveCamera(24, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const sunDir = new Vector3(-0.75, 0.28, 0.6).normalize();
  const blank = new Texture();
  const material = planetMaterial(blank, { ambient: { value: 0.02 } });
  material.uniforms.sunDir.value = sunDir;
  const planet = new Mesh(new SphereGeometry(1, 128, 96), material);

  const ringMaterial = new ShaderMaterial({
    vertexShader: ringVertex,
    fragmentShader: ringFragment,
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
    uniforms: {
      map: { value: blank },
      sunDir: { value: sunDir },
      inner: { value: 1 },
      outer: { value: 2 },
      opacity: { value: 1 }
    }
  });
  const ring = new Mesh(new RingGeometry(1, 2.4, 256, 1), ringMaterial);
  ring.rotation.x = -Math.PI / 2;

  const system = new Group();
  system.add(planet, ring);
  scene.add(system);

  let current: WorldSpec | null = null;
  let pending: WorldSpec | null = null;
  let opacity = 0;
  let spin = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  async function apply(spec: WorldSpec) {
    const [map, clouds, rings] = await Promise.all([
      loadTexture(spec.texture, renderer),
      spec.clouds ? loadTexture(spec.clouds, renderer, false) : null,
      spec.rings ? loadTexture(spec.rings.texture, renderer) : null
    ]);
    if (pending !== spec) return;
    material.uniforms.map.value = map;
    material.uniforms.cloudMap.value = clouds ?? map;
    material.uniforms.clouds.value = clouds ? 0.9 : 0;
    material.uniforms.rim.value = spec.rim ? 0.7 : 0;
    if (spec.rim) material.uniforms.rimColor.value.setRGB(...spec.rim);
    ring.visible = !!spec.rings;
    if (spec.rings && rings) {
      ringMaterial.uniforms.map.value = rings;
      ringMaterial.uniforms.inner.value = spec.rings.inner;
      ringMaterial.uniforms.outer.value = spec.rings.outer;
      ring.geometry.dispose();
      ring.geometry = new RingGeometry(spec.rings.inner, spec.rings.outer, 256, 1);
    }
    // Fit the planet (and rings) to the frame.
    const extent = spec.rings ? spec.rings.outer * 0.98 : 1.18;
    const fit = Math.tan((camera.fov / 2) * DEG) * camera.position.z * Math.min(1, camera.aspect);
    system.scale.setScalar(fit / extent);
    system.rotation.set(0, 0, 0);
    system.rotation.z = -spec.tiltDeg * DEG;
    system.rotation.x = spec.rings ? 0.42 : 0.12;
    current = spec;
    pending = null;
  }

  function frame(_time: number, dt: number) {
    const target = pending ? 0 : current ? 1 : 0;
    opacity += (target - opacity) * Math.min(1, dt * (target ? 3.5 : 9));
    if (pending && opacity < 0.02) apply(pending);
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
    spin += dt * (current?.spin ?? 0);
    planet.rotation.y = spin;
    material.uniforms.cloudOffset.value = -spin * 0.01;
    material.uniforms.opacity.value = opacity;
    ringMaterial.uniforms.opacity.value = opacity;
    scene.rotation.set(pointer.y * 0.08, pointer.x * 0.12, 0);
    const scale = 0.94 + 0.06 * opacity;
    scene.scale.setScalar(scale);
    renderer.render(scene, camera);
  }

  const running = loop(frame);

  return {
    show(spec: WorldSpec) {
      if (spec === current && !pending) return;
      pending = spec;
      if (!current) apply(spec);
    },
    setPointer(x: number, y: number) {
      pointer.tx = x;
      pointer.ty = y;
    },
    setActive: running.setActive,
    destroy() {
      running.stop();
      observer.disconnect();
      renderer.dispose();
      planet.geometry.dispose();
      ring.geometry.dispose();
      material.dispose();
      ringMaterial.dispose();
    }
  };
}
