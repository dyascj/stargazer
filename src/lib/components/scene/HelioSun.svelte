<script lang="ts">
  import { T } from '@threlte/core';
  import { BackSide } from 'three';
  import { HELIO_SUN_RADIUS } from '$lib/scene-config';
  import { enterBody, leaveBody } from '$utils/sceneCursor';
  import { markPendingClick } from '$utils/sceneClick';

  function handlePointerDown(event: { stopPropagation: () => void }): void {
    event.stopPropagation();
    markPendingClick('sun');
  }

  // Display radius is exaggerated. Planet shaders calculate their own sunlight.
</script>

<T.Group>
  <!-- Bright core -->
  <T.Mesh
    onpointerdown={handlePointerDown}
    onpointerover={() => enterBody('Sun')}
    onpointerout={() => leaveBody()}
  >
    <T.SphereGeometry args={[HELIO_SUN_RADIUS, 64, 64]} />
    <T.MeshBasicMaterial color="#ffefa8" toneMapped={false} />
  </T.Mesh>

  <!-- Inner glow shell -->
  <T.Mesh>
    <T.SphereGeometry args={[HELIO_SUN_RADIUS * 1.18, 32, 32]} />
    <T.MeshBasicMaterial
      color="#ffd968"
      transparent
      opacity={0.32}
      side={BackSide}
      toneMapped={false}
    />
  </T.Mesh>

  <!-- Outer corona -->
  <T.Mesh>
    <T.SphereGeometry args={[HELIO_SUN_RADIUS * 1.55, 32, 32]} />
    <T.MeshBasicMaterial
      color="#ffae3e"
      transparent
      opacity={0.16}
      side={BackSide}
      toneMapped={false}
    />
  </T.Mesh>
</T.Group>
