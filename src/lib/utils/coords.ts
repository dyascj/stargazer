/**
 * Planetocentric latitude/longitude (degrees) and altitude (km) on a sphere, in
 * a body's local mesh frame: +X at 0° longitude, +Y north, east toward -Z.
 */
export function latLonAltToVec3(
  latitudeDeg: number,
  longitudeDeg: number,
  altitudeKm: number,
  radius: number,
  radiusKm: number
): [number, number, number] {
  const lat = (latitudeDeg * Math.PI) / 180;
  const lon = (longitudeDeg * Math.PI) / 180;
  const r = radius * (1 + altitudeKm / radiusKm);
  return [r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), -r * Math.cos(lat) * Math.sin(lon)];
}
