/**
 * Convert lat/lon (degrees) + altitude (km) into a 3D Cartesian position in scene units.
 * Treats Earth as a sphere (not WGS84) — sufficient for visualization.
 *
 * Altitude compression: the Moon's distance is compressed 12x so GEO satellites don't
 * appear farther from Earth than the Moon. LEO (< ~1900 km) uses true altitude;
 * above LEO, altitude is asymptotically compressed toward MAX_ALT_ER = 4.0 ER
 * (just inside the Moon at 5 ER). Physical altitudes are still shown accurately in
 * the info panels.
 */

const LEO_CUTOFF_ER = 0.3; // ~1,900 km; below this, altitude is true
const MAX_ALT_ER = 4.0; // asymptote; must be < Moon's ~5 ER
const COMPRESS_RATE = 0.5; // higher = steeper compression onset

function compressAltitude(altER: number): number {
  if (altER < LEO_CUTOFF_ER) return altER;
  return (
    LEO_CUTOFF_ER +
    (MAX_ALT_ER - LEO_CUTOFF_ER) * (1 - Math.exp(-COMPRESS_RATE * (altER - LEO_CUTOFF_ER)))
  );
}

export function latLonAltToVec3(
  latitudeDeg: number,
  longitudeDeg: number,
  altitudeKm: number,
  earthRadius: number,
  earthRadiusKm = 6371
): [number, number, number] {
  const lat = (latitudeDeg * Math.PI) / 180;
  const lon = (longitudeDeg * Math.PI) / 180;

  // Scene radius for the satellite's orbit. High altitudes are
  // compressed so GEO/MEO satellites stay inside the Moon's orbit.
  const altER = altitudeKm / earthRadiusKm;
  const r = earthRadius * (1 + compressAltitude(altER));

  const x = r * Math.cos(lat) * Math.cos(lon);
  const y = r * Math.sin(lat);
  const z = -r * Math.cos(lat) * Math.sin(lon);

  return [x, y, z];
}
