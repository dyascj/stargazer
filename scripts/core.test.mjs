import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { Vector3 } from 'three';
import { get } from 'svelte/store';
import * as satellite from 'satellite.js';
import { replaceBody, replaceNumber, parseResult } from './refresh-ephemeris.mjs';

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error'
});
after(() => server.close());
const load = (path) => server.ssrLoadModule(`/src/lib/${path}.ts`);
const kepler = await load('utils/kepler');
const helio = await load('utils/helio');
const moons = await load('utils/moons');
const lunar = await load('utils/moon');
const time = await load('stores/simTime');
const registry = await load('registry/registry');
const tle = await load('utils/tle');
const orbit = await load('utils/issOrbit');
const passes = await load('utils/passes');
const poles = await load('utils/pole');
const { AU_KM, AU_TO_SCENE, EARTH_RADIUS_KM } = await load('scene-config');
const fixture = JSON.parse(
  await readFile(new URL('./fixtures/horizons.json', import.meta.url), 'utf8')
);

// Vallado's public SGP4 verification case 00005 (CelesTrak AIAA-2006-6753).
const line1 = '1 00005U 58002B   00179.78495062  .00000023  00000-0  28098-4 0  4753';
const line2 = '2 00005  34.2682 348.7242 1859667 331.7664  19.3264 10.82419157413667';
const satrec = satellite.twoline2satrec(line1, line2);
const epoch = new Date((satrec.jdsatepoch - 2440587.5) * 86400000);

test('Kepler converges across circular and near-parabolic elliptic orbits', () => {
  for (const eccentricity of [0, 0.01, 0.5, 0.95, 0.999, 0.999999]) {
    for (const mean of [-1000, -Math.PI, -0.001, 0, 0.001, Math.PI, 1000]) {
      const eccentric = kepler.solveKepler(mean, eccentricity);
      const normalized = Math.atan2(Math.sin(mean), Math.cos(mean));
      assert.ok(
        Math.abs(Math.sin((eccentric - eccentricity * Math.sin(eccentric) - normalized) / 2)) <
          1e-10
      );
    }
  }
  assert.throws(() => kepler.solveKepler(1, 1));
  assert.throws(() => kepler.solveKepler(NaN, 0.1));
});

test('Solar small bodies use AU scale; local orbits use Earth radii', () => {
  const elements = {
    parentId: 'sun',
    a_km: AU_KM,
    e: 0,
    i_deg: 0,
    Omega_deg: 0,
    omega_deg: 0,
    M_deg: 0,
    period_days: 365.25,
    epoch_jd: 2451545
  };
  const date = new Date('2000-01-01T12:00:00Z');
  assert.ok(
    Math.abs(moons.computeMoonOffset(elements, date, new Vector3()).length() - AU_TO_SCENE) < 1e-9
  );
  assert.ok(
    Math.abs(
      moons
        .computeMoonOffset(
          { ...elements, parentId: 'earth', a_km: EARTH_RADIUS_KM * 2 },
          date,
          new Vector3()
        )
        .length() - 2
    ) < 1e-9
  );
  const ceres = registry.getWorldPosition(
    'ceres',
    new Date('2026-09-06'),
    new Vector3(),
    new Vector3()
  );
  assert.ok(ceres.length() / AU_TO_SCENE > 2.5 && ceres.length() / AU_TO_SCENE < 3.1);
});

test('Planet positions stay within educational tolerances of independent JPL vectors', () => {
  assert.equal(fixture.records.length, 30);
  const errors = {};
  for (const record of fixture.records.filter((r) => r.id !== 'moon')) {
    const date = new Date((record.jd - 2440587.5) * 86400000);
    const actual = helio
      .getPlanetScenePosition(new Vector3(), record.id, date)
      .divideScalar(AU_TO_SCENE);
    const expected = new Vector3(record.x, record.z, -record.y);
    const angleDeg = (actual.angleTo(expected) * 180) / Math.PI;
    const distanceFraction = Math.abs(actual.length() / expected.length() - 1);
    assert.ok(
      angleDeg < 0.35,
      `${record.id} angular error ${angleDeg.toFixed(4)}° at JD ${record.jd}`
    );
    assert.ok(distanceFraction < 0.015, `${record.id} radial error ${distanceFraction}`);
    errors[record.id] = Math.max(errors[record.id] ?? 0, angleDeg);
  }
  console.log('Maximum sampled planetary angular errors (degrees):', errors);
});

test('Truncated Moon model has bounded sampled errors, without precision claims', () => {
  for (const record of fixture.records.filter((r) => r.id === 'moon')) {
    const state = lunar.getLunarState(new Date((record.jd - 2440587.5) * 86400000));
    const expected = new Vector3(record.x, record.y, record.z);
    const lon = (state.eclipticLon * Math.PI) / 180,
      lat = (state.eclipticLat * Math.PI) / 180;
    const actual = new Vector3(
      Math.cos(lat) * Math.cos(lon),
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat)
    );
    assert.ok((actual.angleTo(expected) * 180) / Math.PI < 3);
    assert.ok(Math.abs(state.distanceKm / (expected.length() * AU_KM) - 1) < 0.025);
    assert.ok(state.illumination >= 0 && state.illumination <= 1);
  }
});

