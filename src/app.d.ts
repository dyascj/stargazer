import type { KVNamespace } from '@cloudflare/workers-types';

declare global {
  namespace App {
    interface Platform {
      env: { LAUNCHES?: KVNamespace };
    }
  }
}

export {};
