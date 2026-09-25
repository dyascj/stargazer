<script lang="ts">
  import { Vector3 } from 'three';
  import { selection } from '$stores/selection';
  import { getById, getChildren, getWorldPosition } from '$lib/registry/registry';
  import { isPlanetBody } from '$lib/registry/types';
  import { displayTime, setSimTime, setSimRate } from '$stores/simTime';
  import { selectBody, closeInfoPanel, compareOpen } from '$stores/ui';
  import { getLunarState } from '$utils/moon';
  import { iss } from '$stores/iss';
  import { tiangong, tiangongTle } from '$stores/tiangong';
  import { issTle } from '$stores/issTle';
  import { getCuratedSatelliteStore } from '$lib/registry/bodies/satellites';
  import SatellitePasses from './SatellitePasses.svelte';
  import { AU_KM, AU_TO_SCENE } from '$lib/scene-config';

  const object = $derived(getById($selection));
  const parent = $derived(getById(object?.parent));
  const children = $derived(object ? getChildren(object.id) : []);
  const satelliteStore = $derived(
    object?.id === 'iss'
      ? iss
      : object?.id === 'tiangong'
        ? tiangong
        : getCuratedSatelliteStore(object?.id ?? '')
  );
  const satelliteState = $derived(satelliteStore?.at($displayTime));
  const lunar = $derived(object?.id === 'moon' ? getLunarState($displayTime) : null);
  const tracking = $derived(
    object?.metadata.tracking ?? {
      mode: 'Approximate orbit',
      source:
        object?.id === 'moon' ? 'Truncated lunar model' : 'JPL planetary element fit, 1800–2050'
    }
  );
  const hasPosition = $derived(
    object ? !!getWorldPosition(object.id, $displayTime, new Vector3(), new Vector3()) : false
  );
  const position = new Vector3();
  const scratch = new Vector3();
  const earthPosition = new Vector3();
  // Only heliocentric entries use the AU scale. Local moon/satellite systems are diagrams.
  const distances = $derived.by(() => {
    if (!object || object.parent !== 'sun') return null;
    const pos = getWorldPosition(object.id, $displayTime, position, scratch);
    if (!pos) return null;
    const earth = getWorldPosition('earth', $displayTime, earthPosition, scratch);
    return {
      sunAU: pos.length() / AU_TO_SCENE,
      earthKm: earth ? (pos.distanceTo(earth) / AU_TO_SCENE) * AU_KM : 0
    };
  });
  function snapshotDate() {
    const epoch = tracking.epoch?.replace(' TDB', 'Z');
    if (epoch) {
      setSimTime(new Date(epoch));
      setSimRate(0);
    }
  }
  const number = (value: number, digits = 0) =>
    value.toLocaleString('en-US', { maximumFractionDigits: digits });
</script>

