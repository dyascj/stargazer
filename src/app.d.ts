/// <reference types="@sveltejs/adapter-cloudflare" />
import type { KVNamespace } from '@cloudflare/workers-types';

declare global {
  namespace App {
    interface Platform {
      env: { FEEDS?: KVNamespace };
    }
  }
}

export {};
