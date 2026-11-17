interface RuntimeConfig {
  apiOrigin?: string;
}

declare global {
  interface Window {
    __AUTOREACH_CONFIG__?: RuntimeConfig;
  }
}

// The production image writes window.__AUTOREACH_CONFIG__ at start-up, so one build serves any API.
export const env = {
  apiOrigin: window.__AUTOREACH_CONFIG__?.apiOrigin ?? import.meta.env.VITE_API_ORIGIN ?? "",
};
