# Deployment

Dev Journal runs in two places at once, off the same code and the same database:

| | Heroku | Cloudflare |
|---|---|---|
| Entry point | `server/src/node.ts` | `server/src/worker.ts` |
| Serves the client | Yes, from `client/dist` on the dyno | Yes, as static assets |
| Config lives in | Heroku config vars | Worker secrets (dashboard) |
| Cold start | ~10s+ after 30 min idle (eco dyno) | None to speak of |
| Warm API request | Fast — one long-lived Mongo connection | Slower — a fresh Mongo connection per request (see below) |

Both point at the same MongoDB Atlas database, so a roll logged on one shows up
on the other. Both sign tokens with the same `JWT_SECRET`, so a login on either
works on both.

## Where code goes

- **API behaviour** (routes, validation, auth): `server/src/app.ts`,
  `server/src/routes/`, `server/src/middleware/`, `server/src/db/`. Written
  once, runs on both.
- **Heroku only** (listening on a port, serving static files, `.env`):
  `server/src/node.ts`, `server/src/config/loadEnv.ts`.
- **Cloudflare only**: `server/src/worker.ts`, `wrangler.jsonc`.

If a change only works on one platform, it belongs in that platform's file.

### The data layer

There is no Mongoose any more: it can't share a connection the way Workers
require. `server/src/db/models.ts` describes each collection field by field, and
`server/src/db/schema.ts` does what Mongoose did with that — casting request
values, defaults (including on documents written before a field existed),
trimming, `createdAt`/`updatedAt`, and validation, with Mongoose's own rules and
error messages. Collection names are the ones Mongoose created, so existing data
is read as-is.

Adding a field to a collection means adding it to its schema in `models.ts`; a
field that isn't there is dropped from creates and updates, as before.

## Release checklist

### 1. Before merging

- [ ] `npm run build` passes (typechecks and builds client and server).
- [ ] `npm run dev` and try the change at <http://localhost:5173>. This runs the
      Node server, the same one Heroku runs.
- [ ] If the change touches `server/`, also try it as a Worker:
      ```bash
      npm run build:client && npx wrangler dev
      ```
      and open <http://localhost:8787>. Wrangler reads the root `.env`, so check
      which database `MONGODB_URI` points at first.
- [ ] Added a server dependency? Check it works under `wrangler dev`. Anything
      with native bindings, or that touches the filesystem, won't run on a
      Worker.

### 2. Deploy

- [ ] Merge to `main` and push.
- [ ] **Cloudflare** builds and deploys automatically from `main`. Check the
      build under Workers & Pages → `dev-journal` → Deployments.
- [ ] **Heroku**: if the app is connected to GitHub with automatic deploys, the
      merge deploys it. Otherwise:
      ```bash
      git push heroku main
      ```

### 3. Check both

```bash
curl https://film-journal-app-4820cabb8531.herokuapp.com/api/health
curl https://<cloudflare-url>/api/health
```

Both should return `"status":"ok","db":"ok"`. Then open each in a browser and
sign in.

## Changing config

**Config is set separately on each platform.** Update both.

| Variable | Needed on |
|---|---|
| `MONGODB_URI` | both |
| `JWT_SECRET` | both — **must be the same value**, or tokens from one are rejected by the other |
| `JWT_EXPIRES_IN` | both, if not the default `7d` |
| `NODE_ENV=production` | Heroku (Cloudflare sets it in `wrangler.jsonc`) |

- [ ] **Heroku**:
      ```bash
      heroku config:set JWT_EXPIRES_IN=30d
      ```
      Restarts the dyno for you.
- [ ] **Cloudflare**: Workers & Pages → `dev-journal` → Settings → Variables and
      Secrets. Add each as type **Secret**, not Text. Or from the terminal:
      ```bash
      npx wrangler secret put JWT_SECRET
      ```
      Takes effect immediately, no redeploy.

Never put these in `wrangler.jsonc`. That file is committed, and anything under
`vars` there is published in plain text with every deploy. The Worker refuses
every request until `JWT_SECRET` is set, rather than fall back to the public
default.

## Cloudflare project settings

Set once in the dashboard, under Settings → Build:

| Setting | Value |
|---|---|
| Root directory | `/` (repo root) |
| Build command | `npm run build:client` |
| Deploy command | `npx wrangler deploy` |

`build:client` builds the client. Wrangler builds the Worker itself from
`server/src/worker.ts`, so `server` needs no separate build step here.

## Cloudflare plan: logins need Workers Paid

Passwords are bcrypt hashes at cost 12, which takes about 200 ms of CPU to
check. The Workers **Free** plan allows 10 ms of CPU per request, so on Free,
signing in or signing up through the Cloudflare URL fails with a CPU-limit error.
Every other request is well under the limit.

- On **Workers Paid**, nothing to do — the default limit is 30 seconds.
- On **Free**, sign in through Heroku instead. The token works on both, so the
  Cloudflare site works for the rest of the token's life (`JWT_EXPIRES_IN`).

## The iOS app

The Capacitor build calls the API by full URL: `VITE_API_URL` at build time, or
the Heroku URL in `client/src/services/api.ts` when that is unset. To point the
app at Cloudflare, build it with `VITE_API_URL=https://<cloudflare-url>/api`. The
web app always calls its own origin, so it needs nothing.

## MongoDB Atlas

- Network Access must allow `0.0.0.0/0`. Neither Heroku eco dynos nor Workers
  have a fixed outbound IP.
- Each Cloudflare request opens its own connection and closes it afterwards, so
  under real traffic the Atlas connection count will bounce around more than it
  did with Heroku alone. At this app's traffic it's nowhere near the free-tier
  limit.
- Indexes (unique email, unique chemical name + ratio, and the lookup indexes)
  are created by whichever server starts first, and are a no-op after that.

## Why Cloudflare requests take a few hundred ms

Workers don't allow one request to reuse a network connection that another
request opened, so the Worker can't keep a warm connection to Atlas the way the
dyno does. Every API call connects, runs its queries and disconnects — a few
hundred ms, versus tens of ms on a warm dyno. That's the trade for having no 10+
second cold start.
