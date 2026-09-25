#!/usr/bin/env node
/** Refresh local JPL elements; --dry-run validates without writing. Never commits. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HORIZONS_API = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const SNAPSHOT_SPACECRAFT = [
  { id: 'voyager-1', command: '-31' },
  { id: 'voyager-2', command: '-32' },
  { id: 'new-horizons', command: '-98' },
  { id: 'parker-solar-probe', command: '-96' },
  { id: 'solar-orbiter', command: '-144' },
  { id: 'bepicolombo', command: '-121' },
  { id: 'lucy', command: '-49' },
  { id: 'psyche', command: '-255' },
  { id: 'juice', command: '-28' },
  { id: 'europa-clipper', command: '-159' }
];

const ELEMENT_MOONS = [
  { id: 'phobos', command: '401', center: '@499' },
  { id: 'deimos', command: '402', center: '@499' },
  { id: 'io', command: '501', center: '@599' },
  { id: 'europa', command: '502', center: '@599' },
  { id: 'ganymede', command: '503', center: '@599' },
  { id: 'callisto', command: '504', center: '@599' },
  { id: 'mimas', command: '601', center: '@699' },
  { id: 'enceladus', command: '602', center: '@699' },
  { id: 'tethys', command: '603', center: '@699' },
  { id: 'dione', command: '604', center: '@699' },
  { id: 'rhea', command: '605', center: '@699' },
  { id: 'titan', command: '606', center: '@699' },
  { id: 'iapetus', command: '608', center: '@699' },
  { id: 'miranda', command: '705', center: '@799' },
  { id: 'ariel', command: '701', center: '@799' },
  { id: 'umbriel', command: '702', center: '@799' },
  { id: 'titania', command: '703', center: '@799' },
  { id: 'oberon', command: '704', center: '@799' },
  { id: 'triton', command: '801', center: '@899' },
  { id: 'charon', command: '901', center: '@999' }
];

const MARS_ORBITERS = [
  { id: 'mro', command: '-74', center: '@499' },
  { id: 'maven', command: '-202', center: '@499' },
  { id: 'mars-express', command: '-41', center: '@499' },
  { id: 'tgo', command: '-143', center: '@499' },
  { id: 'juno', command: '-61', center: '@599' }
];

const SMALL_BODIES = [
  { id: 'ceres', command: '1;', center: '@sun' },
  { id: 'pallas', command: '2;', center: '@sun' },
  { id: 'vesta', command: '4;', center: '@sun' },
  { id: 'hygiea', command: '10;', center: '@sun' },
  { id: 'asteroid-psyche', command: '16;', center: '@sun' },
  { id: 'eros', command: '433;', center: '@sun' },
  { id: 'itokawa', command: '25143;', center: '@sun' },
  { id: 'bennu', command: '101955;', center: '@sun' },
  { id: 'ryugu', command: '162173;', center: '@sun' },
  { id: 'apophis', command: '99942;', center: '@sun' },
  { id: 'didymos', command: '65803;', center: '@sun' },
  { id: 'eris', command: '136199;', center: '@sun' },
  { id: 'haumea', command: '136108;', center: '@sun' },
  { id: 'makemake', command: '136472;', center: '@sun' },
  { id: 'sedna', command: '90377;', center: '@sun' },
  { id: 'quaoar', command: '50000;', center: '@sun' },
  { id: 'halley', command: '1P;', center: '@sun' },
  { id: 'comet-67p', command: '67P;', center: '@sun' },
  { id: 'comet-tempel-1', command: '9P;', center: '@sun' }
];

export function replaceBody(content, id, edit) {
  const start = content.indexOf(`id: '${id}'`);
  const end = content.indexOf('\n});', start);
  if (start < 0 || end < 0) throw new Error(`Cannot locate body ${id}`);
  return content.slice(0, start) + edit(content.slice(start, end)) + content.slice(end);
}

export function replaceNumber(block, field, value) {
  if (!Number.isFinite(value)) throw new Error(`Non-finite ${field}`);
  const pattern = new RegExp(`(\\b${field}:\\s*)([-+\\d_.eE]+)`);
  if (!pattern.test(block)) throw new Error(`Missing field ${field}`);
  return block.replace(pattern, (_, prefix) => prefix + String(value));
}

export function parseResult(text, kind) {
  const start = text.indexOf('$$SOE');
  const end = text.indexOf('$$EOE', start);
  if (start < 0 || end < start) throw new Error('No ephemeris at the requested epoch');
  const block = text.slice(start + 5, end);
  const read = (label) => {
    const match = block.match(new RegExp(`(?:^|\\s)${label}\\s*=\\s*([-+\\d.Ee]+)`));
    const value = match ? Number(match[1]) : NaN;
    if (!Number.isFinite(value)) throw new Error(`Invalid ${label}`);
    return value;
  };
  if (kind === 'VECTORS') return { x: read('X'), y: read('Y'), z: read('Z') };
  const elements = {
    a_km: read('A'),
    e: read('EC'),
    i_deg: read('IN'),
    Omega_deg: read('OM'),
    omega_deg: read('W'),
    M_deg: read('MA'),
    period_days: 360 / read('N')
  };
  if (
    elements.a_km <= 0 ||
    elements.e < 0 ||
    elements.e >= 1 ||
    !Number.isFinite(elements.period_days) ||
    elements.period_days <= 0
  )
    throw new Error('Unsupported orbital elements');
  return elements;
}

async function request(body, kind, jd, command = body.command) {
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: `'${command}'`,
    EPHEM_TYPE: kind,
    CENTER: `'${body.center ?? '@sun'}'`,
    REF_PLANE: 'ECLIPTIC',
    REF_SYSTEM: 'J2000',
    OUT_UNITS: kind === 'VECTORS' ? 'AU-D' : 'KM-D',
    VEC_TABLE: '1',
    VEC_CORR: 'NONE',
    MAKE_EPHEM: 'YES',
    OBJ_DATA: 'NO',
    TLIST: String(jd),
    TLIST_TYPE: 'JD',
    TIME_TYPE: 'TDB'
  });
  const response = await fetch(`${HORIZONS_API}?${params}`, {
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) throw new Error(`JPL returned ${response.status}`);
  const data = await response.json();
  const text = data.result ?? '';
  if (!text.includes('$$SOE') && text.includes('To SELECT') && command === body.command) {
    const records = [...text.matchAll(/^\s+(\d{8,})\s+/gm)];
    if (records.length) return request(body, kind, jd, records.at(-1)[1]);
  }
  return parseResult(text, kind);
}

export async function refresh({ dryRun = false } = {}) {
  const jd = Math.floor(Date.now() / 86_400_000) + 2440587.5;
  // Horizons interprets this epoch in TDB. Display it as such, without a false UTC label.
  const epoch = new Date((jd - 2440587.5) * 86_400_000).toISOString().replace('Z', ' TDB');
  const groups = [
    { file: 'spacecraft', bodies: SNAPSHOT_SPACECRAFT, kind: 'VECTORS' },
    { file: 'spacecraft', bodies: MARS_ORBITERS, kind: 'ELEMENTS' },
    { file: 'moons', bodies: ELEMENT_MOONS, kind: 'ELEMENTS' },
    { file: 'smallBodies', bodies: SMALL_BODIES, kind: 'ELEMENTS' }
  ];
  const contents = new Map(
    ['spacecraft', 'moons', 'smallBodies'].map((name) => [
      name,
      fs.readFileSync(path.join(ROOT, `src/lib/registry/bodies/${name}.ts`), 'utf8')
    ])
  );
  let failed = 0;
  let updated = 0;
  for (const group of groups) {
    for (const body of group.bodies) {
      try {
        const values = await request(body, group.kind, jd);
        const next = replaceBody(contents.get(group.file), body.id, (block) => {
          if (group.kind === 'VECTORS') {
            if (!/helioAuToScene\([^)]+\)/.test(block) || !/epoch:\s*'[^']*'/.test(block))
              throw new Error('Snapshot fields missing');
            return block
              .replace(
                /helioAuToScene\([^)]+\)/,
                `helioAuToScene(${values.x}, ${values.y}, ${values.z})`
              )
              .replace(/epoch:\s*'[^']*'/, `epoch: '${epoch}'`);
          }
          for (const [field, value] of Object.entries({ ...values, epoch_jd: jd }))
            block = replaceNumber(block, field, value);
          if (group.file === 'spacecraft') {
            if (/epoch:\s*'[^']*'/.test(block))
              block = block.replace(/epoch:\s*'[^']*'/, `epoch: '${epoch}'`);
            else block = block.replace(/tracking:\s*\{/, `tracking: { epoch: '${epoch}',`);
          }
          return block;
        });
        contents.set(group.file, next);
        updated++;
        console.log(`Updated ${body.id}`);
      } catch (error) {
        failed++;
        console.error(`Preserved ${body.id}: ${error.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  if (!dryRun) {
    for (const [name, content] of contents) {
      const destination = path.join(ROOT, `src/lib/registry/bodies/${name}.ts`);
      const temporary = destination + '.tmp';
      fs.writeFileSync(temporary, content);
      fs.renameSync(temporary, destination);
    }
  }
  console.log(
    `${updated} updated, ${failed} preserved; ${dryRun ? 'dry run' : 'local files written'}. Epoch: ${epoch}`
  );
  return { updated, failed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  refresh({ dryRun: process.argv.includes('--dry-run') })
    .then(({ updated }) => {
      if (!updated) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
