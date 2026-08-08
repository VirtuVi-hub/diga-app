#!/usr/bin/env bash
# Starts a Cloudflare quick tunnel for the local dev server (localhost:3000),
# waits for the public https://*.trycloudflare.com URL to appear, writes it
# into .env.local as NEXT_PUBLIC_APP_URL, and leaves the tunnel running in
# the background. Re-run this same command any time you restart the tunnel —
# quick tunnels get a fresh random URL each time, so this script exists
# specifically to save you from copy-pasting it into .env.local by hand.
#
# Usage: npm run tunnel   (or: bash scripts/dev-tunnel.sh)
#
# After it prints the new URL, restart `npm run dev` — Next.js inlines
# NEXT_PUBLIC_* env vars at server start, so a running dev server will not
# pick up the new value on its own.

set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
LOG_FILE="$(mktemp -t cloudflared-tunnel.XXXXXX.log)"
PORT=3000

# Locate cloudflared: prefer PATH, fall back to the default winget/MSI install
# location (this shell's PATH cache can lag a fresh install until a new
# terminal is opened).
CLOUDFLARED="$(command -v cloudflared || true)"
if [ -z "$CLOUDFLARED" ]; then
  CANDIDATE="/c/Program Files (x86)/cloudflared/cloudflared.exe"
  if [ -f "$CANDIDATE" ]; then
    CLOUDFLARED="$CANDIDATE"
  fi
fi
if [ -z "$CLOUDFLARED" ]; then
  echo "cloudflared not found. Install it first:"
  echo "  winget install --id Cloudflare.cloudflared -e"
  exit 1
fi

# Stop any tunnel already running from a previous invocation of this script,
# so there's only ever one active URL to reason about.
powershell.exe -NoProfile -Command "Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force" >/dev/null 2>&1 || true
sleep 1

echo "Starting Cloudflare quick tunnel for http://localhost:${PORT} ..."
"$CLOUDFLARED" tunnel --url "http://localhost:${PORT}" > "$LOG_FILE" 2>&1 &
TUNNEL_PID=$!

# The URL appears in cloudflared's own log within a few seconds of startup.
URL=""
for _ in $(seq 1 30); do
  URL="$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$LOG_FILE" | head -1 || true)"
  if [ -n "$URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$URL" ]; then
  echo "Could not detect the tunnel URL after 30s. Check the log: $LOG_FILE"
  exit 1
fi

echo "Tunnel is live: $URL"

if grep -q "^NEXT_PUBLIC_APP_URL=" "$ENV_FILE"; then
  sed -i "s#^NEXT_PUBLIC_APP_URL=.*#NEXT_PUBLIC_APP_URL=${URL}#" "$ENV_FILE"
else
  printf 'NEXT_PUBLIC_APP_URL=%s\n%s' "$URL" "$(cat "$ENV_FILE")" > "$ENV_FILE"
fi

echo "Updated $ENV_FILE -> NEXT_PUBLIC_APP_URL=${URL}"
echo
echo "Next step: restart the dev server (npm run dev) to pick up the new URL."
echo
echo "Tunnel running in background (PID ${TUNNEL_PID}). Log: $LOG_FILE"
echo "Stop it with: powershell.exe -Command \"Stop-Process -Id ${TUNNEL_PID} -Force\""
