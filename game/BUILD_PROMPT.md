You are helping me build the 4chits **web app** (PC/desktop browser first): a 4-player live video game of Raja Mantri Chor Sipahi. We will consider a mobile app as a separate phase *after* the web version is done — nothing here should assume a phone.

I am not a developer. Your most important job is to get clarity from me BEFORE deciding or building anything. Do not write code until Phase 0 is finished and I say "start building".

## How to ask me questions (follow strictly)
Before asking anything, read what you can yourself: the website repo `Mshubham28-tech/4chits` and anything I've given you. Never ask me something you could find out by reading.
Ask in rounds of at most 5 questions, grouped under one topic. Wait for my answers before the next round.
Every question must include:
  1. the options (2-4),
  2. your recommendation and a one-line reason,
  3. what changes in the app depending on my answer.
Use plain language. If a technical term is unavoidable, explain it in one sentence.
If I answer "your call", use your recommendation and say so.
If my answers contradict each other or seem risky, point it out and ask again. Don't quietly pick one.
Keep a file DECISIONS.md: every decision, the date, the options considered, and why. Update it after each round. Show me the summary at the end of Phase 0.
During building, if you hit anything not covered by DECISIONS.md, STOP and ask. Do not assume. Small purely technical choices that don't change what players see or what I pay are the only exception. List those in DECISIONS.md anyway.

## Phase 0: discovery (no code)
Cover at least these topics, one round each, in this order:
1. Players: who is this for (friend groups, families, college students), age range, India-only or global, which languages (English, Hindi, Hinglish).
2. Game rules: which version of the rules (regional versions differ, e.g. who guesses, scoring), rounds per match, timer lengths, what happens on a tie, my proposed changes below.
3. Video: always-on camera or optional, audio-only option, what happens on bad networks, privacy expectations, what browser permissions look like (camera/mic prompts) and what we tell players about that.
4. Rooms and joining: invite links, room codes, WhatsApp/sharing a link, what happens when someone leaves or refreshes the page, whether strangers can ever play together, what address the game lives at (e.g. `play.4chits.com` or `4chits.com/play`).
5. Look and feel: confirm the theme you extracted from the website (show me the colours, fonts and chit style you found), sounds, animations, app name and icon/favicon.
6. Money and limits: monthly budget for video and servers, whether the app will ever make money and how, expected number of players at launch.
7. Launch: timeline, beta testing plan (who tests first, how they get the link), what to do with the email waitlist from the website, whether this replaces or sits alongside the current landing page.
8. Tech stack: my current proposal is below. Explain the trade-offs simply and either confirm it or recommend something better.

## My current proposals (confirm or challenge in Phase 0)
Stack: a React web app (built with Vite), TypeScript, deployed as a normal website (not an app-store app) — works in any desktop browser, no install needed. Video via LiveKit (LiveKit Cloud to start — same service works for web and, later, mobile, so nothing here is wasted when we build the mobile app). A small Node.js + TypeScript game server with WebSockets that owns all game state and issues video tokens.
The server deals the chits and sends each player only their own chit. This one is not optional: dealing in the browser would let players cheat by reading the page's own code/network traffic.
Game: exactly 4 players. Raja 1000, Mantri 800, Sipahi 500, Chor 0. If the Mantri guesses wrong, the Chor takes the Mantri's 800. New rule: if the Mantri wrongly accuses the Sipahi, the Sipahi gets +300.
Round flow: deal (all 4 see their chit at once, equal video tiles) → Raja revealed, "Mera Mantri Kaun?" → Mantri revealed → 45-second interrogation with the two suspects' video tiles enlarged → Mantri accuses → reveal and score. 10 rounds per match.
Private rooms only for the first version, joined by code or share link. No matchmaking with strangers.
No accounts. Display name only.
Out of scope for now: leaderboards, streaks, quick-match, avatars, recording or replays, payments, and the mobile app itself (phase 2, after web ships).

## Theme
The app must match the brand of 4chits.com. Read the repo's `landing/styles.css` (CSS custom properties under `:root`, e.g. `--purple-600`, `--gold`), `landing/index.html`, and the chit reveal/shuffle behavior in `landing/script.js`, and extract the colours, fonts, radius, and the chit fold/unfold interaction into one theme file. Show me what you found in Phase 0 round 5 before using it. If you can't access the repo, ask me to paste the files. Never invent a palette.

## Building phases (only after Phase 0)
Propose the phases based on my answers, for example: web app shell and theme → server, rooms and lobby → game loop without video (with automated tests for dealing and scoring) → video and audio → polish and pre-launch checks.
At the START of each phase, ask me any questions specific to that phase (same rules as above).
At the END of each phase, stop and give me step-by-step instructions to test it on my own computer, including checking it in at least two different browsers (e.g. Chrome and Safari/Edge), and having a second real person join from their own computer over the actual internet (not just two tabs on your machine) to confirm it works across a real network, not just locally. Wait for my go-ahead.

## Always
Explain any account, key or payment I need to set up, one step at a time.
Never put secret keys inside the web app's front-end code (anything shipped to the browser is visible to anyone — secrets belong only on the server).
If something I ask for is a bad idea, say so directly with a reason and an alternative, and wait for my decision.
