import { TRACKED_OBJECTS, getById } from '$lib/registry/registry';
import type { ObjectType, TrackedObject } from '$lib/registry/types';

export const TYPE_LABELS: Record<ObjectType, string> = {
  star: 'Star',
  planet: 'Planet',
  'dwarf-planet': 'Dwarf planet',
  'trans-neptunian': 'Kuiper belt object',
  moon: 'Moon',
  asteroid: 'Asteroid',
  comet: 'Comet',
  'earth-satellite': 'Satellite',
  spacecraft: 'Spacecraft',
  lander: 'Rover'
};

const SHORTCUT_IDS: [string, string[]][] = [
  [
    'Sun and planets',
    ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
  ],
  ['Moons', ['moon', 'europa', 'titan', 'enceladus']],
  ['Spacecraft', ['jwst', 'voyager-1', 'parker-solar-probe', 'perseverance']],
  ['Earth satellites', ['iss', 'hubble', 'tiangong', 'starlink-5447']],
  ['Small bodies', ['pluto', 'ceres', 'comet-67p', 'bennu']]
];

/** Curated empty-state groups. `start` is the group's offset in the flat option list. */
export const SHORTCUT_GROUPS = (() => {
  let start = 0;
  return SHORTCUT_IDS.map(([label, ids]) => {
    const bodies = ids.map((id) => getById(id)).filter((body) => !!body);
    const group = { label, bodies, start };
    start += bodies.length;
    return group;
  });
})();
export const SHORTCUTS = SHORTCUT_GROUPS.flatMap((group) => group.bodies);

// Common names people type that the registry does not carry.
const ALIASES: Record<string, string> = {
  sun: 'sol star',
  moon: 'luna',
  iss: 'space station',
  tiangong: 'css chinese space station',
  jwst: 'webb',
  hubble: 'hst',
  'parker-solar-probe': 'psp',
  'comet-67p': 'rosetta',
  'europa-clipper': 'clipper'
};

const ENTRIES = TRACKED_OBJECTS.map((body, order) => {
  const name = body.name.toLowerCase();
  const text = [
    body.id.replaceAll('-', ' '),
    name,
    body.metadata.subtitle,
    body.metadata.externalId,
    ALIASES[body.id]
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return { body, order, name, text, words: text.split(/[\s·/(),-]+/).filter(Boolean) };
});
type Entry = (typeof ENTRIES)[number];

function isSubsequence(term: string, text: string): boolean {
  let i = 0;
  for (const char of text) if (char === term[i] && ++i === term.length) return true;
  return false;
}

/** Optimal string alignment distance, bailing out once it exceeds 1. */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let previous2: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        row[j] = Math.min(row[j], previous2[j - 2] + 1);
    }
    if (Math.min(...row) > 1) return false;
    previous2 = previous;
    previous = row;
  }
  return previous[b.length] <= 1;
}

function scoreTerm(term: string, entry: Entry): number {
  if (entry.name === term) return 100;
  if (entry.name.startsWith(term)) return 80;
  if (entry.words.some((word) => word.startsWith(term))) return 60;
  if (entry.text.includes(term)) return 40;
  // Fuzzy tiers need four letters to mean anything: "voy" must not find "Observatory".
  if (term.length < 4) return 0;
  if (entry.words.some((word) => withinOneEdit(term, word))) return 25;
  if (entry.name[0] === term[0] && isSubsequence(term, entry.name)) return 10;
  return 0;
}

/** Ranked fuzzy search over names, ids, subtitles, catalog numbers, and aliases. */
export function searchBodies(query: string, limit = 40): TrackedObject[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored: { entry: Entry; score: number }[] = [];
  for (const entry of ENTRIES) {
    let score = 0;
    for (const term of terms) {
      const termScore = scoreTerm(term, entry);
      if (!termScore) {
        score = 0;
        break;
      }
      score += termScore;
    }
    if (score) scored.push({ entry, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.entry.order - b.entry.order)
    .slice(0, limit)
    .map(({ entry }) => entry.body);
}
