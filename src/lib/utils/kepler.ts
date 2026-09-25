/** Safeguarded Newton solve for elliptic orbits, including near-parabolic comets. */
export function solveKepler(meanAnomaly: number, eccentricity: number): number {
  if (
    !Number.isFinite(meanAnomaly) ||
    !Number.isFinite(eccentricity) ||
    eccentricity < 0 ||
    eccentricity >= 1
  ) {
    throw new RangeError('Expected a finite mean anomaly and 0 ≤ eccentricity < 1');
  }
  const tau = 2 * Math.PI;
  const m = ((((meanAnomaly + Math.PI) % tau) + tau) % tau) - Math.PI;
  let low = -Math.PI;
  let high = Math.PI;
  let e = eccentricity < 0.8 ? m : m < 0 ? -Math.PI : Math.PI;
  for (let iteration = 0; iteration < 64; iteration++) {
    const residual = e - eccentricity * Math.sin(e) - m;
    if (Math.abs(residual) < 1e-12) return e;
    if (residual > 0) high = e;
    else low = e;
    const next = e - residual / (1 - eccentricity * Math.cos(e));
    e = next > low && next < high ? next : (low + high) / 2;
  }
  return e;
}
