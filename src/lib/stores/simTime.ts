import { derived, get, writable } from 'svelte/store';

// JPL's short-range planetary element fit is valid over this interval.
export const MIN_SIM_TIME = Date.UTC(1800, 0, 1);
export const MAX_SIM_TIME = Date.UTC(2050, 0, 1);
export const RATE_STEPS = [1, 60, 3600, 86_400, 2_592_000, 31_536_000];
export const simTime = writable(new Date());
export const simRate = writable(1);
export const simIsOffsetFromWallClock = writable(false);
export const simSecond = derived(simTime, (date) => Math.floor(date.getTime() / 1000));
export const displayTime = derived(simSecond, (second) => new Date(second * 1000));
export const isLive = derived(
  [simRate, simIsOffsetFromWallClock],
  ([rate, offset]) => rate === 1 && !offset
);
let resumeRate = 1;

export function setSimRate(rate: number): void {
  if (!Number.isFinite(rate) || Math.abs(rate) > RATE_STEPS.at(-1)!) return;
  const previous = get(simRate);
  if (previous !== 0) resumeRate = previous;
  if (rate !== 0) resumeRate = rate;
  simIsOffsetFromWallClock.set(true);
  simRate.set(rate);
}

export function togglePause(): void {
  setSimRate(get(simRate) === 0 ? resumeRate : 0);
}

export function reverseTime(): void {
  const rate = get(simRate);
  if (rate === 0) resumeRate = -resumeRate;
  else setSimRate(-rate);
}

export function stepSimRate(direction: number): void {
  const rate = get(simRate) || resumeRate;
  const index = RATE_STEPS.findIndex((step) => step >= Math.abs(rate));
  const next = Math.max(0, Math.min(RATE_STEPS.length - 1, index + direction));
  setSimRate(Math.sign(rate) * RATE_STEPS[next]);
}

export function setSimTime(date: Date): void {
  const time = date.getTime();
  if (!Number.isFinite(time)) return;
  simTime.set(new Date(Math.max(MIN_SIM_TIME, Math.min(MAX_SIM_TIME, time))));
  simIsOffsetFromWallClock.set(true);
}

export function advanceSimTime(realDtMs: number): void {
  const rate = get(simRate);
  if (rate === 0 || !Number.isFinite(realDtMs) || realDtMs < 0) return;
  if (get(isLive)) {
    simTime.set(new Date());
    return;
  }
  // A background tab must not leap years when its animation frame resumes.
  const time = get(simTime).getTime() + Math.min(realDtMs, 100) * rate;
  if (time <= MIN_SIM_TIME || time >= MAX_SIM_TIME) {
    setSimTime(new Date(time));
    setSimRate(0);
  } else simTime.set(new Date(time));
}

export function resyncSimTimeToNow(): void {
  resumeRate = 1;
  simTime.set(new Date());
  simRate.set(1);
  simIsOffsetFromWallClock.set(false);
}
