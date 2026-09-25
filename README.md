# Stargazer

An interactive solar system explorer built with SvelteKit, Threlte, and Three.js. Explore planets, moons, spacecraft, and a curated set of satellites; change time, compare world sizes, or check upcoming launches.

## Run locally

Requires Node **22.12 or newer**.

```sh
npm ci
npm run dev
```

Open http://localhost:5174. The landing page is prerendered and loads a small three.js hero after first paint; the 3D explorer loads on `/app`.

```sh
npm run check
npm test
npm run lint
npm run build
```

An optional `NASA_API_KEY` in `.env` enables the retained NASA APOD/NEO proxy routes. The explorer does not require a key. Satellite elements and launch schedules require internet access; failed feeds show an unavailable state.

## Controls

- Drag to orbit; scroll or pinch to zoom; right-drag or use two fingers to pan.
- Search with `/` or `Cmd/Ctrl K`. Arrow keys browse search results; Enter flies to a destination.
- Space pauses time; `+` / `−` change speed; `N` returns to now.
- `H` opens the solar system overview; `R` resets the camera; `F` toggles immersive mode.
- Click the date to choose UTC time. “Back to now” resumes the current clock.
- Open a world's information to compare physical sizes or explore nearby objects.
- Share view copies a destination link, including simulated date and speed when applicable.

## Data and accuracy

This is an educational visualization, with explicit approximations:

| Data                         | Method and limits                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planets and Pluto            | JPL approximate planetary elements, bounded to 1800–2050. Earth uses the Earth–Moon barycenter approximation.                                                           |
| Earth's Moon                 | Truncated lunar model. Approximate phase, distance, and direction; unsuitable for eclipse timing.                                                                       |
| Other moons and small bodies | Two-body propagation of dated JPL Horizons elements. Perturbations and maneuvers are omitted.                                                                           |
| Planet orbiters              | Dated Horizons elements, displayed only within 30 days of their epoch.                                                                                                  |
| Cruise spacecraft            | Fixed Horizons positions. The inspector shows the snapshot epoch.                                                                                                       |
| Rovers                       | Landing coordinates, not current rover traverses.                                                                                                                       |
| Webb                         | Illustrated Sun–Earth L2 neighborhood, not an operational trajectory.                                                                                                   |
| Earth satellites             | CelesTrak TLEs propagated with satellite.js SGP4 at the selected simulation time, restricted to ±7 days of the element epoch. This window does not guarantee precision. |
| Launches                     | The Space Devs Launch Library 2; schedules are provisional. SpaceX is included through these third-party sources.                                                       |

Heliocentric distances use 100 scene units per AU. Planet sizes are enlarged; moon systems use individual compression factors. The Sun has its own display scale. Facts and the size-comparison dialog show physical dimensions. Texture clouds, atmosphere glow, and ring shading are illustrative; they are not weather or radiative-transfer simulations.

Time controls display UTC. Element epochs from Horizons are TDB; the simple propagation treats UTC as TDB, introducing a roughly minute-scale time offset near the present. There are no light-time, aberration, or observer-location corrections in the planetary scene.

### Refresh local ephemerides

```sh
node scripts/refresh-ephemeris.mjs --dry-run
node scripts/refresh-ephemeris.mjs
npx prettier --write src/lib/registry/bodies
npm test
```

The refresh script updates each record and its epoch together. Failed objects retain their original elements and epoch; files are replaced atomically. It never commits. The existing scheduled GitHub workflow handles repository updates independently; mission descriptions and operational status still require editorial review.

Tests include 30 independent Horizons reference vectors at three epochs, Vallado's SGP4 verification vector, solver edge cases, simulation state transitions, registry invariants, and API/refresh failure handling.

## Structure

- `src/lib/registry`: object data, parent relationships, and position functions.
- `src/lib/utils`: orbital math, coordinate frames, validation, and scene interaction.
- `src/lib/stores`: simulation, selection, and subscriber-managed data feeds.
- `src/lib/components/scene`: 3D rendering and camera behavior.
- `src/lib/components/layout`: search, controls, destination information, and comparisons.
- `src/lib/components/landing`: the landing page chapters, motion primitives and its self-contained three.js scenes.
- `src/routes/api`: validated upstream data proxies.
- `scripts`: local data refresh and regression tests.

## Sources and credits

- [JPL approximate planetary positions](https://ssd.jpl.nasa.gov/planets/approx_pos.html)
- [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)
- [CelesTrak](https://celestrak.org/) and [SGP4 verification data](https://celestrak.org/publications/AIAA/2006-6753/)
- [The Space Devs Launch Library 2](https://thespacedevs.com/llapi)
- [NASA planetary facts](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- [Solar System Scope textures, CC BY 4.0](https://www.solarsystemscope.com/textures/) and NASA Earth imagery
- [NASA Eyes](https://eyes.nasa.gov/apps/solar-system/#/home), a reference for solar-system exploration

Stargazer is independent of NASA, ESA, JAXA, and SpaceX.

## License

Project code is available under the [MIT license](LICENSE). Bundled third-party assets retain their own terms; see [Third-party notices](THIRD_PARTY_NOTICES.md).

Typography uses Inter (SIL OFL 1.1). Agency logos in `static/logos` are trademarks of their owners, used only for source attribution; see [Third-party notices](THIRD_PARTY_NOTICES.md).
