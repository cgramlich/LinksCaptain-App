# LinksCaptain — Roadmap & Cleanup

App brand: **LinksCaptain** (a **Salty Tee Box** product), part of the Forever
Apps portfolio. The pirate-skull logo and green/gold palette are the house
identity and stay.

Live at **https://linkscaptain.com** (GitHub Pages + custom domain, HTTPS on).
API at **https://api.linkscaptain.com**.

Current versions are deliberately not written here — read `APP_VERSION` and
`BUILD` in `index.html`, and the backend's `/` health payload.

## Repos

- **`LinksCaptain-App`** — the front-end PWA. One self-contained `index.html`
  (vanilla JS, no build step) plus `sw.js`, icons, and `CNAME`. Pushing `main`
  redeploys Pages.
- **`LinksCaptain-Cloud`** — the backend. FastAPI + Supabase + a server-side
  Anthropic relay, on Railway. Supabase project `paabwedpsgzfvninhyov`.
- **`golf-data`** — the retired GitHub `data.json` sync store. Superseded by
  Phase 4; kept only as a cold backup.

## Architecture

- **Front-end:** installable PWA served from the custom domain.
- **Backend:** FastAPI + Supabase (Postgres + JWT auth). Every collection is
  one table, `(user_id, id)` keyed, RLS enabled with **no** policies so only the
  service_role backend can reach the data. Collections: `entries`, `courses`,
  `rounds`, `analyses`, `tips`, `checklist`.
- **AI:** all calls go through `/api/ai/relay` on the server key, metered by a
  per-user monthly call cap and a global spend circuit breaker.
- **Stripe / app stores:** deliberately not started. Entitlement is stubbed to
  "pro" behind a seam so billing can land later without a rewrite.

## Phases

- [x] **Phase 1 — PWA shell parity.** manifest, service worker, real icon set.
- [x] **Rebrand to LinksCaptain**, custom domain, front-end repo rename.
- [x] **Phase 2 — backend.** `LinksCaptain-Cloud` on Railway + Supabase, golf
  schema, entitlement stub.
- [x] **Phase 3 — server-side AI + authed sync.** Sync moved off the GitHub PAT
  onto `GET/PUT /api/collection/{name}` with a Supabase bearer token, and all
  three Anthropic calls moved behind `/api/ai/relay`. The app is **keyless**:
  the only setup is signing in. The old GitHub path survives as a one-time
  importer behind Settings → Import old data.
- [x] **Phase 4 — data migration.** The full log was imported from `golf-data`
  and pushed to Supabase. `golf-data` is now redundant.
- [ ] **Phase 5 — on-course GPS rangefinder.** Distance to the front, centre and
  back of the green, carries to hazards, and which hole you are on. See the
  data-source section below: this is blocked on a decision, not on code.

## Course data: the finding that shapes Phase 5

Commercial golf GPS data is priced for businesses, not for one player:

- **Golf Intelligence** — paid plans start around **$399/month**; the free tier
  is 200 one-time credits, enough to evaluate and nothing more.
- **iGolf** and **GolfLogix** — the most accurate providers (surveyed
  front/centre/back pins, tee boxes, hazards) sell through enterprise
  **licensing**, not self-serve pricing.

At roughly $4,800/year for a single-user app, buying the data is not sensible.
The recommended path instead:

1. **OpenStreetMap via Overpass (free, already wired).** `/api/golf/holes`
   already returns a tee point and a green point per hole, and already powers
   hole detection. That is enough for a working distance-to-green readout today.
2. **Pin your own greens, once per course.** OSM gives roughly one green point,
   not front/centre/back. Since the set of courses actually played is small, a
   one-time "tap the green on satellite imagery" step per course, cached in
   Supabase, produces genuinely accurate yardages, costs nothing, never expires,
   and covers the part OSM cannot.
3. **Label honestly.** A wrong yardage is worse than none, so the readout must
   distinguish a green you pinned from an OSM approximation, and must never
   present a guess as precision.

Scorecards stay on **GolfCourseAPI** (free tier, already integrated). Nearby
course search stays on **OSM/Overpass**.

## Shipped since the backend cutover

- Keyless sign-in, cloud sync, and the AI relay (Phase 3).
- **Round** entry type, so playing sits in the timeline beside lessons, range
  sessions and thoughts.
- **Ask your log** — natural-language questions answered against the log,
  honouring entry types, date ranges and counts.
- **Organize notes** — paste freeform notes and have them filed into typed
  entries, reviewed before saving. Dates are never invented.
- **Auto-saved analyses** plus a Coach "Past analyses" screen, so AI coaching is
  a running record rather than whatever was remembered to be saved.
- **Editable Coach tips.** The reference pages were hardcoded; tips are now data
  with a real source (who said it, which platform, the URL), editable inline and
  organizable by source on a Manage tips screen. Fix My Shot stays a hardcoded
  interactive tool on purpose.
- **Bag check** — the pre-round checklist, with a non-blocking nudge on Play.

## Open items

- **Phase 5**, pending the go-ahead on the OSM-plus-pinned-greens approach.
- **Retire `golf-data`** now that Supabase holds the data.
- **Paid or self-hosted Overpass** if the free mirrors get flaky. The current
  fix (prefer a mirror that actually returns courses, ignore fast-but-empty
  answers) is holding, so this stays parked.

## Release ritual

Bump **`APP_VERSION`**, **`BUILD`**, and **`sw.js` VERSION together** on every
deploy, then push `main`.

`BUILD` is the one that matters most and the one most easily forgotten: the
in-app updater compares the deployed `BUILD` against the running one, so if
`BUILD` does not advance, the "Update available — tap to refresh" banner never
appears and installed users sit on a stale build until they refresh by hand.
This actually happened here across six releases, which is why it is called out.

Note the pre-push audit's version-lockstep check does **not** catch it: it
passes when `sw.js` agrees with `APP_VERSION` *or* `BUILD`, so bumping
APP_VERSION and sw.js together stays green while `BUILD` rots.
