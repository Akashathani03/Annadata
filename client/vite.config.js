import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Allows Vite's dev server to accept requests carrying a tunnel
    // host (e.g. *.loca.lt) in the Host header, which it otherwise
    // rejects as a DNS-rebinding protection. Fine for a temporary
    // public test link; not something a real production build needs.
    allowedHosts: true,
  },
  preview: {
    // Same allowance for `vite preview` (serving the production
    // build) - the dev server's HMR websocket/unbundled module graph
    // doesn't survive a tunnel well, so a tunnel-hosted test link
    // should go through the production build + preview server, not
    // the dev server, and this needs the same host allowance.
    allowedHosts: true,
  },
});
