# 4chits Web App — Decisions Log

This file records every product/technical decision made during Phase 0 discovery and building, per the build prompt in `BUILD_PROMPT.md`. Each entry: date, topic, options considered, decision, reasoning.

---

## Phase 0: Discovery

### Round 1 — Players
_Status: decided — 2026-10-12_

| Question | Options considered | Decision | Why |
|---|---|---|---|
| Who is it for | Friend groups / Families / College students / General-mixed | **General/mixed audience** | User's choice — broadest audience over a narrow persona. |
| Age range | All ages / Teens+ / Adults only | **All ages, family-friendly** | No mature content needed; keeps door open to family audience; no age-gate complexity. |
| Geography | India-only / India-first-don't-block / Global-from-day-one | **India-first, don't block others** | Best latency for the likely core audience (India) without technically excluding anyone. |
| Language | English only / English+Hindi toggle / English+Hinglish / Hindi only | **English + Hinglish** | Matches existing landing page voice; avoids building a full translation/i18n layer for v1. |

**Consequence for later phases:** game copy and voice lines should read natural to a general, English/Hinglish-comfortable audience; no content moderation beyond basic abuse reporting is required yet; first video/game server region should be India (e.g. Mumbai), with the architecture left open to add regions later; no language switcher UI needed in v1.

### Round 2 — Game rules
_Status: decided — 2026-10-12_

