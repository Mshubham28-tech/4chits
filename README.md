# 4chits

Online home of **Raja Mantri Chor Sipahi** — the classic Indian paper-chit bluffing game, rebuilt for the web.

## Repo structure

```
4chits/
├── landing/        # Static marketing/waitlist site (live now)
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── game/           # Multiplayer game app (not started yet — Phase 2)
├── CNAME           # GitHub Pages custom domain config
└── README.md
```

## Previewing locally

No build step — just open `landing/index.html` in a browser, or serve it:

```bash
cd landing
python3 -m http.server 8000
# visit http://localhost:8000
```

## Deployment: GitHub Pages + your Namecheap domain

This repo is set up to deploy the `landing/` folder via **GitHub Pages**, served at `www.4chits.com`.

### One-time GitHub setup
1. In the repo on GitHub: **Settings → Pages**.
2. Under "Build and deployment", set **Source: Deploy from a branch**.
3. Branch: `main`, folder: `/landing` (if GitHub Pages doesn't offer a subfolder option in your UI, see the note below about using a `gh-pages` branch or moving `landing/` contents to the repo root).
4. Under "Custom domain", enter `www.4chits.com` and save. GitHub will show a verification/DNS check status — this will go red until the DNS step below is done.

### DNS setup at Namecheap
Go to Namecheap → Domain List → Manage → **Advanced DNS** for 4chits.com, and add:

| Type | Host | Value | 
|---|---|---|
| CNAME Record | www | `<your-github-username>.github.io.` |
| A Record | @ | 185.199.108.153 |
| A Record | @ | 185.199.109.153 |
| A Record | @ | 185.199.110.153 |
| A Record | @ | 185.199.111.153 |

This points both `4chits.com` (apex) and `www.4chits.com` at GitHub Pages. Remove any existing "Parking Page" redirect or URL Redirect Record Namecheap may have set up by default — it will conflict.

DNS changes can take anywhere from a few minutes to ~24 hours to propagate. Once it resolves, go back to the GitHub Pages settings and tick **Enforce HTTPS** (it may take a few minutes to become available after the domain verifies).

### Note on the `/landing` subfolder
GitHub Pages' simplest "deploy from a branch" mode serves from the **root** of a branch, not an arbitrary subfolder, on most plans. If the Pages settings UI doesn't let you pick `/landing`, the two easiest fixes are:
- **Option A (simplest):** move everything from `landing/` to the repo root, and keep `game/` as the only subfolder.
- **Option B:** add a small GitHub Actions workflow that publishes `landing/` to a `gh-pages` branch on every push to `main` (ask Claude to set this up if you'd prefer this route).

## Setting up email signups
The alpha signup form currently points at a placeholder in `landing/script.js` (`FORM_ENDPOINT`). To actually collect emails:
1. Create a free account at [Formspree](https://formspree.io) (or similar — Getform, Basin).
2. Create a form, copy its endpoint URL.
3. Paste it into `FORM_ENDPOINT` in `landing/script.js`, replacing `REPLACE_ME`.

Until that's set, the form will show a friendly "thanks" message to visitors but won't actually capture any email — check the browser console for a reminder.

## Social links
`index.html` currently links to placeholder handles (`4chitsgame` on X/Instagram, and a Discord invite). Update these in the footer once real accounts exist.

## Roadmap
- [x] Landing page live, collecting signups
- [ ] Game architecture decided (see project task list)
- [ ] Core round logic (single-device simulation)
- [ ] Real-time multiplayer for one room
- [ ] Matchmaking + leaderboard
- [ ] Live voice/video bluffing layer
- [ ] Polish: avatars, animations, mobile
