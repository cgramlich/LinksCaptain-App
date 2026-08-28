# LinksCaptain — HANDOFF

Zero-context resumption document. Read this and you can make the next change
without asking anyone and without undoing something chosen on purpose.

**Last updated: 2026-08-28.**

---

## What this is

A private golf app for one player: a log of lessons, range sessions, rounds and
stray swing thoughts; a set of courses with scorecards; a live round tracker;
an editable coaching reference; a pre-round bag checklist; and an AI coach that
answers questions against your own log. It is a **Salty Tee Box** product in
the Forever Apps portfolio. Chris is the only user, which is the reason behind
several decisions below that would be wrong for a public app.

---

## Current state (2026-08-28)

| | Version | Where |
|---|---|---|
| Front end | `APP_VERSION` 1.22.2, `BUILD` 2026-08-25.1 | https://linkscaptain.com |
| Backend | 0.5.0 | https://api.linkscaptain.com |

Both repos clean and in sync with `origin/main`. Nothing uncommitted, nothing
staged, no open branches. Backend health is green with AI enabled.

Do not copy these numbers anywhere else. Read `APP_VERSION`/`BUILD` in
`index.html` and the backend's `/` payload instead — a pasted version is stale
the moment it is pasted.

---

## The map

**`C:\Users\cjgra\LinksCaptain-App`** — the front end. A single self-contained
`index.html` (~280 KB, vanilla JS, no build step, no framework) plus `sw.js`,
`manifest.json`, icons, and `CNAME`. Pushing `main` redeploys GitHub Pages.
There is no branch protection: **a push to `main` is a deploy.**

- `index.html` — everything. One `<script>` block. Sections are `div.section`
  toggled by `showSection()`; the bottom nav maps through `NAV_FOR_SECTION`.
- `sw.js` — app-shell service worker. The app document is **network-first**, so
  a refresh always gets the newest build.
- `icon.svg` / `icon-maskable.svg` — icon sources. See the icon decision below.
- `ROADMAP.md` — forward-looking phases and the course-data analysis.
- `CLAUDE.md` — working rules for this repo.

**`C:\Users\cjgra\LinksCaptain-Cloud`** — the backend. FastAPI in a single
`main.py`, deployed to Railway, plus `sql/schema.sql`. Supabase project ref
`paabwedpsgzfvninhyov`.

**`golf-data`** (GitHub) — the retired `data.json` sync store. Superseded in
July 2026. Kept only as a cold backup; scheduled for deletion.

### Data model

Six collections, each one Supabase table, `(user_id, id)` primary key, payload
in a `jsonb` column: `entries`, `courses`, `rounds`, `analyses`, `tips`,
`checklist`. The client holds all of it in one `state` object mirrored to
localStorage, and syncs by pull-merge-push per collection.

`mergeById` unions by id, newest `updatedAt` wins, and **tombstones survive** so
a delete propagates instead of resurrecting.

---

## How to run, build, deploy

There is no build step. To work on the front end locally:

```bash
cd C:/Users/cjgra/LinksCaptain-App && python -m http.server 8080
```

Syntax-check the single script block before every commit (there is no compiler
to catch you):

```bash
cd C:/Users/cjgra/LinksCaptain-App && start=$(grep -n "^<script>" index.html | head -1 | cut -d: -f1) && end=$(grep -n "^</script>" index.html | head -1 | cut -d: -f1) && awk -v s="$start" -v e="$end" 'NR>s && NR<e' index.html > /tmp/lc.js && node --check /tmp/lc.js
```

Deploy the front end (this **is** the deploy — see the release ritual):

```bash
cd C:/Users/cjgra/LinksCaptain-App && git push origin main
```

Deploy the backend (Railway redeploys on push):

```bash
cd C:/Users/cjgra/LinksCaptain-Cloud && git push origin main
```

Confirm what is actually live:

