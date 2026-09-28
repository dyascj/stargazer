// Companion to the main Stargazer worker, deployed with `npx wrangler deploy -c workers/wrangler.jsonc`.
// It lives apart because the SvelteKit adapter owns the main worker's entry file.
import { KEY, fetchSchedule } from '../src/lib/launches.ts';

export default {
  /** www.stargazer-app.com redirects to the apex, keeping path and query. */
  fetch(request) {
    const url = new URL(request.url);
    url.protocol = 'https:';
    url.hostname = 'stargazer-app.com';
    return Response.redirect(url.href, 301);
  },

  /** Refreshes the launch schedule that /api/launches serves. A failed run keeps the last one. */
  async scheduled(_controller, env) {
    await env.LAUNCHES.put(KEY, JSON.stringify(await fetchSchedule()));
  }
};
