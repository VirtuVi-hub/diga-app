# External Dev Access via Cloudflare Tunnel

Lets a phone (or anyone off your local network) reach your local dev server
at `localhost:3000` through a real, public `https://` URL — needed to test
invitation links (WhatsApp share, `/invite/[code]`) end-to-end, since a
phone can never reach `localhost` on your machine directly.

## One-time setup

`cloudflared` must be installed once per machine:

```
winget install --id Cloudflare.cloudflared -e
```

No Cloudflare account, login, or domain is required — this uses Cloudflare's
free "quick tunnel," which mints a random `https://<random-words>.trycloudflare.com`
URL for as long as the tunnel process stays running. That's also its one
real limitation: **the URL changes every time the tunnel restarts.** There
is no persistent/custom-domain tunnel configured here — this setup is for
local development only, not a deployment target.

## Day-to-day usage

1. Make sure the dev server is running (`npm run dev`) in one terminal.
2. In another terminal, run:

   ```
   npm run tunnel
   ```

   This is the "one command" — [`scripts/dev-tunnel.sh`](../../scripts/dev-tunnel.sh)
   starts `cloudflared tunnel --url http://localhost:3000` in the
   background, waits for its `trycloudflare.com` URL to appear, and writes
   it into `.env.local` as `NEXT_PUBLIC_APP_URL` automatically — no
   copy-pasting.

3. **Restart `npm run dev`.** Next.js inlines `NEXT_PUBLIC_*` variables when
   the dev server starts; it will not pick up the new tunnel URL on its own
   even though the file changed.
4. Open the printed `https://*.trycloudflare.com` URL on your phone (or
   share an invitation link generated after this point — it will now
   contain the tunnel URL instead of `localhost:3000`).

Re-running `npm run tunnel` at any time replaces the previous tunnel (it
stops any `cloudflared` process left running from an earlier invocation
first) and writes the new URL into `.env.local` the same way. Restart
`npm run dev` again afterward.

### Stopping the tunnel

The script prints the tunnel's process id and a ready-to-run stop command
each time it starts one, e.g.:

```
powershell.exe -Command "Stop-Process -Id <pid> -Force"
```

Stopping it does not touch `.env.local` — set `NEXT_PUBLIC_APP_URL` back to
`http://localhost:3000` by hand (or just run `npm run tunnel` again) once
you no longer need external access.

## What this does and doesn't change

- Only `.env.local`'s `NEXT_PUBLIC_APP_URL` is written by the script. No
  application code reads the tunnel URL directly — `lib/invitations/share-links.ts`
  is the only place `NEXT_PUBLIC_APP_URL` feeds into user-facing output
  (invitation links), exactly as designed in Sprint 5.8's Module 1.
- The tunnel exposes your **entire** locally running app, including
  whatever real data is in the hosted Supabase project, to anyone who has
  the URL — there is no additional authentication on the tunnel itself
  beyond the app's own sign-in. Quick-tunnel URLs are long and unguessable,
  but they are not a substitute for real access control. Stop the tunnel
  when you're done testing.
- This is a local-development convenience only. It has no relationship to
  how the app would be deployed to a real `https://app.delta.com`-style
  production domain.
