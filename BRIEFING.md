# LinksCaptain — BRIEFING

Deck-ready source material. Derives from `HANDOFF.md`, which is authoritative;
if a figure here disagrees with the handoff, the handoff is right.

**Written to leave the machine.** Everything below is safe to hand to an
external design tool. See the "do not say" list at the end.

**Last updated: 2026-08-28.**

---

## The arc

**Situation.** A dedicated amateur golfer accumulates coaching faster than he can
use it: lesson notes, range observations, swing thoughts, and a growing pile of
instruction clips saved from social media. The raw material is all there. None
of it is answerable. You cannot ask a notebook "what have my last two lessons
and every range session since April actually been telling me?"

**Problem.** The first version of the app made this worse in a quiet way. It
stored its data as a single JSON file in a private code repository, which meant
every device needed a personal access token pasted into it by hand. AI features
required a second credential — the user's own API key, kept in the browser. So
the app that was supposed to reduce friction demanded two pieces of security
plumbing before it did anything, and its most valuable content, a curated
library of coaching tips, was frozen as hardcoded page markup that could not be
edited, searched or attributed.

**What was done.** Over roughly eight weeks in mid-2026, the app was rebuilt
around a proper backend and then pushed well past parity:

- The data moved to a hosted database behind an authenticated API, and the
  token-per-device sync was retired to a one-time importer. **Setup went from
  two API credentials to a single sign-in** (2026-07-10).
- AI moved server-side, so no key ever reaches the browser, with spend controls
  built in from the start rather than bolted on.
- The coaching library became real data. **153 tips and 49 source links were
  migrated into an editable, attributable form without a single word being
  retyped** — the migration parsed the existing pages rather than transcribing
  them (2026-08-12).
- The AI stopped being a summariser and became a query interface: ask a question
  in plain English and get an answer drawn only from your own log, honouring the
  entry types, date ranges and counts you named.
- Freeform notes gained an inbox: paste a wall of text and it is filed into
  correctly typed, dated entries for review before anything is saved.

**What it means now.** A single-player app, built and maintained conversationally,
that does things the subscription products do not: it answers questions about
*your* coaching history, it treats the provenance of every tip as a first-class
fact, and it costs effectively nothing to run. The most instructive decision was
a refusal — see the economics below.

---

## Figures

Sourced and dated. Use these; do not round them.

| Figure | Value | Date / source |
|---|---|---|
| Coaching tips migrated with zero retyping | 153 tips, 49 links | 2026-08-12, measured in-browser after migration |
| Coaching reference pages made editable | 8 | 2026-08-12 |
| Credentials required to set the app up | 2 → 1 | 2026-07-10 (GitHub token + AI key → sign-in) |
| Synced data collections | 6 | 2026-08-28 |
| Commercial golf GPS data, entry price | **$399 / month** | 2026-08-24, Golf Intelligence published API pricing |
| Same, annualised | ~$4,800 / year | derived from the above |
| Chosen alternative cost | $0 | OpenStreetMap via Overpass, already integrated |
| AI spend ceiling enforced in code | $25 / month global | 2026-08-28, live configuration |
| AI per-user monthly call cap | 300 calls | 2026-08-28, live configuration |
| Front end size | one ~280 KB file, no build step | 2026-08-28 |
| Releases shipped since the rebuild | 49 commits since 2026-07-01 | git history |

### The economics decision, in one line

The feature the app most wants — an on-course rangefinder giving distances to
the front, centre and back of every green — depends on surveyed course data.
That data is sold to businesses: **$399 a month at entry, with the most accurate
providers licensing only at enterprise scale.** The app has one player. Paying
roughly $4,800 a year to know you are 147 yards out is not a rounding error, it
is the whole product budget several times over.

So it was not bought. Free map data already provides hole geometry, and the
precision gap is closed by pinning each green once, by hand, on satellite
imagery — accurate for the handful of courses actually played, permanent, and
free. The constraint produced a better answer than the budget would have.

