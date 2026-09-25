import { MathUtils, Vector3, type PerspectiveCamera } from 'three';
import type { ObjectType } from '$lib/registry/types';
import { createScreenBodies, insideDisc, isOccluded, placeLabels } from '$utils/screenSpace';
import { BODIES, BODY_COUNT, RADII, parentOf, positions, valid } from './bodyState';

/**
 * Per-frame screen state shared by markers, labels, and picking. Every body
 * has a constant-size marker that fades as its true-scale mesh outgrows it,
 * collapses into its parent's marker when they overlap, and hides behind
 * nearer discs; labels follow the markers and are decluttered by priority.
 */

export const screen = createScreenBodies(BODY_COUNT);
export const markerSize = new Float64Array(BODY_COUNT);
export const labelX = new Float64Array(BODY_COUNT);
export const labelY = new Float64Array(BODY_COUNT);
export const labelWidth = new Float64Array(BODY_COUNT).fill(80);
export const labelShown = new Uint8Array(BODY_COUNT);
export const LABEL_HEIGHT = 20;

/**
 * Cross-component wiring: the hovered body (set by input), the camera's
 * distance to what it orbits (set by the camera), and the DOM labels' frame hook.
 */
export const hooks: { hovered: number; viewDistance: number; afterFrame: (() => void) | null } = {
  hovered: -1,
  viewDistance: 1,
  afterFrame: null
};

/**
 * Bodies much farther away than what the camera is looking at are context,
 * not subjects: they keep no label, and only planets keep their marker.
 */
const CONTEXT_RANGE = 600;

const MARKER_PX: Partial<Record<ObjectType, number>> = {
  star: 7,
  planet: 6.5,
  'dwarf-planet': 5.5,
  'trans-neptunian': 5,
  moon: 5,
  asteroid: 4.5,
  comet: 4.5
};
const MARKER_OPACITY: Partial<Record<ObjectType, number>> = {
  asteroid: 0.7,
  comet: 0.75,
  'trans-neptunian': 0.75,
  'earth-satellite': 0.8
};
const BASE_SIZE = Float64Array.from(BODIES, (body) => MARKER_PX[body.type] ?? 4.5);
const BASE_ALPHA = Float64Array.from(BODIES, (body) => MARKER_OPACITY[body.type] ?? 0.9);
const LANDMARK = Uint8Array.from(
  BODIES,
  (body) => +(body.type === 'planet' || body.type === 'star')
);
const PRIORITY = Float64Array.from(BODIES, (body) => body.labelTier ?? 5);

const _view = new Vector3();
const order: number[] = [];
const top = new Float64Array(BODY_COUNT);
const heights = new Float64Array(BODY_COUNT).fill(LABEL_HEIGHT);
let selected = -1;
let hovered = -1;

function rank(i: number): number {
  return i === selected ? -2 : i === hovered ? -1 : PRIORITY[i];
}

function byPriority(a: number, b: number): number {
  return rank(a) - rank(b) || screen.radius[b] - screen.radius[a];
}

export function updateOverlay(
  camera: PerspectiveCamera,
  width: number,
  height: number,
  selectedIndex: number,
  hoveredIndex: number
): void {
  selected = selectedIndex;
  hovered = hoveredIndex;
  const focal = height / 2 / Math.tan(MathUtils.degToRad(camera.fov) / 2);
  const context = hooks.viewDistance * CONTEXT_RANGE;
  for (let i = 0; i < BODY_COUNT; i++) {
    screen.depth[i] = 0;
    screen.markerAlpha[i] = 0;
    screen.radius[i] = 0;
    if (!valid[i]) continue;
    _view.copy(positions[i]).applyMatrix4(camera.matrixWorldInverse);
    if (_view.z >= 0) continue;
    const depth = _view.length();
    screen.depth[i] = depth;
    screen.x[i] = width / 2 + (focal * _view.x) / -_view.z;
    screen.y[i] = height / 2 - (focal * _view.y) / -_view.z;
    const radius = RADII[i];
    screen.radius[i] =
      radius > 0
        ? (focal * radius) / Math.sqrt(Math.max(depth * depth - radius * radius, 1e-30))
        : 0;

    let alpha = BASE_ALPHA[i];
    // The marker gives way to the real mesh once the mesh is larger than the dot.
    if (radius > 0) alpha *= 1 - MathUtils.smoothstep(screen.radius[i], 2, 4.5);
    const parent = parentOf(i);
    if (i !== selected && parent >= 0 && screen.depth[parent] > 0) {
      const apart = Math.hypot(screen.x[i] - screen.x[parent], screen.y[i] - screen.y[parent]);
      alpha *= MathUtils.smoothstep(apart, 5, 14);
    }
    if (depth > context && !LANDMARK[i] && i !== selected) alpha = 0;
    screen.markerAlpha[i] = alpha;
    markerSize[i] = BASE_SIZE[i] + (i === selected || i === hovered ? 2 : 0);
  }

  order.length = 0;
  for (let i = 0; i < BODY_COUNT; i++) {
    if (screen.depth[i] <= 0) continue;
    if (isOccluded(screen, screen.x[i], screen.y[i], screen.depth[i], i)) {
      screen.markerAlpha[i] = 0;
      continue;
    }
    const resolved = screen.radius[i] >= 2 && screen.radius[i] < height * 0.08;
    const onScreen =
      screen.x[i] > -40 &&
      screen.x[i] < width + 40 &&
      screen.y[i] > -20 &&
      screen.y[i] < height + 20;
    const labelled =
      onScreen &&
      (screen.markerAlpha[i] > 0.35 || resolved) &&
      (i === selected ||
        (screen.depth[i] < context &&
          !insideDisc(screen, screen.x[i], screen.y[i], 40, i, 12) &&
          !insideDisc(screen, screen.x[i] + labelWidth[i], screen.y[i], 40, i, 12)));
    if (labelled) {
      order.push(i);
      labelX[i] = screen.x[i] + Math.max(markerSize[i] / 2, screen.radius[i]) + 6;
      labelY[i] = screen.y[i];
      top[i] = labelY[i] - LABEL_HEIGHT / 2;
    }
  }
  order.sort(byPriority);
  placeLabels(order, order.length, labelX, top, labelWidth, heights, labelShown);
}