test('Registry identities, parent chains, finite positions, and physical radii', () => {
  assert.equal(registry.getById('__proto__'), undefined);
  assert.equal(
    new Set(registry.TRACKED_OBJECTS.map((b) => b.id)).size,
    registry.TRACKED_OBJECTS.length
  );
  const date = new Date('2026-09-06T00:00:00Z');
  for (const body of registry.TRACKED_OBJECTS) {
    if (body.parent) assert.ok(registry.getById(body.parent));
    const position = registry.getWorldPosition(body.id, date, new Vector3(), new Vector3());
    if (body.type !== 'earth-satellite' && body.id !== 'maven')
      assert.ok(position, `${body.id} has a position`);
    if (position) assert.ok(position.toArray().every(Number.isFinite), body.id);
    if (body.rendererKind === 'planet-body')
      assert.ok(body.metadata.radiusKm > 0 && body.metadata.radius > 0);
  }
  assert.equal(registry.TRACKED_OBJECTS.filter((b) => b.type === 'dwarf-planet').length, 5);
  assert.equal(registry.getById('starlink-5447').metadata.externalId, '54779');
  assert.equal(registry.getWorldPosition('maven', date, new Vector3(), new Vector3()), null);
});

test('Pausing preserves simulated date and reversing preserves direction on resume', () => {
  time.setSimTime(new Date('2024-04-08T18:00:00Z'));
  time.setSimRate(-86400);
  const before = get(time.simTime).getTime();
  time.togglePause();
  time.advanceSimTime(1000);
  assert.equal(get(time.simTime).getTime(), before);
  time.togglePause();
  assert.equal(get(time.simRate), -86400);
  time.advanceSimTime(50);
  assert.equal(get(time.simTime).getTime(), before - 4320000);
  time.togglePause();
  time.reverseTime();
  time.togglePause();
  assert.equal(get(time.simRate), 86400);
  time.setSimTime(new Date(NaN));
  assert.ok(Number.isFinite(get(time.simTime).getTime()));
  time.setSimRate(NaN);
  assert.equal(get(time.simRate), 86400);
  time.setSimTime(new Date(time.MAX_SIM_TIME - 10));
  time.advanceSimTime(50);
  assert.equal(get(time.simTime).getTime(), time.MAX_SIM_TIME);
  assert.equal(get(time.simRate), 0);
  time.resyncSimTimeToNow();
  assert.equal(get(time.isLive), true);
});

test('TLE validation rejects corrupted, mismatched and non-orbital responses', () => {
  assert.equal(tle.parseTle(`VANGUARD 1\n${line1}\n${line2}`, 5).name, 'VANGUARD 1');
  assert.throws(() => tle.parseTle(`${line1}\n${line2}`, 25544));
  assert.throws(() => tle.parseTle(`${line1.slice(0, -1)}0\n${line2}`, 5));
  assert.throws(() => tle.parseTle('<html>Rate limited</html>', 5));
});

test('SGP4 verification vector and orbit validity window', () => {
  const result = satellite.sgp4(satrec, 0);
  assert.ok(Math.abs(result.position.x - 7022.46529266) < 0.001);
  assert.ok(Math.abs(result.position.y + 1400.08296755) < 0.001);
  assert.ok(Math.abs(result.position.z - 0.03995155) < 0.001);
  const points = orbit.computeIssOrbit({ line1, line2 }, { start: epoch, samples: 120 });
  assert.equal(points.length, 360);
  assert.ok(points.every(Number.isFinite));
  assert.equal(
    orbit.computeIssOrbit({ line1, line2 }, { start: new Date(epoch.getTime() + 8 * 86400000) })
      .length,
    0
  );
  assert.throws(() => orbit.computeIssOrbit({ line1, line2 }, { samples: 1 }));
  assert.throws(() =>
    passes.computePasses(
      { line1, line2 },
      { latitude: 0, longitude: 0 },
      { stepSeconds: 0, start: epoch }
    )
  );
  const events = passes.computePasses(
    { line1, line2 },
    { latitude: 30, longitude: -90 },
    { daysAhead: 1, start: epoch }
  );
  assert.ok(events.length > 0);
  for (const event of events)
    assert.ok(
      event.endUtc > event.startUtc && event.maxElevationDeg >= 10 && event.maxElevationDeg <= 90
    );
});

test('IAU pole frame preserves pole and handedness', () => {
  for (const body of registry.TRACKED_OBJECTS) {
    const pole = body.metadata.poleVec;
    if (!pole) continue;
    const quaternion = poles.poleQuaternion(pole);
    assert.ok(
      new Vector3(0, 1, 0)
        .applyQuaternion(quaternion)
        .distanceTo(new Vector3(...pole).normalize()) < 1e-12
    );
    assert.ok(Math.abs(quaternion.length() - 1) < 1e-12);
  }
});

