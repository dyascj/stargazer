<script lang="ts">
  import { onMount } from 'svelte';
  const worlds = [
    {
      id: 'earth',
      name: 'Earth',
      texture: '/textures/earth_albedo_2k.webp',
      tone: [14, 35, 30]
    },
    {
      id: 'saturn',
      name: 'Saturn',
      texture: '/textures/2k_saturn.jpg',
      tone: [138, 84, 38]
    },
    {
      id: 'moon',
      name: 'Moon',
      texture: '/textures/moon_albedo_2k.webp',
      tone: [66, 64, 60]
    }
  ];
  let selected = $state(0);
  let playing = $state(true);
  let canvas: HTMLCanvasElement;
  let host: HTMLDivElement;
  let pointerX = 0;
  let pointerY = 0;
  let loaded = $state(false);
  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let alive = true,
      visible = false,
      frame = 0,
      last = 0,
      angle = 0.4,
      tilt = -0.18,
      width = 500,
      height = 500;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const textures: (ImageData | undefined)[] = [];
    worlds.forEach((world, index) => {
      const img = new Image();
      img.onload = () => {
        if (!alive) return;
        const buffer = document.createElement('canvas');
        buffer.width = 512;
        buffer.height = 256;
        const source = buffer.getContext('2d');
        if (!source) return;
        source.drawImage(img, 0, 0, 512, 256);
        textures[index] = source.getImageData(0, 0, 512, 256);
        loaded = true;
      };
      img.src = world.texture;
    });
    const points: { x: number; y: number; z: number; u: number; v: number }[] = [];
    for (let i = 0; i < 11500; i++) {
      const y = 1 - (2 * (i + 0.5)) / 11500;
      const a = i * Math.PI * (3 - Math.sqrt(5));
      const r = Math.sqrt(1 - y * y);
      const x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      points.push({
        x,
        y,
        z,
        u: Math.atan2(-z, x) / (2 * Math.PI) + 0.5,
        v: Math.acos(y) / Math.PI
      });
    }
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const dpr = Math.min(devicePixelRatio, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    resize.observe(host);
    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    observer.observe(host);
    function ring(cx: number, cy: number, radius: number, front: boolean) {
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(-0.3);
      ctx!.scale(1, 0.37);
      ctx!.beginPath();
      ctx!.arc(0, 0, radius * 1.57, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
      ctx!.strokeStyle = '#a58250';
      ctx!.globalAlpha = 0.5;
      ctx!.lineWidth = radius * 0.32;
      ctx!.stroke();
      for (let i = 0; i < 8; i++) {
        ctx!.beginPath();
        ctx!.arc(
          0,
          0,
          radius * (1.4 + i * 0.047),
          front ? 0 : Math.PI,
          front ? Math.PI : Math.PI * 2
        );
        ctx!.strokeStyle = i === 5 ? '#f5f0e8' : '#655846';
        ctx!.globalAlpha = 0.7;
        ctx!.lineWidth = i === 5 ? 4 : 0.7;
        ctx!.stroke();
      }
      ctx!.restore();
    }
    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      if (!visible || document.hidden || now - last < 33) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduced.matches && playing) angle += dt * 0.055;
      tilt += ((reduced.matches ? -0.18 : -0.18 + pointerY * 0.22) - tilt) * 0.07;
      const rotation = angle + (reduced.matches ? 0 : pointerX * 0.3);
      const cx = width * 0.5,
        cy = height * 0.48,
        radius = width * (selected === 1 ? 0.25 : 0.35);
      ctx!.clearRect(0, 0, width, height);
      ctx!.strokeStyle = '#14141413';
      ctx!.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx!.beginPath();
        ctx!.ellipse(
          cx,
          cy,
          width * (0.24 + i * 0.078),
          width * (0.24 + i * 0.078),
          0,
          0,
          Math.PI * 2
        );
        ctx!.stroke();
      }
      ctx!.setLineDash([2, 6]);
      ctx!.beginPath();
      ctx!.moveTo(cx, 28);
      ctx!.lineTo(cx, height - 20);
      ctx!.moveTo(15, cy);
      ctx!.lineTo(width - 15, cy);
      ctx!.stroke();
      ctx!.setLineDash([]);
      if (selected === 1) ring(cx, cy, radius, false);
      ctx!.fillStyle = '#e9e3d8';
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx!.fill();
      const texture = textures[selected];
      const ca = Math.cos(rotation),
        sa = Math.sin(rotation),
        ct = Math.cos(tilt),
        st = Math.sin(tilt);
      for (const p of points) {
        const x = p.x * ca + p.z * sa,
          rz = -p.x * sa + p.z * ca;
        const y = p.y * ct - rz * st,
          z = p.y * st + rz * ct;
        if (z <= 0.02) continue;
        const index =
          (Math.min(255, Math.floor(p.v * 256)) * 512 + Math.min(511, Math.floor(p.u * 512))) * 4;
        const red = texture?.data[index] ?? 110,
          green = texture?.data[index + 1] ?? 110,
          blue = texture?.data[index + 2] ?? 110;
        const luminance = (red * 0.3 + green * 0.5 + blue * 0.2) / 255;
        const shade = Math.max(0.14, -0.42 * x + 0.28 * y + 0.8 * z);
        const ink =
          selected === 0
            ? blue > red * 1.25
              ? 0.035
              : 0.85 + luminance * 0.15
            : 0.35 + luminance * 0.65;
        ctx!.globalAlpha = Math.min(0.94, ink * shade + 0.08);
        const tone = worlds[selected].tone;
        ctx!.fillStyle = `rgb(${tone[0]},${tone[1]},${tone[2]})`;
        const size = Math.max(1, width / 185) * (0.65 + z * 0.5);
        ctx!.fillRect(cx + x * radius - size / 2, cy - y * radius - size / 2, size, size);
      }
      ctx!.globalAlpha = 1;
      if (selected === 1) ring(cx, cy, radius, true);
      const satelliteAngle = reduced.matches || !playing ? 0.8 : angle * 3;
      const sx = cx + Math.cos(satelliteAngle) * width * 0.428,
        sy = cy + Math.sin(satelliteAngle) * width * 0.428;
      ctx!.fillStyle = '#e8441e';
      ctx!.fillRect(sx - 4, sy - 4, 8, 8);
      ctx!.strokeStyle = '#e8441e55';
      ctx!.strokeRect(sx - 8, sy - 8, 16, 16);
    }
    frame = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
    };
  });