**Rule variant — researched, not assumed.** User asked for the real traditional rules (not the originally-drafted guess) with a time limit applied. Research found genuine regional disagreement on *who guesses the Chor*:
- Variant A (Mantri guesses): described on [Bharatiya Khel](https://bharatiyakhel.in/raja-mantri-chor-sipahi-ram-laxman-seeta-devi/). Raja reveals, calls on Mantri, Mantri points to who they think is the Chor among the remaining two.
- Variant B (Sipahi guesses): documented on [Wikipedia](https://en.wikipedia.org/wiki/Raja_Chor_Mantri_Sipahi) and independently matched by an unrelated dev's [GitHub implementation](https://github.com/AR0714/RAJA-MANTRI-CHOR-SIPAHI). Raja reveals, calls on Sipahi, Sipahi reveals, then Sipahi guesses the Chor among the remaining two (Mantri/Chor).

**Decision: Variant B (Sipahi guesses).** Two independent sources agree on it, and Wikipedia treats it as the documented/canonical version. If this doesn't match the user's own childhood version, it's a straightforward swap (change which role has the "guesser" behavior) — flagged to user, not yet confirmed as final.

**Final round flow:**
1. Deal 4 chits secretly (server-side).
2. Raja revealed to all.
3. Raja "calls" the Sipahi → Sipahi revealed.
4. **60-second interrogation** of the two still-hidden players (Mantri, Chor) — user chose 60s over the originally-proposed 45s.
5. Sipahi accuses one of the two.
6. Reveal + score:
   - Raja: always 1000.
   - Mantri: fixed 800 (not a guesser in this variant).
   - Correct accusation: Sipahi keeps 500, Chor stays 0.
   - Wrong accusation (i.e. Sipahi accused the Mantri): Sipahi and Chor swap (Sipahi→0, Chor→500) per Wikipedia, **plus house rule**: wrongly-accused Mantri gets a +300 bonus (800→1100) — carried over from the original build prompt's house rule, remapped from Mantri-guesses to Sipahi-guesses structure since it's the same "falsely accused innocent" situation either way.

| Question | Options considered | Decision | Why |
|---|---|---|---|
| Rounds per match | 10 fixed / 5 / 20 / host chooses | **Host chooses at room creation** (5/10/20 offered) | Flexibility for different group sizes/time budgets; adds one setup screen for the host. |
| Interrogation timer | 45s / 30s / 60s / untimed | **60 seconds** | More room for real back-and-forth bluffing than the originally proposed 45s. |
| Match tie-break | Sudden-death round / tie stands / highest single round | **Sudden-death extra round** | Keeps a single clear winner, matches user's pick (recommended option). |

### Round 3 — Video
_Status: decided — 2026-10-12_

| Question | Options considered | Decision | Why |
|---|---|---|---|
| Camera default | Camera-on-default+audio-fallback / Camera-required / Audio-only-no-video | **Camera on by default, audio-only fallback allowed** | Keeps the "face-time bluffing" core pitch, without hard-blocking players with a broken camera. |
| Bad network handling | Auto-drop-to-audio-with-warning / Let-it-degrade-naturally / Kick-to-reconnecting-screen | **Auto-drop to audio-only + on-screen warning** | LiveKit supports this natively; avoids confusing frozen video tiles. |
| Privacy disclosure | Live-only-never-recorded / Same-plus-log-connection-diagnostics | **Live only, never recorded, clearly stated** | Matches "no recording/replays" already out of scope; simple one-line disclosure before camera permission prompt. |
| Camera permission timing | Explain-then-prompt-before-joining / Prompt-on-page-load / Separate-audio-only-join-button | **Explain first, then prompt right before joining a room** | Context before a permission prompt meaningfully increases Allow rates vs. a surprise prompt. |

**Consequence for later phases:** video tile UI needs a clear "audio-only" state (not just a frozen frame) for both voluntary fallback and auto-degradation; lobby/pre-join screen needs a short privacy line + camera/mic permission trigger; LiveKit's adaptive simulcast/degradation settings should be enabled by default.

### Round 4 — Rooms and joining
_Status: decided — 2026-10-12_

| Question | Options considered | Decision | Why |
|---|---|---|---|
| Joining method | Code+link / link-only / code-only | **Both room code and shareable link** | Link is easiest for WhatsApp sharing; code is a fallback if a link misbehaves on someone's device/browser. |
| Player leaves mid-match | Pause+wait-with-timeout / end-match-immediately / host-adds-replacement | **Pause and wait, with a 60s grace period** (see below), host decides after timeout | Avoids ending a whole match over a brief wifi blip; mid-match replacement deferred as too complex for v1. |
| Game URL | play.4chits.com / 4chits.com/play / app.4chits.com | **play.4chits.com** (my recommendation, used since user had no preference) | Clean separation between the static marketing site and the real-time app; easier to deploy/scale independently. |
| Reconnect grace period | 30s / 60s / 2min | **60 seconds** | Long enough for a quick wifi hiccup, short enough other players aren't stuck waiting. |

**Consequence for later phases:** lobby needs a visible room code + "copy link" button; game server needs per-player disconnect/reconnect handling with a 60s timer before prompting the host for a decision (end match / continue without them); DNS + hosting setup will need a new `play.4chits.com` subdomain added to Namecheap, pointed at wherever the game server/frontend is deployed (separate from GitHub Pages, which only serves the static landing page).

### Round 5 — Look and feel
_Status: decided — 2026-10-12_

**Theme extracted from `landing/styles.css`** (shown to user before use, per build prompt rule):
purple-900 `#2e1a47`, purple-700 `#4a2a7a`, purple-600 `#6b3fa0` (primary), purple-500 `#8b5fc0`, purple-100 `#f1e9fb`, gold `#e8b64f` (accent), ink `#1d1626`, paper `#fffaf3`; system font stack (no custom webfont); 16px border radius; chit = dashed purple border/light fill when hidden → solid purple fill + white text on reveal.

| Question | Options considered | Decision | Why |
|---|---|---|---|
| Theme carry-over | Same-palette-throughout / more-vivid-during-gameplay | **Same palette throughout** | Brand consistency from landing page through live gameplay. |
| Sound | SFX-only / SFX+music / no-sound | **Sound effects only** (card flip, reveal chime, timer tick) | Reinforces key moments without needing to source/license music. |
| In-game name | Just-"4chits" / "4chits: Raja Mantri Chor Sipahi" subtitle | **"4chits: Raja Mantri Chor Sipahi"** | Spells out the actual game for sharing/search context. |
| Icon/favicon | Reuse-existing-"4"-mark / design-new-chit-motif-icon | **Design a new icon** (chit/scroll motif) | More distinctive for the game specifically — **action item**: needs original artwork before launch, not blocking earlier build phases. |

**Consequence for later phases:** reuse the existing CSS custom properties as the game's theme file directly (no new palette to invent); need a short SFX asset list (flip, reveal chime, timer tick, maybe accusation "gasp") sourced from a royalty-free library; "4chits: Raja Mantri Chor Sipahi" used in page titles/share previews; new icon design is a pre-launch to-do, tracked separately so it doesn't block earlier phases.

### Round 6 — Money and limits
_Status: decided — 2026-10-12_

**Flagged risk:** user's budget answer (under $20/month) and launch-size answer ("could go viral") directly conflict — usage-based billing (LiveKit minutes, hosting) could spike into a large surprise bill under real viral traffic with no cap in place. Flagged to user per build-prompt rule rather than silently picking a default.

| Question | Options considered | Decision | Why |
|---|---|---|---|
| Monthly budget | <$20 / $20–100 / $100+ | **Under $20/month to start** | Matches a friends-and-family beta; LiveKit Cloud + Render/Railway free tiers cover this comfortably at low usage. |
| Monetization direction | Not sure yet / Ads / Cosmetic purchases | **Ads** (same model as the landing page) | Doesn't change the v1 build (payments/accounts still out of scope), but confirms the direction for later. |
| Expected launch size | <50 friends-and-family / few hundred / unknown-could-go-viral | **Unknown — could go viral** | Honest uncertainty; conflicts with the <$20 budget above, see flagged risk. |
| **Viral cost protection** | Hard auto-cap / accept risk / raise budget ceiling now | **Approval gate: pause and ask user before any budget increase** | User wants to be asked before spend increases rather than either an automatic cap that turns away players, or an automatic bill increase with no checkpoint. |

**Consequence for later phases:** need a billing/usage alert (e.g. LiveKit usage dashboard + a budget-alert webhook or cron check) that, when nearing the $20 ceiling, (a) stops new rooms from being created with a "temporarily full, check back soon" message, and (b) notifies the user directly (not silently raising spend or silently blocking) so they can explicitly approve a higher ceiling if they choose to. This needs building before any public/social sharing of the game link — must not launch without this safeguard in place given the viral uncertainty.

### Round 7 — Launch
_Status: decided — 2026-10-12_

**Flagged overlap:** "add Play now link as soon as technically live" vs. the Round 6 budget safety gate and the "just you + 3 friends" beta plan weren't sequenced together. Resolved below.

| Question | Options considered | Decision | Why |
|---|---|---|---|
| Timeline | No-fixed-deadline / 2-4 weeks / 1-3 months | **No fixed deadline, steady progress** | Avoids pressuring skipped test checkpoints between build phases. |
| First beta testers | You+3 friends / small waitlist group / everyone at once | **Just you + 3 friends** | Smallest real test (exactly the 4 players needed), easiest to debug directly. |
| Waitlist email usage | Hold-then-batch / email-everyone-immediately | **Hold until stable beta, then email in batches** | Avoids inviting people into something still breaking; controls load. |
| Landing page "Play now" link | Add-immediately-once-technical / wait-for-safety-gate | **Wait for the budget safety gate to be built first, then add the link** | Resolves the overlap — avoids a public link existing with no spend-protection in place yet. |

**Consequence for later phases:** build order must put the budget safety gate (from Round 6) before the landing-page "Play now" link goes in — tracked explicitly so it isn't skipped under "no fixed deadline" pressure; beta rollout is staged (you+3 friends → waitlist batches → public link) rather than one flip of a switch.

### Round 8 — Tech stack
_Status: decided — 2026-10-12_

**Research done before asking** (pricing/free-tier terms verified live rather than from memory, since they change often):
- LiveKit Cloud free (Build) tier: 5,000 WebRTC minutes/month, 100 concurrent connections — covers roughly 60 twenty-minute 4-player matches/month. Next tier (Ship) starts at **$50/month minimum** — a real cliff, not a small increment. [livekit.com/pricing](https://livekit.com/pricing)
- Render free web service: sleeps after 15 min idle, ~1 min cold-start on next connection/request. [render.com/docs/free](https://render.com/docs/free)
- Railway no longer has a real ongoing free tier (30-day trial + $5 credit, then $1/month credit after) — ruled out as the "free" fallback it was originally proposed as. [agentdeals.dev/vendor/railway](https://agentdeals.dev/vendor/railway)

| Question | Options considered | Decision | Why |
|---|---|---|---|
| Frontend framework | Vite+React / Next.js | **Vite + React + TypeScript** (user: no preference, used recommendation) | No SEO/content-indexing need (game is behind room codes) — Next.js's main advantages don't apply here. |
| Realtime layer | Socket.IO / raw WebSockets (`ws`) | **Socket.IO** | Built-in reconnection + room grouping directly matches the 60s reconnect grace period already decided — no need to hand-build that logic. |
| Video provider | LiveKit Cloud / reconsider alternatives (Daily.co etc.) | **LiveKit Cloud**, confirmed after seeing real pricing | Free tier comfortably covers beta; open-source means self-hosting is a genuine future escape valve if the $50/mo cliff ever becomes a real problem. |
| Game server hosting | Render free (accept cold starts) / small paid tier from day one | **Render free tier, accept occasional ~1 min cold starts** | User's explicit choice, made with full knowledge of the cold-start UX risk. |

**Consequence for later phases:** must build a clear "waking up the game server, one moment..." loading state for the cold-start case (not a silent/confusing delay), since free-tier sleep was accepted knowingly; LiveKit's $50/mo cliff is the concrete number behind the Round 6 "ask before raising budget" approval gate — crossing 5,000 WebRTC minutes/month is the trigger point to watch for, not a vague "if it gets expensive" feeling.

---

## Phase 0 Summary (all 8 rounds complete)

**Audience:** general/mixed audience, all ages/family-friendly, India-first but not blocked elsewhere, English+Hinglish voice.

**Game rules (researched, not assumed):** Sipahi guesses the Chor (not Mantri) — Raja reveals → calls Sipahi → Sipahi reveals → 60s interrogation of Mantri+Chor → Sipahi accuses → score (Raja 1000 fixed, Mantri 800 fixed, correct guess: Sipahi 500/Chor 0, wrong guess: Sipahi/Chor swap + wrongly-accused Mantri gets +300 bonus). Host picks 5/10/20 rounds per match; ties broken by one sudden-death round.

**Video:** camera-on by default with audio-only fallback; LiveKit auto-degrades to audio-only on bad networks with an on-screen warning; "live only, never recorded" disclosed before a just-in-time permission prompt.

**Rooms:** join via code or link; disconnect triggers a 60s pause-and-wait before the host decides; lives at `play.4chits.com`.

**Look and feel:** reuses the landing page's exact purple/gold theme and CSS tokens; sound effects only (flip/chime/timer); titled "4chits: Raja Mantri Chor Sipahi"; needs a new chit/scroll-motif icon before launch (not blocking earlier build phases).

**Money:** budget under $20/month to start; monetization direction is ads (later, not in v1 build); **flagged risk** — "could go viral" vs. a <$20 budget — resolved with an approval-gate safeguard: pause new rooms + ask the user before any spend increase, rather than auto-capping or auto-spending. This safeguard must be built before the landing page's "Play now" link goes live.

**Launch:** no fixed deadline; beta starts with the user + 3 friends; waitlist emails held and sent in controlled batches once stable; "Play now" link added to the landing page only after the budget safety gate exists.

**Tech stack:** Vite + React + TypeScript frontend; Socket.IO on a Node.js/TypeScript server for realtime game state (server deals chits — clients never see hidden roles); LiveKit Cloud for video/audio; Render free tier for server hosting (cold starts accepted knowingly, needs a loading state built).

**Two things flagged and resolved during this phase, not silently decided:** the viral-traffic-vs-budget risk (Round 6), and the "Play now" link needing to wait for the budget safety gate (Round 7).

**Say "start building" to move into build phases**, or raise anything above you want to revisit first.
