import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BIGDATACLOUD_BASE = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

/**
 * Reverse-geocode a lat/lon to a friendly description (country, ocean, or
 * locality). Powered by BigDataCloud's free client API. Cached briefly so
 * the ISS panel doesn't hammer the upstream as the station moves.
 */
export const GET: RequestHandler = async ({ fetch, url, setHeaders }) => {
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  if (
    lat === null ||
    lon === null ||
    !lat.trim() ||
    !lon.trim() ||
    !Number.isFinite(Number(lat)) ||
    !Number.isFinite(Number(lon)) ||
    Math.abs(Number(lat)) > 90 ||
    Math.abs(Number(lon)) > 180
  )
    throw error(400, 'Valid latitude and longitude are required');

  const upstream = `${BIGDATACLOUD_BASE}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`;

  const res = await fetch(upstream, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw error(502, `BigDataCloud returned ${res.status}`);

  const data = (await res.json()) as {
    countryName?: string;
    locality?: string;
    principalSubdivision?: string;
    localityInfo?: {
      informative?: { name: string; description?: string }[];
    };
  };

  // Build a friendly one-line description. Over land, prefer locality;
  // over ocean, the BigDataCloud "informative" array often contains the
  // ocean / sea name.
  let description = '';
  if (data.locality && data.countryName) {
    description = data.principalSubdivision
      ? `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`
      : `${data.locality}, ${data.countryName}`;
  } else if (data.countryName) {
    description = data.principalSubdivision
      ? `${data.principalSubdivision}, ${data.countryName}`
      : data.countryName;
  } else if (data.localityInfo?.informative?.length) {
    description = data.localityInfo.informative[0].name;
  } else {
    description = 'International waters';
  }

  setHeaders({
    'cache-control': 'public, max-age=60, s-maxage=60'
  });

  return json({
    description,
    countryName: data.countryName ?? '',
    fetchedAt: Date.now()
  });
};
