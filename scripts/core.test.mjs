import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { Quaternion, Vector3 } from 'three';
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
const earthFrame = await load('utils/earth');
const orbits = await load('utils/orbit');
const rotation = await load('utils/rotation');
const frames = await load('utils/frames');
const passes = await load('utils/passes');
const poles = await load('utils/pole');
const { AU_KM, AU_TO_SCENE, EARTH_RADIUS_KM } = await load('scene-config');
const date = (record) => new Date((record.jd - 2440587.5) * 86400000);
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

test('One true scale: scene units are Earth radii everywhere, including AU distances', () => {
  assert.ok(Math.abs(AU_TO_SCENE - AU_KM / EARTH_RADIUS_KM) < 1e-9);
  const elements = {
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
        .computeMoonOffset({ ...elements, a_km: EARTH_RADIUS_KM * 2 }, date, new Vector3())
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
    const when = date(record);
    const actual = (
      record.id === 'earth'
        ? earthFrame.getEarthScenePosition(new Vector3(), when)
        : helio.getPlanetScenePosition(new Vector3(), record.id, when)
    ).divideScalar(AU_TO_SCENE);
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

test('Lunar model tracks Horizons in the J2000 frame to within a tenth of a degree', () => {
  let worstAngle = 0;
  let worstDistance = 0;
  for (const record of fixture.records.filter((r) => r.id === 'moon')) {
    const state = lunar.getLunarState(date(record));
    const expected = new Vector3(record.x, record.y, record.z);
    const lon = (state.eclipticLon * Math.PI) / 180,
      lat = (state.eclipticLat * Math.PI) / 180;
    const actual = new Vector3(
      Math.cos(lat) * Math.cos(lon),
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat)
    );
    worstAngle = Math.max(worstAngle, (actual.angleTo(expected) * 180) / Math.PI);
    worstDistance = Math.max(
      worstDistance,
      Math.abs(state.distanceKm / (expected.length() * AU_KM) - 1)
    );
    assert.ok(state.illumination >= 0 && state.illumination <= 1);
    // The scene offset is the same vector at true scale, relative to Earth's center.
    const offset = lunar.getMoonInertialOffset(new Vector3(), date(record));
    assert.ok(
      Math.abs((offset.length() * EARTH_RADIUS_KM) / state.distanceKm - 1) < 1e-12,
      'Moon distance is not compressed'
    );
  }
  console.log('Lunar model worst errors:', { worstAngle, worstDistance });
  assert.ok(worstAngle < 0.1, `Moon direction error ${worstAngle}°`);
  assert.ok(worstDistance < 0.001, `Moon distance error ${worstDistance}`);
});

test('Earth sits at the geocenter, offset from the JPL Earth–Moon barycenter', () => {
  const when = new Date('2026-09-06T00:00:00Z');
  const barycenter = helio.getPlanetScenePosition(new Vector3(), 'earth', when);
  const earth = earthFrame.getEarthScenePosition(new Vector3(), when);
  const moon = lunar.getMoonInertialOffset(new Vector3(), when);
  const offsetKm = earth.distanceTo(barycenter) * EARTH_RADIUS_KM;
  assert.ok(offsetKm > 4000 && offsetKm < 5000, `barycenter offset ${offsetKm} km`);
  // The barycenter lies on the Earth–Moon line, on the Moon's side.
  assert.ok(barycenter.clone().sub(earth).angleTo(moon) < 1e-9);
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

test('SGP4 verification vector and pass prediction', () => {
  const result = satellite.sgp4(satrec, 0);
  assert.ok(Math.abs(result.position.x - 7022.46529266) < 0.001);
  assert.ok(Math.abs(result.position.y + 1400.08296755) < 0.001);
  assert.ok(Math.abs(result.position.z - 0.03995155) < 0.001);
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

test('NASA proxy rejects unlisted paths before fetching', async () => {
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
        {
          id: 'odd',
          name: 'Malformed fields',
          net: new Date(Date.now() + 2 * 86400000).toISOString(),
          status: { name: 7 }
        },
        { id: 'past', name: 'Completed launch', net: '2000-01-01T00:00:00Z' },
        { id: 12, name: 'bad', net: 'invalid' },
        null
      ]
    });
  };
  const body = await (await endpoint.GET({ fetch: fetcher, setHeaders })).json();
  assert.equal(body.launches.length, 2);
  assert.equal(body.launches[0].provider, 'SpaceX');
  assert.equal(body.launches[1].status, 'Schedule provisional');
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
  assert.equal(first('prsvrnc'), 'perseverance');
  // Short queries match literally: no typo or subsequence hits like "Observatory".
  assert.deepEqual(
    searchBodies('voy').map((body) => body.id),
    ['voyager-1', 'voyager-2']
  );
  assert.deepEqual(searchBodies('   '), []);
  assert.deepEqual(searchBodies('zzzzqqq'), []);
  assert.equal(
    SHORTCUTS.length,
    SHORTCUT_GROUPS.reduce((sum, group) => sum + group.bodies.length, 0)
  );
  for (const group of SHORTCUT_GROUPS)
    assert.equal(SHORTCUTS[group.start], group.bodies[0], `${group.label} offset`);
});

test('SGP4 positions reach the scene through the Earth-fixed frame without distortion', () => {
  // Treating geodetic latitude and ellipsoid height as spherical coordinates
  // displaced satellites by up to ~20 km; the Earth-fixed path is exact.
  for (const minutes of [0, 40, 80, 120, 160]) {
    const when = new Date(epoch.getTime() + minutes * 60000);
    const { position } = satellite.propagate(satrec, when);
    const ecf = satellite.eciToEcf(position, satellite.gstime(when));
    const offset = earthFrame.ecfKmToInertialOffset(ecf, new Vector3(), when);
    const radiusKm = Math.hypot(position.x, position.y, position.z);
    assert.ok(Math.abs(offset.length() * EARTH_RADIUS_KM - radiusKm) < 1e-6);
  }
  // Earth-fixed x/y/z land on the mesh axes: 0° longitude +X, north +Y, east -Z.
  const local = earthFrame.ecfKmToEarthLocal({ x: 1, y: 2, z: 3 }, new Vector3());
  assert.ok(local.multiplyScalar(EARTH_RADIUS_KM).distanceTo(new Vector3(1, 3, -2)) < 1e-12);
});

test('Orbit periods come from catalogued values or vis-viva; static snapshots have none', () => {
  const when = new Date('2026-09-06T00:00:00Z');
  const days = (id) => orbits.orbitalPeriodMs(registry.getById(id), when) / 86400000;
  assert.ok(Math.abs(days('earth') - 365.256) < 0.5, `Earth ${days('earth')}`);
  assert.ok(Math.abs(days('mars') - 686.98) < 3, `Mars ${days('mars')}`);
  assert.ok(Math.abs(days('moon') - 27.32166) < 1e-9);
  assert.ok(Math.abs(days('ceres') - 1680.2) < 5, `Ceres ${days('ceres')}`);
  assert.equal(orbits.orbitalPeriodMs(registry.getById('voyager-1'), when), null);
  // Samples start at the body and end one period earlier, densest at both ends.
  assert.equal(orbits.orbitSampleOffsetMs(0, 64, 1000), 0);
  assert.ok(Math.abs(orbits.orbitSampleOffsetMs(63, 64, 1000) - 1000) < 1e-9);
  assert.ok(orbits.orbitSampleOffsetMs(1, 64, 1000) < 1000 / 63 / 5);
});

test('True-scale placements: Moon, Webb at L2, Mars landers, and physical radii', () => {
  const when = new Date('2026-09-06T00:00:00Z');
  const km = (id, parent) => {
    const a = registry.getWorldPosition(id, when, new Vector3(), new Vector3());
    const b = registry.getWorldPosition(parent, when, new Vector3(), new Vector3());
    return a.distanceTo(b) * EARTH_RADIUS_KM;
  };
  assert.ok(km('moon', 'earth') > 356000 && km('moon', 'earth') < 407000);
  assert.ok(Math.abs(km('jwst', 'earth') / 1.5e6 - 1) < 0.02, `L2 ${km('jwst', 'earth')}`);
  assert.ok(Math.abs(km('curiosity', 'mars') - 3389.5) < 1e-6);
  const phobos = km('phobos', 'mars');
  assert.ok(phobos > 9200 && phobos < 9550, `Phobos ${phobos}`);
  for (const body of registry.TRACKED_OBJECTS)
    if (body.rendererKind === 'planet-body')
      assert.ok(
        Math.abs(body.metadata.radius * EARTH_RADIUS_KM - body.metadata.radiusKm) < 1e-9,
        `${body.id} is drawn at its physical radius`
      );
});

test('IAU rotation elements match the WGCCRE reports', () => {
  // [RA, Dec, W0, W rate] for the J2000 epoch (Archinal et al. 2011 and 2018).
  const iau = {
    mercury: [281.0103, 61.4155, 329.5469, 6.1385025],
    venus: [272.76, 67.16, 160.2, -1.4813688],
    mars: [317.68143, 52.8865, 176.63, 350.89198226],
    jupiter: [268.056595, 64.495303, 284.95, 870.536],
    saturn: [40.589, 83.537, 38.9, 810.7939024],
    uranus: [257.311, -15.175, 203.81, -501.1600928],
    neptune: [299.36, 43.46, 253.18, 536.3128492],
    pluto: [132.993, -6.163, 302.695, 56.3625225]
  };
  for (const [id, [ra, dec, w0, rate]] of Object.entries(iau)) {
    const meta = registry.getById(id).metadata;
    const pole = new Vector3(...frames.equatorialToScene(ra, dec));
    assert.ok(new Vector3(...meta.poleVec).angleTo(pole) < 1e-9, `${id} pole`);
    assert.equal(meta.rotationW0Deg, w0, `${id} W0`);
    assert.equal(meta.rotationRateDegPerDay, rate, `${id} rotation rate`);
  }
  // The ecliptic north pole is at RA 18h, Dec 66.56° in J2000 equatorial coordinates.
  const eclipticPole = frames.equatorialToScene(270, 90 - 23.4393);
  assert.ok(new Vector3(...eclipticPole).angleTo(new Vector3(0, 1, 0)) < 1e-9);
  // The Galactic Center (RA 266.405°, Dec -28.936°) is the galactic +X axis.
  const center = new Vector3(1, 0, 0).applyMatrix4(frames.GALACTIC_TO_SCENE);
  assert.ok(center.angleTo(new Vector3(...frames.equatorialToScene(266.405, -28.936))) < 1e-4);
});

test('Tidally locked moons face their planet and spin about its pole', () => {
  const when = new Date('2026-09-06T00:00:00Z');
  const miranda = registry.getById('miranda');
  const uranusPole = new Vector3(...registry.getById('uranus').metadata.poleVec);
  const offset = miranda.offsetFn(when, new Vector3());
  const q = rotation.tidalLockQuaternion(
    offset,
    registry.getById('uranus').metadata.poleVec,
    new Quaternion()
  );
  const facing = new Vector3(1, 0, 0).applyQuaternion(q);
  assert.ok(facing.angleTo(offset.clone().negate()) < 1e-6);
  // Miranda orbits 4.3° from Uranus's equator; ecliptic north would be ~82° off.
  assert.ok((new Vector3(0, 1, 0).applyQuaternion(q).angleTo(uranusPole) * 180) / Math.PI < 5);
});

test('Screen-space picking prefers visible markers, then the nearest disc', async () => {
  const { createScreenBodies, pickBody, isOccluded, placeLabels } = await load('utils/screenSpace');
  const screen = createScreenBodies(3);
  // 0: a planet disc at the center; 1: a moon marker in front of it; 2: a moon behind it.
  screen.x.set([100, 130, 105]);
  screen.y.set([100, 100, 100]);
  screen.depth.set([50, 40, 60]);
  screen.radius.set([40, 0.5, 0.5]);
  screen.markerAlpha.set([0, 0.9, 0.9]);
  assert.equal(pickBody(screen, 131, 101, 14), 1);
  assert.equal(pickBody(screen, 100, 100, 14), 2, 'a visible marker wins over the disc');
  assert.ok(isOccluded(screen, 105, 100, 60, 2));
  assert.ok(!isOccluded(screen, 130, 100, 40, 1));
  screen.markerAlpha[2] = 0;
  assert.equal(pickBody(screen, 90, 100, 14), 0);
  assert.equal(pickBody(screen, 300, 300, 14), -1);
  // Label placement keeps the higher-priority label when two overlap.
  const placed = new Uint8Array(3);
  const count = placeLabels(
    [2, 0, 1],
    3,
    [10, 200, 0],
    [0, 5, 0],
    [50, 50, 50],
    [20, 20, 20],
    placed
  );
  assert.equal(count, 2);
  assert.deepEqual([...placed], [0, 1, 1]);
});

test('Fly-to paths pull back on long hops and frame lit, open-ringed worlds', async () => {
  const flight = await load('utils/flight');
  // Mid-flight the camera is far enough back to see both endpoints.
  const mid = Math.exp(flight.flightLogDistance(10, 20, 1e6, 0.5));
  assert.ok(mid > 1e6 && mid < 1.2e6);
  assert.ok(Math.abs(Math.exp(flight.flightLogDistance(10, 20, 1e6, 1)) - 20) < 1e-9);
  assert.ok(Math.abs(Math.exp(flight.flightLogDistance(10, 20, 0, 0.5)) - Math.sqrt(200)) < 1e-9);
  assert.ok(
    flight.flightDuration(10, 20, 1e6) <= 3000 && flight.flightDuration(10, 20, 50) >= 1200
  );
  // A planet is seen within 60° of its sunlit side.
  const planet = new Vector3(AU_TO_SCENE, 0, 0);
  const view = flight.framingDirection(planet, null, true, null, new Vector3());
  assert.ok(view.angleTo(planet.clone().negate().normalize()) < Math.PI / 3);
  // Rings are opened toward the viewer.
  const pole = new Vector3(0, 0.88, -0.47).normalize();
  const ringed = flight.framingDirection(planet, null, true, pole, new Vector3());
  assert.ok(Math.abs(ringed.dot(pole)) > 0.5);
  // Low orbit looks along the horizon, side-lit, slightly from above.
  const earth = new Vector3(AU_TO_SCENE, 0, 0);
  const station = earth.clone().add(new Vector3(0, 1.07, 0));
  const horizon = flight.framingDirection(station, earth, false, null, new Vector3(), 1);
  const up = station.clone().sub(earth).normalize();
  assert.ok(horizon.dot(up) > 0.15 && horizon.dot(up) < 0.35);
  assert.ok(Math.abs(horizon.dot(earth.clone().negate().normalize())) < 0.1);
});
