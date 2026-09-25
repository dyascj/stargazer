import { derived, writable } from 'svelte/store';

// JPL's short-range planetary element fit is valid over this interval.
export const MIN_SIM_TIME = Date.UTC(1800, 0, 1);
export const MAX_SIM_TIME = Date.UTC(2050, 0, 1);
export const RATE_STEPS = [1, 60, 3600, 86_400, 2_592_000, 31_536_000];
export const simTime = writable(new Date());
export const simRate = writable(1);
const simIsOffsetFromWallClock = writable(false);
const simSecond = derived(simTime, (date) => Math.floor(date.getTime() / 1000));
export const displayTime = derived(simSecond, (second) => new Date(second * 1000));
export const isLive = derived(
  [simRate, simIsOffsetFromWallClock],
  ([rate, offset]) => rate === 1 && !offset
);
let resumeRate = 1;

// Plain mirrors, so the per-frame clock never subscribes and unsubscribes.
let now = new Date();
let rate = 1;
let offset = false;
simTime.subscribe((value) => (now = value));
simRate.subscribe((value) => (rate = value));
simIsOffsetFromWallClock.subscribe((value) => (offset = value));

export function setSimRate(next: number): void {
  if (!Number.isFinite(next) || Math.abs(next) > RATE_STEPS.at(-1)!) return;
  if (rate !== 0) resumeRate = rate;
  if (next !== 0) resumeRate = next;
  simIsOffsetFromWallClock.set(true);
  simRate.set(next);
}

export function togglePause(): void {
  setSimRate(rate === 0 ? resumeRate : 0);
}

export function reverseTime(): void {
  if (rate === 0) resumeRate = -resumeRate;
  else setSimRate(-rate);
}

export function stepSimRate(direction: number): void {
  const from = rate || resumeRate;
  const index = RATE_STEPS.findIndex((step) => step >= Math.abs(from));
  const next = Math.max(0, Math.min(RATE_STEPS.length - 1, index + direction));
  setSimRate(Math.sign(from) * RATE_STEPS[next]);
}

export function setSimTime(date: Date): void {
  const time = date.getTime();
  if (!Number.isFinite(time)) return;
  simTime.set(new Date(Math.max(MIN_SIM_TIME, Math.min(MAX_SIM_TIME, time))));
  simIsOffsetFromWallClock.set(true);
}

export function advanceSimTime(realDtMs: number): void {
  if (rate === 0 || !Number.isFinite(realDtMs) || realDtMs < 0) return;
  if (rate === 1 && !offset) {
    simTime.set(new Date());
    return;
  }
  // A background tab must not leap years when its animation frame resumes.
  const time = now.getTime() + Math.min(realDtMs, 100) * rate;
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
