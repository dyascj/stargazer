/** Per-body screen projection for one frame, in CSS pixels. */
export interface ScreenBodies {
  count: number;
  x: Float64Array;
  y: Float64Array;
  /** Camera distance; 0 or less when behind the camera. */
  depth: Float64Array;
  /** Projected physical radius. */
  radius: Float64Array;
  /** Marker opacity; markers below MIN_MARKER_ALPHA cannot be picked. */
  markerAlpha: Float64Array;
}

export function createScreenBodies(count: number): ScreenBodies {
  return {
    count,
    x: new Float64Array(count),
    y: new Float64Array(count),
    depth: new Float64Array(count),
    radius: new Float64Array(count),
    markerAlpha: new Float64Array(count)
  };
}

const MIN_MARKER_ALPHA = 0.2;

/**
 * Body under a pointer. Visible markers win over discs, because markers
 * are hidden when something occludes them; among markers the closest to the
 * pointer wins. Otherwise the nearest disc containing the point wins.
 */
export function pickBody(screen: ScreenBodies, px: number, py: number, hitPx: number): number {
  let marker = -1;
  let markerDistance = Infinity;
  let disc = -1;
  let discDepth = Infinity;
  for (let i = 0; i < screen.count; i++) {
    if (screen.depth[i] <= 0) continue;
    const distance = Math.hypot(px - screen.x[i], py - screen.y[i]);
    if (
      screen.markerAlpha[i] >= MIN_MARKER_ALPHA &&
      distance <= hitPx &&
      distance < markerDistance
    ) {
      marker = i;
      markerDistance = distance;
    }
    if (distance <= screen.radius[i] && screen.depth[i] < discDepth) {
      disc = i;
      discDepth = screen.depth[i];
    }
  }
  return marker >= 0 ? marker : disc;
}

/** Whether a nearer projected disc hides the point (x, y) at `depth`. */
export function isOccluded(
  screen: ScreenBodies,
  x: number,
  y: number,
  depth: number,
  self: number
): boolean {
  for (let i = 0; i < screen.count; i++) {
    if (i === self || screen.radius[i] < 1 || screen.depth[i] <= 0) continue;
    if (screen.depth[i] < depth && Math.hypot(x - screen.x[i], y - screen.y[i]) < screen.radius[i])
      return true;
  }
  return false;
}

/** Whether (x, y) falls within `margin` of a projected disc of at least `minRadius`, at any depth. */
export function insideDisc(
  screen: ScreenBodies,
  x: number,
  y: number,
  minRadius: number,
  self: number,
  margin = 0
): boolean {
  for (let i = 0; i < screen.count; i++) {
    if (i === self || screen.radius[i] < minRadius || screen.depth[i] <= 0) continue;
    if (Math.hypot(x - screen.x[i], y - screen.y[i]) < screen.radius[i] + margin) return true;
  }
  return false;
}

/**
 * Greedy label placement: walks candidates in priority order and accepts a
 * label only if its rectangle (plus a small gap) overlaps none already placed.
 * Writes 1 into `placed` for accepted candidates; returns how many.
 */
export function placeLabels(
  order: ArrayLike<number>,
  count: number,
  left: ArrayLike<number>,
  top: ArrayLike<number>,
  width: ArrayLike<number>,
  height: ArrayLike<number>,
  placed: Uint8Array,
  gap = 4
): number {
  placed.fill(0);
  let accepted = 0;
  for (let n = 0; n < count; n++) {
    const i = order[n];
    let free = true;
    for (let m = 0; m < n && free; m++) {
      const j = order[m];
      if (!placed[j]) continue;
      free =
        left[i] + width[i] + gap <= left[j] ||
        left[j] + width[j] + gap <= left[i] ||
        top[i] + height[i] + gap <= top[j] ||
        top[j] + height[j] + gap <= top[i];
    }
    if (free) {
      placed[i] = 1;
      accepted++;
    }
  }
  return accepted;
}