test('Ephemeris refresh updates only the requested body and fails atomically', () => {
  const original =
    "body({\n id: 'a',\n a_km: 10,\n epoch_jd: 2451545\n});\nbody({\n id: 'b',\n a_km: 20,\n epoch_jd: 2451546\n});";
  const edited = replaceBody(original, 'a', (block) =>
    replaceNumber(replaceNumber(block, 'a_km', 30), 'epoch_jd', 2461289.5)
  );
  assert.ok(edited.includes('a_km: 30'));
  assert.ok(edited.endsWith(original.slice(original.indexOf("body({\n id: 'b'"))));
  assert.throws(() => replaceBody(original, 'missing', (block) => block));
  assert.throws(() => replaceBody(original, 'a', (block) => replaceNumber(block, 'missing', 2)));
  assert.throws(() => replaceNumber(original, 'a_km', NaN));
  assert.throws(() => parseResult('No ephemeris for target', 'ELEMENTS'));
  assert.deepEqual(parseResult('$$SOE\n X = 1.5 Y = -2.0 Z = 3.0\n$$EOE', 'VECTORS'), {
    x: 1.5,
    y: -2,
    z: 3
  });
});

test('Satellite endpoint validates input, rejects bad upstream data, and deduplicates requests', async () => {
  const { fetchTle } = await load('server/tle');
  const unusedFetch = async () => {
    throw new Error('Should not fetch');
  };
  await assert.rejects(fetchTle(unusedFetch, '123456'), (error) => error.status === 400);
  await assert.rejects(fetchTle(unusedFetch, '0'), (error) => error.status === 400);
  await assert.rejects(
    fetchTle(async () => new Response('<html>Unavailable</html>'), '6'),
    (error) => error.status === 502
  );
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return new Response(`VANGUARD 1\n${line1}\n${line2}`);
  };
  const results = await Promise.all([fetchTle(fetcher, '5'), fetchTle(fetcher, '00005')]);
  assert.equal(calls, 1);
  assert.deepEqual(results[0], results[1]);
});

test('API boundaries reject invalid coordinates and unlisted NASA paths before fetching', async () => {
  const geocode = await server.ssrLoadModule('/src/routes/api/geocode/reverse/+server.ts');
  for (const search of ['?lat=91&lon=0', '?lat=abc&lon=1', '?lat=0&lon=181']) {
    await assert.rejects(
      geocode.GET({
        url: new URL(`https://example.test/${search}`),
        fetch: () => {
          throw new Error('Must not fetch');
        }
      }),
      (error) => error.status === 400
    );
  }
  const nasa = await load('server/nasa');
  await assert.rejects(
    nasa.fetchNasa('https://example.com', new URLSearchParams()),
    (error) => error.status === 404
  );
});

test('Launch schedule fails cleanly, normalizes records, and caches successful responses', async () => {
  const endpoint = await server.ssrLoadModule('/src/routes/api/launches/+server.ts');
  const headers = {};
  const setHeaders = (values) => Object.assign(headers, values);
  await assert.rejects(
    endpoint.GET({ fetch: async () => new Response('{}'), setHeaders }),
    (error) => error.status === 503
  );
  let requests = 0;
  const fetcher = async () => {
    requests++;
    return Response.json({
      results: [
        {
          id: 'example',
          name: 'Falcon 9 test fixture',
          net: new Date(Date.now() + 86400000).toISOString(),
          status: { name: 'Go' },
          launch_service_provider: { name: 'SpaceX' },
          pad: { name: 'Test pad' }
        },
        { id: 'past', name: 'Completed launch', net: '2000-01-01T00:00:00Z' },
        { id: 12, name: 'bad', net: 'invalid' },
        null
      ]
    });
  };
  const body = await (await endpoint.GET({ fetch: fetcher, setHeaders })).json();
  assert.equal(body.launches.length, 1);
  assert.equal(body.launches[0].provider, 'SpaceX');
  assert.equal(body.stale, false);
  await endpoint.GET({ fetch: fetcher, setHeaders });
  assert.equal(requests, 1);
  assert.match(headers['cache-control'], /s-maxage=900/);
});

test('Explorer search ranks names, aliases, catalog numbers, and near-miss typos', async () => {
  const { searchBodies, SHORTCUTS, SHORTCUT_GROUPS } = await load('components/layout/search');
  const first = (query) => searchBodies(query)[0]?.id;
  assert.equal(first('earth'), 'earth');
  assert.equal(first('sat'), 'saturn');
  assert.equal(first('hubble'), 'hubble');
  assert.equal(first('webb'), 'jwst');
  assert.equal(first('67p'), 'comet-67p');
  assert.equal(first('25544'), 'iss');
  assert.equal(first('psp'), 'parker-solar-probe');
  assert.equal(first('satrun'), 'saturn');
  assert.equal(first('jupitr'), 'jupiter');
  assert.deepEqual(searchBodies('   '), []);
  assert.deepEqual(searchBodies('zzzzqqq'), []);
  assert.equal(
    SHORTCUTS.length,
    SHORTCUT_GROUPS.reduce((sum, group) => sum + group.bodies.length, 0)
  );
  for (const group of SHORTCUT_GROUPS)
    assert.equal(SHORTCUTS[group.start], group.bodies[0], `${group.label} offset`);
});
