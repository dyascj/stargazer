import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { Vector3 } from 'three';

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error'
});
after(() => server.close());
const orbits = await server.ssrLoadModule('/src/lib/components/landing/orbits.ts');
const helio = await server.ssrLoadModule('/src/lib/utils/helio.ts');
const { AU_TO_SCENE } = await server.ssrLoadModule('/src/lib/scene-config.ts');

test('Landing orbit diagram matches the explorer ephemeris in the ecliptic plane', () => {
  const target = new Vector3();
  for (const year of [1800, 1977, 2026, 2050]) {
    const date = new Date(Date.UTC(year, 5, 1));
    for (const [id, elements] of Object.entries(helio.PLANETS)) {
      const [x, y] = orbits.planetXY(elements, date);
      helio.getPlanetScenePosition(target, id, date);
      assert.ok(Math.abs(x - target.x / AU_TO_SCENE) < 1e-9, `${id} x in ${year}`);
      assert.ok(Math.abs(y + target.z / AU_TO_SCENE) < 1e-9, `${id} y in ${year}`);
    }
  }
  assert.equal(orbits.formatLightTime(1), '8 min 19 s');
});
