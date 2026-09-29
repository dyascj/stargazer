// Companion to the main Stargazer worker, deployed with `npx wrangler deploy -c workers/wrangler.jsonc`.
// It lives apart because the SvelteKit adapter owns the main worker's entry file.
import { KEY, fetchSchedule } from '../src/lib/launches.ts';
import { refreshTles } from '../src/lib/server/tle.ts';

export default {
  /** www.stargazer-app.com redirects to the apex, keeping path and query. */
  fetch(request) {
    const url = new URL(request.url);
    url.protocol = 'https:';
    url.hostname = 'stargazer-app.com';
    return Response.redirect(url.href, 301);
  },

  /**
   * Refreshes the feeds the site serves from KV: satellite elements every two hours (CelesTrak's
   * update cadence), the launch schedule every 10 minutes. A failed run keeps the last copy.
   */
  async scheduled(controller, env) {
    if (controller.cron === '0 */2 * * *') return refreshTles(fetch, env.FEEDS);
    await env.FEEDS.put(KEY, JSON.stringify(await fetchSchedule()));
  }
};