```bash
curl -s https://api.linkscaptain.com/ && curl -s "https://linkscaptain.com/?_=1" | grep -oE 'const (APP_VERSION|BUILD) = "[^"]+"'
```

### Release ritual

Bump **`APP_VERSION`**, **`BUILD`** (in `index.html`) and **`VERSION`** (in
`sw.js`) **together, every deploy.** `BUILD` is the one that matters and the one
that gets forgotten — see the first trap.

---

## Decisions, dated, with the road not taken

**Keyless app; AI runs on the server key — 2026-07-10.** Every AI call goes
through `/api/ai/relay` using the owner's Anthropic key, metered by a per-user
monthly call cap and a global spend circuit breaker. *Rejected:* each user
pastes their own Anthropic key (the original design). That was removed because
the setup friction is absurd for an app with one user. The consequence is that
AI cost lands on the owner, which is why the metering exists and must not be
weakened.

**Sync moved off GitHub onto the backend — 2026-07-10.** Data lives in Supabase
behind an authed API. *Rejected:* keeping the `data.json`-in-a-GitHub-repo sync,
which needed a per-device personal access token. The old path survives only as
a **one-time importer** under Settings → Import old data. Do not restore it as a
sync path.

**Do not buy course GPS data — 2026-08-24.** Commercial providers start around
**$399/month** (Golf Intelligence), and the accurate ones (iGolf, GolfLogix)
sell through enterprise licensing. For a single-user app that is indefensible.
*Chosen instead:* OpenStreetMap via Overpass for hole geometry (already wired
and free), plus a future one-time "pin the green on satellite imagery" step per
course cached in Supabase. Accuracy must be labelled honestly — a pinned green
and an OSM approximation are not the same thing, and a wrong yardage is worse
than none. Full reasoning in `ROADMAP.md`.

**Icon deliberately breaks the family pattern — 2026-07-12.** Siblings put a
flat glyph inside a badge circle. LinksCaptain has **no badge** and uses a
shaded 3D golf ball. *Rejected:* several flat-glyph attempts (ball, tee, club,
ball-on-tee) — all read as weak line art at home-screen size. The ball's radius
66 at (350,350) is not arbitrary: it matches the sibling badge footprint so the
family rhythm survives without the badge. Dimple spacing is tuned for the
**192 px** render and looks deliberately coarse at 512. Do not "restore
consistency" by adding a badge back.

**Coach tips are data, seeded by parsing the old markup — 2026-08-12.** The nine
reference pages were hardcoded HTML, so tips could not be edited and their
source lived inside the sentence. Tips are now records with a real source (who
said it, which platform, the URL). *Rejected:* retyping the content — the seed
parses the existing DOM instead, which moved **153 tips and 49 links** with
nothing lost. **Fix My Shot is deliberately excluded**: it is an interactive
miss-diagnosis tool, not a tip list, and flattening it would break it.

**One bag list, not one per round or per course — 2026-08-13.** You pack the
same bag every time, so the value is ticking a known list and resetting it, not
authoring a new one. *Rejected:* a fresh checklist per round, and per-course
extras. Either can be added later if the single list proves too blunt.

**Analyses auto-save; failures stay visible — 2026-08-01 and 2026-08-25.** Every
analysis files itself once it returns real text, so Coach history is a running
record rather than whatever got manually saved. Empty replies and errors save
nothing. A **failed** analysis keeps its error modal open until dismissed —
Chris's explicit call. *Rejected:* auto-closing on failure, which would hide it.

**Reordering uses up/down buttons, not drag-and-drop.** Touch dragging in a
scrolling list is fiddly and easy to get subtly wrong; swapping `order` with the
neighbour is boring and reliable.

**Seed-once is guarded by tombstones.** Tips and the bag list seed only when
there are **zero** records including deleted ones. Deleting everything on
purpose therefore cannot resurrect the defaults.

**"Round" entry type kept its name despite the overlap — 2026-07-12.** The Log
has a `round` entry type (journal notes from playing) and there is also a
separate **Rounds** tab (structured scorecards and stats). The name collision
was considered and accepted; they are different tools for different jobs.

