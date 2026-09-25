import type { Vector3 } from 'three';

/** High-level taxonomy used by the tree, search filters, and renderer dispatch. */
export type ObjectType =
  | 'star' // Sun
  | 'planet' // Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune
  | 'dwarf-planet' // Pluto, Ceres, Eris, Haumea, Makemake
  | 'trans-neptunian' // Other objects beyond Neptune; includes dwarf planet candidates
  | 'moon' // Earth's Moon, Phobos, Deimos, Galilean moons, Titan, etc.
  | 'asteroid' // Vesta, Pallas, 16 Psyche, Eros, Bennu, Ryugu, Apophis, etc.
  | 'comet' // Halley, 67P/Churyumov-Gerasimenko, Tempel 1, etc.
  | 'earth-satellite' // ISS, Tiangong, Hubble, Sentinel-1, etc.
  | 'spacecraft' // JWST (L2), Voyager, Parker Solar Probe, MRO, etc.
  | 'lander' // Curiosity, Perseverance, Tianwen-1 rover, etc.
  | 'neo'; // Reserved for future near-Earth-object pass-by tracking

/** Which renderer component to instantiate for this body. */
export type RendererKind = 'star' | 'planet-body' | 'satellite-marker' | 'point-marker';

export interface BaseObjectMetadata {
  /** One-liner shown under the body name in the info panel. */
  subtitle?: string;
  /** NORAD / IAU / SPK / Minor Planet ID for external catalog cross-reference. */
  externalId?: string;
  /** Short prose description rendered in GenericBodyPanel. */
  description?: string;
  /** Key-value fact pairs rendered as a grid in the info panel. */
  facts?: { label: string; value: string }[];
  /** Data sources cited at the bottom of the info panel. */
  sources?: { name: string; url: string }[];
  /** Position tracking metadata shown as a status badge on the info panel. */
  tracking?: {
    /** Human-readable mode: "Live", "Snapshot", etc. */
    mode: string;
    /** Data source, e.g. "Standish/Meeus ephemeris" or "Celestrak TLE + SGP4". */
    source: string;
    /** For snapshots: the capture date (e.g., "2026-04-08"). */
    epoch?: string;
  };
}

export interface PlanetBodyMetadata extends BaseObjectMetadata {
  /** Body radius in scene units (1 unit = Earth radius). */
  radius: number;
  /** Body radius in km — for the info panel display. */
  radiusKm: number;
  /** Equirectangular albedo texture URL. Takes precedence over solidColor. */
  textureUrl?: string;
  /** Fallback solid color when no texture is available. */
  solidColor?: string;
  /**
   * Axial obliquity (radians) or IAU pole vector in scene coordinates.
   * obliquityRad → simple rotation.x; poleVec → quaternion alignment.
   */
  obliquityRad?: number;
  poleVec?: readonly [number, number, number];
  /**
   * Rotation model for the body's daily spin:
   *  - 'gmst'       — Earth's Greenwich Mean Sidereal Time (Earth only).
   *  - 'tidal-lock' — always faces parent (tidally locked moons).
   *  - 'iau-w'      — IAU 2018 W-formula; requires rotationW0Deg and rotationRateDegPerDay.
   *  - 'none'       — static (default).
   */
  rotationModel?: 'gmst' | 'tidal-lock' | 'iau-w' | 'none';
  /** IAU 2018 prime-meridian angle at J2000 (degrees). Required for 'iau-w'. */
  rotationW0Deg?: number;
  /** IAU 2018 sidereal rotation rate (degrees/day). Negative = retrograde. Required for 'iau-w'. */
  rotationRateDegPerDay?: number;
  /**
   * Visible atmosphere: scattering color (linear RGB), the height (km) of the
   * rendered shell above the surface, and a relative optical density.
   */
  atmosphere?: { color: readonly [number, number, number]; heightKm: number; density: number };
  /** Length-of-day string for the info panel (e.g. "23h 56m 04s"). */
  dayLength?: string;
  /** Year length string for the info panel (e.g. "365.25 days"). */
  yearLength?: string;
  /** Sidereal orbital period (days), used to draw the orbit. */
  orbitalPeriodDays?: number;
  /** Optional planetary ring system rendered as a flat disc. */
  hasRings?: {
    innerRadius: number;
    outerRadius: number;
    /** Alpha-strip texture sampled radially (inner → outer). */
    textureUrl: string;
    color?: string;
  };
}

export interface SatelliteMarkerMetadata extends BaseObjectMetadata {
  /** Key identifying which live position store to subscribe to. */
  liveStoreKey: 'iss' | 'tiangong';
  /** NORAD catalog number for cross-referencing with external catalogs. */
  noradId?: number;
  /** Sub-category for grouping in the LeftPanel tree. */
  satelliteCategory?: SatelliteCategory;
}

export interface PointMarkerMetadata extends BaseObjectMetadata {
  /** Sub-category for grouping in the LeftPanel tree. */
  satelliteCategory?: SatelliteCategory;
}

/** Sub-categories for grouping Earth-orbit satellites in the tree. */
export type SatelliteCategory =
  | 'space-station'
  | 'science'
  | 'weather'
  | 'earth-observation'
  | 'navigation'
  | 'communication'
  | 'internet';

export interface StarMetadata extends BaseObjectMetadata {
  /** True solar radius in km, for the info panel display. */
  radiusKm: number;
}

export type ObjectMetadata =
  PlanetBodyMetadata | SatelliteMarkerMetadata | PointMarkerMetadata | StarMetadata;

/**
 * Returns the body's offset from its parent in scene-space Cartesian, written
 * into `target`. Returns null when no valid position is available for `date`.
 */
export type OffsetFn = (date: Date, target: Vector3) => Vector3 | null;

/** A single entry in Stargazer's object registry. */
export interface TrackedObject {
  /** Unique stable identifier (lowercase kebab-case, e.g. 'iss', 'phobos'). */
  id: string;

  /** Display name. */
  name: string;

  /** Taxonomy used by the tree, search filters, and panel layout. */
  type: ObjectType;

  /** Parent body id, or null for the Sun (root). World position is composed by walking this chain. */
  parent: string | null;

  /** Position offset from parent in scene-space Cartesian. Returns null when data unavailable. */
  offsetFn: OffsetFn;

  /** Which renderer component draws this body. */
  rendererKind: RendererKind;

  /**
   * Label priority, 1 (highest) to 5. When labels overlap, higher-priority
   * labels win. Defaults to 5. The selected body is always labeled first.
   */
  labelTier?: number;

  /** Type-specific metadata. TypeScript narrows the shape when you check rendererKind. */
  metadata: ObjectMetadata;
}

/** Type guards for narrowing TrackedObject metadata by rendererKind. */
export function isPlanetBody(
  obj: TrackedObject
): obj is TrackedObject & { metadata: PlanetBodyMetadata } {
  return obj.rendererKind === 'planet-body';
}

export function isSatelliteMarker(
  obj: TrackedObject
): obj is TrackedObject & { metadata: SatelliteMarkerMetadata } {
  return obj.rendererKind === 'satellite-marker';
}

export function isPointMarker(
  obj: TrackedObject
): obj is TrackedObject & { metadata: PointMarkerMetadata } {
  return obj.rendererKind === 'point-marker';
}

export function isStar(obj: TrackedObject): obj is TrackedObject & { metadata: StarMetadata } {
  return obj.rendererKind === 'star';
}