</script>

<div
  class="orbital-preview"
  bind:this={host}
  role="group"
  aria-label={`Interactive pointillist illustration of ${worlds[selected].name}`}
  onpointermove={(event) => {
    const rect = host.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - 0.5;
    pointerY = (event.clientY - rect.top) / rect.height - 0.5;
  }}
  onpointerleave={() => {
    pointerX = 0;
    pointerY = 0;
  }}
>
  <canvas bind:this={canvas} class:loaded aria-hidden="true"></canvas>
  <div class="world-caption">
    <a href="/app?body={worlds[selected].id}">Meet {worlds[selected].name} ↗</a>
  </div>
</div>
<div class="preview-footer">
  <div class="world-tabs" aria-label="Preview a destination">
    {#each worlds as world, index}<button
        type="button"
        class:active={selected === index}
        aria-pressed={selected === index}
        onclick={() => (selected = index)}
      >
        {world.name}</button
      >{/each}
  </div>
  <button
    type="button"
    class="motion-toggle"
    aria-label={playing ? 'Pause illustration' : 'Animate illustration'}
    onclick={() => (playing = !playing)}>{playing ? 'Ⅱ' : '▷'}</button
  >
</div>

<style>
  .orbital-preview {
    width: 100%;
    aspect-ratio: 1;
    position: relative;
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 600ms;
  }
  canvas.loaded {
    opacity: 1;
  }
  .world-caption {
    position: absolute;
    bottom: 18px;
    left: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 20px;
    font-size: 12px;
    letter-spacing: 0.05em;
  }
  .world-caption a {
    color: #e8441e;
    padding: 12px 0;
    text-transform: none;
    white-space: nowrap;
  }
  .preview-footer {
    margin: 0 16px;
    border-top: 1px solid #14141420;
    display: flex;
    justify-content: space-between;
    padding-top: 8px;
  }
  .world-tabs {
    display: flex;
    gap: 20px;
  }
  button {
    font-size: 12px;
    text-transform: none;
    min-height: 44px;
    color: #777670;
    transition: color 160ms;
  }
  button.active {
    color: #e8441e;
  }
  button:hover {
    color: #141414;
  }
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid #e8441e;
    outline-offset: 3px;
  }
  .motion-toggle {
    width: 44px;
  }
  @media (max-width: 639px) {
    .world-tabs {
      gap: 16px;
    }
  }
</style>