**RLS enabled with no policies, on every table.** The backend uses the
service_role key, which bypasses RLS. No anon or authenticated policies exist
on purpose, so the public anon key cannot reach data directly. This is a
portfolio-wide rule, not a local choice.

---

## Traps

**A stale `BUILD` silently kills the update banner.** The in-app updater
compares the deployed `BUILD` against the running one. *Incident, 2026-08-24:*
`BUILD` sat at `2026-07-28.1` while `APP_VERSION` moved 1.18.2 → 1.22.0 across
**six releases**, so the "Update available" banner never appeared and "Check for
updates" reported "You're on the latest" while it wasn't. Nobody noticed because
`sw.js` is network-first, so manual refreshes always worked — the silent path
masked the broken prompt. **The pre-push audit cannot catch this**: its
version-lockstep check passes when `sw.js` agrees with `APP_VERSION` *or*
`BUILD`. To check any app: compare `grep 'const BUILD' index.html` against
`git log -1 --date=short -- index.html`.

**A new Supabase table returns 500 / `42501` until it is granted.** Adding a
collection means adding the table, enabling RLS, **and** `grant all on <table>
to service_role`. Both `tips` and `checklist` needed this.

**A modal over the fixed bottom nav reads as "the button is broken".**
*Incident, 2026-08-25:* Chris reported the Log button dead. It was not — a
failed analysis modal was open above the nav, so taps landed on the overlay.
Check for an open overlay before touching navigation code.

**Give every AI path its own token budget.** *Incident, 2026-08-25:* single-entry
analysis was the only path without one, so it used the 1500 default while the
others used 4096 — and "analyze in context" folds the whole log into the prompt.
It hit `max_tokens` and returned no text at all.

**Shell heredocs silently corrupt JS payloads.** Writing a large JS or HTML
block through a bash heredoc mangles quotes and escapes without an error. Write
the builder as a `.py`/`.js` file and run it, then syntax-check.

**Supabase's Users list can show a stale "no users"** while the account exists.
Hard-refresh before concluding an account is missing.

---

## What is open

**Blocked on Chris**

- **Phase 5, the on-course GPS rangefinder.** Needs a yes/no on the
  OSM-plus-self-pinned-greens approach in `ROADMAP.md`. Not blocked on code.
- **Adding a real `BUILD` check to `portfolio-audit`.** Would prevent the trap
  above portfolio-wide, but that file is shared by 15 repos and a new check
  changes everyone's pushes.
- **Delete the `golf-data` repo** (data has been in Supabase since July) and the
  stray nested `LinksCaptain-App\LinksCaptain-Cloud\` folder (an untracked
  duplicate clone, harmless but confusing).

**Unverified**

- The bag check's cloud sync has never been confirmed end to end. The table SQL
  was run; a tick-then-sync on a second device would settle it.

**Known, elsewhere in the portfolio**

- The same `BUILD` rot was found on 2026-08-24 in **homecaptain-app** and
  **tracker-app** (PriorityCaptain). Both still have dead update banners.
  `dining-log-app` has no `BUILD` constant at all and is single-writer — route
  that to the MenuCaptain session rather than editing it.

**Parked**

- Paid or self-hosted Overpass, if the free mirrors get flaky. The current fix
  (prefer a mirror that actually returns courses, ignore fast-but-empty answers)
  is holding.

---

## Where authority lives

- **This file** is authoritative for what is true now, and for why things are
  the way they are.
- **`ROADMAP.md`** owns the forward plan: phase status and the course-data
  analysis behind Phase 5. It does not restate current state.
- **`CLAUDE.md`** owns the working rules for editing this repo.
- **The code** owns behaviour. Versions come from `APP_VERSION`/`BUILD` and the
  backend `/` payload, never from a document.
- **`BRIEFING.md`** derives from this file. If they disagree, this one is right.
