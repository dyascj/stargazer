/** Scene units. One unit is Earth's mean radius; every size and distance is physically true. */
export const EARTH_RADIUS = 1;
export const EARTH_RADIUS_KM = 6371;
export const KM_TO_SCENE = 1 / EARTH_RADIUS_KM;

export const AU_KM = 149_597_870.7;
/** Scene units per astronomical unit (about 23,481). */
export const AU_TO_SCENE = AU_KM * KM_TO_SCENE;

// IAU 2006 J2000 obliquity. Applied as rotation.x = -EARTH_OBLIQUITY_RAD
// to tilt the pole toward -Z (correct orientation for seasonal lighting).
const EARTH_OBLIQUITY_DEG = 23.4393;
export const EARTH_OBLIQUITY_RAD = (EARTH_OBLIQUITY_DEG * Math.PI) / 180;

export const MOON_RADIUS_KM = 1737.4;
export const MARS_RADIUS_KM = 3389.5;
export const SUN_RADIUS_KM = 695_700;
export const SUN_RADIUS = SUN_RADIUS_KM * KM_TO_SCENE;