{#snippet stat(label: string, value: string)}
  <div class="inspector-stat">
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
{/snippet}
{#if object}
  <div class="inspector">
    <div class="inspector-top">
      <button
        class="icon-button"
        type="button"
        aria-label="Close info panel"
        onclick={closeInfoPanel}>×</button
      >
    </div>
    {#if parent && parent.id !== 'sun'}<button
        type="button"
        class="parent-link"
        onclick={() => selectBody(parent.id)}>↖ {parent.name} system</button
      >{/if}
    <h2 class="font-display">{object.name}</h2>
    <div class="tracking-status" class:unavailable={!hasPosition}>
      <span></span>{!hasPosition
        ? 'Position unavailable'
        : satelliteStore
          ? 'Predicted position'
          : tracking.mode}
    </div>
    {#if satelliteStore && !satelliteState}
      <p class="data-note">
        Orbital data is loading or unavailable for this date. Satellite predictions are limited to
        ±7 days of the element epoch. The camera shows Earth for context.
      </p>
    {:else if !hasPosition}
      <p class="data-note">
        Current position unavailable. Orbiter models are limited to ±30 days of their source epoch ({tracking.epoch ??
          'unknown'}). The camera shows the parent world for context.
      </p>
    {:else if satelliteState}
      <p class="data-note">
        SGP4 prediction for the selected time. Elements dated {new Date(satelliteState.elementEpoch)
          .toISOString()
          .slice(0, 16)
          .replace('T', ' ')} UTC.
      </p>
    {:else if tracking.mode === 'Snapshot'}
      <p class="data-note">
        A fixed position captured on {tracking.epoch}. This marker does not move with the simulation
        clock.
      </p>
      <button type="button" class="text-action" onclick={snapshotDate}
        >Set clock to snapshot →</button
      >
    {:else if tracking.epoch}
      <p class="data-note">
        Elements: {tracking.epoch.replace('T', ' ')}. Approximate motion; accuracy degrades away
        from this date.
      </p>
    {:else if tracking.mode === 'Landing site' || tracking.mode === 'Illustration'}
      <p class="data-note">{tracking.source}.</p>
    {/if}
    {#if lunar}<p class="data-note">
        Approximate phase and position from a truncated lunar model. Unsuitable for eclipse timing
        or precise sky pointing.
      </p>{/if}
    <dl class="stats-grid">
      {#if isPlanetBody(object)}
        {@render stat('Mean radius', number(object.metadata.radiusKm, 1) + ' km')}
        {#if object.metadata.dayLength}{@render stat(
            'Rotation / day',
            object.metadata.dayLength
          )}{/if}
        {#if object.metadata.yearLength}{@render stat(
            object.type === 'moon' ? 'Orbit period' : 'Year length',
            object.metadata.yearLength
          )}{/if}
      {/if}
      {#if distances}
        {@render stat(
          tracking.mode === 'Snapshot' ? 'Sun distance at epoch' : 'Distance from Sun',
          number(distances.sunAU, 3) + ' AU'
        )}
        {#if object.id !== 'earth' && tracking.mode !== 'Snapshot'}{@render stat(
            'Light time to Earth',
            number(distances.earthKm / 299792.458 / 60, 1) + ' min'
          )}{/if}
      {/if}
      {#if lunar}
        {@render stat('Moon phase', lunar.phaseName)}
        {@render stat('Illumination', number(lunar.illumination * 100, 1) + '%')}
        {@render stat('Earth distance', number(lunar.distanceKm) + ' km')}
      {/if}
      {#if satelliteState}
        {@render stat('Altitude', number(satelliteState.altitudeKm, 1) + ' km')}
        {@render stat('Speed', number(satelliteState.velocityKmh) + ' km/h')}
        {@render stat('Latitude', number(satelliteState.latitude, 2) + '°')}
        {@render stat('Longitude', number(satelliteState.longitude, 2) + '°')}
        {@render stat(
          'Sunlight',
          satelliteState.visibility === 'daylight' ? 'Sunlit' : 'In shadow'
        )}
      {/if}
    </dl>
    {#if isPlanetBody(object)}<button
        class="compare-trigger nav-chip"
        type="button"
        onclick={() => compareOpen.set(true)}>Compare world sizes <span>↔</span></button
      >{/if}
    {#if object.metadata.description || object.metadata.facts?.length}
      <details class="facts">
        <summary>About {object.name} <span>+</span></summary>
        <p class="description">{object.metadata.description}</p>
        <dl>
          {#each object.metadata.facts ?? [] as fact}<div>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>{/each}
        </dl>
      </details>
    {/if}
    {#if children.length}
      <div class="related">
        <h3 class="section-label">Around {object.name}</h3>
        <div>
          {#each children as child}<button type="button" onclick={() => selectBody(child.id)}
              >{child.name}<span>↗</span></button
            >{/each}
        </div>
      </div>
    {/if}
    <div class="sources">
      <h3 class="section-label">Sources</h3>
      <p>{tracking.source}</p>
      {#each object.metadata.sources ?? [] as source}<a
          href={source.url}
          target="_blank"
          rel="noreferrer">{source.name} ↗</a
        >{/each}
      {#if object.parent === 'sun' && object.type === 'planet'}<a
          href="https://ssd.jpl.nasa.gov/planets/approx_pos.html"
          target="_blank"
          rel="noreferrer">JPL position model ↗</a
        >{/if}
      <p class="scale-note">
        Bodies enlarged for visibility. Moon systems and satellite altitudes use a compressed
        display scale. Facts show physical values.
      </p>
    </div>
  </div>
  {#if object.id === 'iss' || object.id === 'tiangong'}
    <div class="pass-section">
      <SatellitePasses tleStore={object.id === 'iss' ? issTle : tiangongTle} />
    </div>
    <a class="mission-link" href="https://www.nasa.gov/live/" target="_blank" rel="noreferrer"
      >Watch NASA live ↗</a
    >
  {/if}
{/if}

<style>
  .inspector {
    position: relative;
    padding: 22px;
  }
  .inspector-top {
    position: absolute;
    top: 10px;
    right: 10px;
  }
  .section-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--space-text);
  }
  .parent-link {
    font-size: 11px;
    color: var(--space-muted);
    min-height: 40px;
    margin-left: -8px;
    padding: 0 8px;
  }
  h2 {
    font-size: 30px;
    padding-right: 25px;
    line-height: 1.12;
    text-transform: uppercase;
    letter-spacing: -0.03em;
    margin: 4px 0 12px;
    overflow-wrap: anywhere;
  }
  .tracking-status {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 18px 0 8px;
    font-size: 10px;
    color: var(--space-positive);
  }
  .tracking-status span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }
  .tracking-status.unavailable {
    color: var(--space-warning);
  }
  .data-note {
    font-size: 10px;
    color: var(--space-muted);
    line-height: 1.7;
  }
  .description {
    font-size: 13px;
    line-height: 1.8;
    color: var(--space-text);
    margin: 20px 0;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 1px solid var(--space-line);
  }
  :global(.inspector-stat) {
    padding: 16px 12px 16px 0;
    border-bottom: 1px solid var(--space-line);
  }
  :global(.inspector-stat dt) {
    color: var(--space-muted);
    font-size: 10px;
    margin-bottom: 7px;
  }
  :global(.inspector-stat dd) {
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    line-height: 1.5;
  }
  .compare-trigger {
    margin-top: 18px;
    width: 100%;
    justify-content: space-between;
  }
  .facts {
    margin-top: 14px;
    border-bottom: 1px solid var(--space-line);
  }
  summary {
    cursor: pointer;
    padding: 14px 0;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    list-style: none;
  }
  .facts dl div {
    display: flex;
    gap: 16px;
    justify-content: space-between;
    padding: 12px 0;
    font-size: 11px;
    line-height: 1.5;
  }
  .facts dt {
    color: var(--space-muted);
    flex-shrink: 0;
  }
  .facts dd {
    text-align: right;
  }
  .related {
    margin: 24px 0;
  }
  .related h3 {
    margin-bottom: 10px;
  }
  .related > div {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .related button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
    padding: 10px;
    font-size: 11px;
    min-height: 40px;
    background: var(--space-inset);
    border: 1px solid var(--space-line);
    border-radius: 0;
  }
  .related button span {
    color: var(--space-muted);
  }
  .sources {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sources p {
    color: var(--space-muted);
    font-size: 10px;
    line-height: 1.7;
  }
  .sources a,
  .text-action {
    color: var(--space-accent);
    font-size: 11px;
    padding: 4px 0;
  }
  .scale-note {
    padding-top: 12px;
    margin-top: 4px;
    border-top: 1px solid var(--space-line);
  }
  .pass-section {
    padding: 0 22px;
  }
  .mission-link {
    display: block;
    margin: 0 22px 22px;
    color: var(--space-accent);
    font-size: 12px;
  }
</style>
