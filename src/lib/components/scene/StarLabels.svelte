<script lang="ts">
  import { T } from '@threlte/core';
  import { HTML } from '@threlte/extras';

  /**
   * Famous reference stars labelled in the starfield.
   *
   * Pure orientation aids — these are the brightest, most-recognised
   * stars in the night sky, placed at their J2000 equatorial
   * coordinates and converted into the scene's ecliptic frame so
   * they sit in the right direction relative to the planets.
   *
   * Coordinates source:
   *   - HIPPARCOS catalogue values (J2000), rounded to two decimals.
   *   - Visual magnitudes are not used here; only direction matters.
   *
   * Frame conversion:
   *   1. RA / Dec → equatorial Cartesian unit vector
   *   2. Rotate around X by −obliquity (≈23.44°) → ecliptic vector
   *   3. Map ecliptic (x, y, z) → scene (x, z, −y) (matches the
   *      convention used by helio.ts and the rest of the registry)
   *   4. Multiply by `STAR_DISTANCE` so the label sits well past
   *      every body in the scene but inside the 100 000 far plane.
   */

  type Star = {
    name: string;
    raHours: number; // 0..24
    decDeg: number; // -90..+90
  };

  const STARS: Star[] = [
    { name: 'Sirius', raHours: 6.7525, decDeg: -16.7161 },
    { name: 'Canopus', raHours: 6.3992, decDeg: -52.6957 },
    { name: 'Arcturus', raHours: 14.2611, decDeg: 19.1825 },
    { name: 'Vega', raHours: 18.6156, decDeg: 38.7836 },
    { name: 'Capella', raHours: 5.2781, decDeg: 45.998 },
    { name: 'Rigel', raHours: 5.2422, decDeg: -8.2017 },
    { name: 'Procyon', raHours: 7.6553, decDeg: 5.225 },
    { name: 'Betelgeuse', raHours: 5.9192, decDeg: 7.4069 },
    { name: 'Altair', raHours: 19.8464, decDeg: 8.8683 },
    { name: 'Aldebaran', raHours: 4.5987, decDeg: 16.5093 },
    { name: 'Spica', raHours: 13.4199, decDeg: -11.1614 },
    { name: 'Antares', raHours: 16.4901, decDeg: -26.4319 },
    { name: 'Pollux', raHours: 7.7553, decDeg: 28.0262 },
    { name: 'Fomalhaut', raHours: 22.9608, decDeg: -29.6222 },
    { name: 'Deneb', raHours: 20.6906, decDeg: 45.2803 },
    { name: 'Polaris', raHours: 2.5303, decDeg: 89.2641 }
  ];

  const STAR_DISTANCE = 8000; // scene units; well inside the 100 000 far plane
  const OBLIQUITY_RAD = (23.4393 * Math.PI) / 180;

  /**
   * Convert RA (hours) + Dec (degrees) into a scene-frame Cartesian
   * direction multiplied by STAR_DISTANCE. See the header comment
   * for the frame conventions.
   */
  function starPosition(star: Star): [number, number, number] {
    const ra = star.raHours * 15 * (Math.PI / 180); // hours → radians
    const dec = star.decDeg * (Math.PI / 180);

    // Equatorial Cartesian unit vector
    const xEq = Math.cos(dec) * Math.cos(ra);
    const yEq = Math.cos(dec) * Math.sin(ra);
    const zEq = Math.sin(dec);

    // Rotate around X by −obliquity → ecliptic frame
    const cosE = Math.cos(OBLIQUITY_RAD);
    const sinE = Math.sin(OBLIQUITY_RAD);
    const xEc = xEq;
    const yEc = yEq * cosE + zEq * sinE;
    const zEc = -yEq * sinE + zEq * cosE;

    // Map ecliptic (x, y, z) → scene (x, z, −y)
    return [xEc * STAR_DISTANCE, zEc * STAR_DISTANCE, -yEc * STAR_DISTANCE];
  }

  // Precompute positions once at module load — stars don't move.
  const STARS_WITH_POS = STARS.map((s) => ({
    name: s.name,
    pos: starPosition(s)
  }));
</script>

{#each STARS_WITH_POS as star (star.name)}
  <T.Group position={star.pos}>
    <HTML transform={false} pointerEvents="none" center zIndexRange={[30, 0]}>
      <div class="star-label">{star.name}</div>
    </HTML>
  </T.Group>
{/each}

<style>
  .star-label {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
    color: #f5f0e8b3;
    text-shadow: 0 0 6px rgba(15, 23, 42, 0.75);
    pointer-events: none;
    white-space: nowrap;
    transform: translate(8px, -50%);
  }
</style>
