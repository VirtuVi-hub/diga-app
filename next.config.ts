import type { NextConfig } from "next";

/**
 * Sprint 5.9.1 (root-cause fix): Next.js dev mode blocks cross-origin
 * requests to dev-only assets/endpoints by default — confirmed live via
 * the dev server's own log: "Blocked cross-origin request to Next.js dev
 * resource /_next/webpack-hmr from '<tunnel-host>'." This is what broke
 * sign-in through the Cloudflare tunnel: the browser session on the
 * tunnel's origin was never a trusted dev origin, so the dev server
 * rejected requests from it, and the client-side auth flow could never
 * complete cleanly, always landing back on /auth.
 *
 * Reads the current tunnel host straight from `NEXT_PUBLIC_APP_URL`
 * (already rewritten on every `npm run tunnel` run by
 * `scripts/dev-tunnel.sh`) instead of hardcoding a specific ephemeral
 * quick-tunnel subdomain here — no code change needed the next time the
 * tunnel gets a new random URL, matching the same
 * "point the app at a different environment via env var, not code" pattern
 * `lib/invitations/share-links.ts` already established.
 */
const allowedDevOrigins: string[] = [];
if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    allowedDevOrigins.push(new URL(process.env.NEXT_PUBLIC_APP_URL).hostname);
  } catch {
    // Malformed NEXT_PUBLIC_APP_URL — fall back to Next's own localhost-only default.
  }
}

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  // Default Server Actions body limit is 1 MB (confirmed live: a real
  // Agreement PDF upload was rejected with "Body exceeded 1 MB limit"
  // before uploadInitialAgreement() ever ran). Raised to comfortably cover
  // real agreement documents; framework config only, no upload logic
  // touched.
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