---

## Quotable claims

Each is true and survives a follow-up question.

- "Setup went from two API credentials to a single sign-in."
- "153 tips moved into a queryable form without a word being retyped — the
  migration read the old pages instead of transcribing them."
- "The data that would make the marquee feature possible starts at $399 a month.
  The app serves one player. So we didn't buy it — we pinned the greens by hand."
- "Every tip now records who said it, where it came from, and the link — so the
  library can be organised by source instead of by whatever the sentence
  happened to say."
- "The AI answers only from your own log. If nothing matches, it says so rather
  than inventing."
- "Spend controls were written before the first bill, not after."
- "A wrong yardage is worse than no yardage, so an estimated distance is never
  presented as a measured one."

---

## What deserves a picture

Candidates, with the reason. Form is the design tool's call.

1. **The sync rebuild, before and after.** Before: each device holding a
   hand-pasted access token, writing to a file in a code repository. After: one
   sign-in, an authenticated API, a real database. This is the clearest
   "we fixed the foundation" visual in the whole story.
2. **The cost comparison.** $4,800/year of licensed course data against $0 of
   open map data plus a one-time manual pin per course. A two-bar chart that
   makes the argument on its own.
3. **A tip, before and after.** The same coaching note as inert prose with its
   source trailing off the end, beside the structured record with *who*, *where*
   and *link* as separate, sortable fields. Shows the idea in one glance.
4. **The migration number.** 153 tips and 49 links moving across, nothing
   retyped. A single large figure with the caption doing the work.
5. **The question interface.** A plain-English question above the answer it
   produced from the user's own history — the clearest demonstration of why a
   personal log beats a generic golf app.

---

## Angles for different audiences

Do not pre-narrow; the audience is chosen at generation time.

**Investor / portfolio.** This is one of a family of applications sharing one
technical template, where the marginal cost of the next app is low because the
authentication, sync, AI relay and deployment pipeline are already built and
proven. LinksCaptain is evidence the template survives contact with a new
domain: it went from rebuild to six data collections and a working AI query
layer in about eight weeks.

**Client / practitioner.** A demonstration that constraints beat budget. The
headline feature was blocked by vendor pricing aimed at businesses; instead of
abandoning it or overpaying, the problem was re-scoped onto free data plus a
one-time manual step, with honest labelling where accuracy differs. That is a
transferable pattern for any project facing a data-licensing wall.

**Team / engineering.** The interesting content is the failure modes. A version
stamp that silently stopped advancing disabled the in-app update prompt for six
consecutive releases, and it was invisible because a second mechanism quietly
compensated. A migration that parsed existing markup rather than retyping it
also had to preserve punctuation the original author never wrote. Both are
better teaching material than any success.

---

## Do not say

- **No real coaching content, and no instructor names.** The live log contains
  named third-party coaches and personal notes. Any example must be fabricated.
  *Fabricated example, safe to use:* "Range session, 12 May — feet-together
  drill for balance; keep the spine angle through the strike. Source: a
  YouTube short by a teaching pro." That is invented and matches the real shape.
- **No infrastructure identifiers.** No database project references, hostnames,
  API endpoints, environment variable names, repository paths or account
  details.
- **Do not claim the GPS rangefinder exists.** It is designed and argued for,
  not built. Describe it as the next phase.
- **Do not imply multiple users, availability, or revenue.** It is a private,
  single-player app. There is no paying customer, no store listing and no
  billing; the payments layer is deliberately stubbed.
- **Do not present vendor pricing as current without its date.** The $399/month
  figure is as published on 2026-08-24 and should carry that date.
- **Do not claim the bag-check cloud sync is verified.** It is built and the
  database table exists, but an end-to-end confirmation across two devices has
  not been done.
- **Do not describe hand-pinned green positions as survey-grade.** They are
  accurate enough for the courses played and are labelled as user-placed.
