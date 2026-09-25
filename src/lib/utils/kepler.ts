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

/**
 * Rotate an orbit-plane point (x toward periapsis) into the J2000 ecliptic frame
 * through the argument of periapsis, inclination, and ascending node (radians).
 */
export function orbitToEcliptic<T extends { x: number; y: number; z: number }>(
  x: number,
  y: number,
  node: number,
  argPeri: number,
  inclination: number,
  out: T
): T {
  const cosO = Math.cos(node);
  const sinO = Math.sin(node);
  const cosw = Math.cos(argPeri);
  const sinw = Math.sin(argPeri);
  const cosi = Math.cos(inclination);
  const sini = Math.sin(inclination);
  out.x = (cosO * cosw - sinO * sinw * cosi) * x + (-cosO * sinw - sinO * cosw * cosi) * y;
  out.y = (sinO * cosw + cosO * sinw * cosi) * x + (-sinO * sinw + cosO * cosw * cosi) * y;
  out.z = sinw * sini * x + cosw * sini * y;
  return out;
}
