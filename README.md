# 🕸️ SCRAPER NEXUS — Ghost Edition

> **Mobile-first multi-agent web scraper with Discord webhooks.**
> Built for Mettlestate · Deep Space Dev aesthetic.

---

## 📁 Folder Structure

```
scraper-nexus/
│
├── index.html                  ← Main app shell (open this in browser)
│
├── css/
│   ├── theme.css               ← CSS variables, fonts, base styles
│   ├── animations.css          ← All keyframes & animation utilities
│   ├── layout.css              ← Starfield, nav, page grid, bottom bar
│   └── components.css          ← Cards, buttons, toggles, modals, forms
│
├── js/
│   ├── core/
│   │   ├── storage.js          ← LocalStorage wrapper (agents, logs, settings)
│   │   └── events.js           ← App-wide event bus (EV constants)
│   │
│   ├── agents/
│   │   ├── manager.js          ← Agent CRUD, enable/disable, scheduling, run
│   │   └── scraper.js          ← Platform scrapers (Twitter, Reddit, RSS, Web, GitHub, YouTube)
│   │
│   ├── discord/
│   │   └── webhook.js          ← Discord embed builder, webhook sender, test
│   │
│   └── ui/
│       ├── toast.js            ← Toast notification system
│       ├── modals.js           ← Agent create/edit modal, confirm dialogs
│       ├── dashboard.js        ← Page renderers (Dashboard, Agents, Logs, Settings)
│       └── app.js              ← Entry point, routing, global handlers, starfield
│
└── README.md                   ← This file
```

---

## 🚀 Getting Started

### Option A — Open Directly
Just open `index.html` in a mobile browser. No server required.

### Option B — Local Server (recommended for full scraping support)
```bash
# Python
python3 -m http.server 3000

# Node
npx serve .
```
Then open `http://localhost:3000`

---

## 🤖 Platforms Supported

| Platform | Notes |
|----------|-------|
| 🐦 Twitter/X | Via Nitter RSS (no API key needed) |
| 👾 Reddit | Via public JSON API |
| 📡 RSS/Atom | Any public RSS/Atom feed |
| 🌐 Custom Web | CSS selector scraping via CORS proxy |
| 🐙 GitHub | Public events API |
| ▶️ YouTube | Channel RSS feed |

---

## 📨 Discord Setup

1. Go to your Discord server → Channel Settings → Integrations → Webhooks
2. Create a new webhook, copy the URL
3. Paste it in **Settings → Global Discord Webhook** OR per-agent in the agent editor
4. Click **Test Webhook** to verify

---

## ⚙️ Agent Rules

Each agent has platform-specific rules:

### Twitter
- `username` — Who to monitor
- `keywords` — Filter tweets by keywords
- `excludeRetweets` — Skip retweets
- `includeMedia` — Attach images

### Reddit
- `subreddit` — Which subreddit
- `sortBy` — new / hot / top / rising
- `minScore` — Minimum upvotes
- `flairs` — Filter by flair text

### RSS
- `feedUrl` — Full RSS/Atom URL
- `keywords` — Filter items
- `maxItems` — How many per run

### Custom Web
- `targetUrl` — Page to scrape
- `cssSelector` — CSS selector for elements
- `keywords` — Filter matched text

### GitHub
- `repo` — owner/repo format
- `watchEvents` — Push, Issues, PRs, Releases...

### YouTube
- `channelId` — Channel ID (from URL)
- `keywords` — Filter video titles

---

## 🔧 Features Per Agent

| Feature | Description |
|---------|-------------|
| Post to Discord | Send results to webhook |
| Dry Run Mode | Scrape but don't post — for testing |
| Filter Duplicates | Skip already-seen URLs |
| Include Thumbnails | Attach images in Discord embeds |
| Custom Message | Prefix text before each embed |
| Mention Role | Ping a Discord role |
| Embed Color | Custom color for Discord embeds |

---

## 💾 Export / Import

- **Export** — Downloads all agents + settings + stats as `.json`
- **Import** — Restores from a backup file
- **Export Logs** — Downloads activity log as `.json`

---

## 📝 Notes

- All data stored in **browser localStorage** (survives refresh, cleared with browser data)
- Scraping uses CORS proxies (`allorigins.win`, `corsproxy.io`) — no backend needed
- Twitter uses **Nitter** (open-source Twitter frontend) RSS — may need to swap instances if they go down
- For production use, deploy a simple Node.js backend to avoid CORS limitations

---

## 🎨 Design

**Deep Space Dev** aesthetic:
- Font: Orbitron (display) + JetBrains Mono (code) + Rajdhani (body)
- Colors: Deep navy `#03030a` · Violet `#7c3aed` · Cyan `#00d4ff`
- Effects: Animated starfield, glassmorphism cards, scanlines, glow animations

---

*Scraper Nexus v1.0.0 — Ghost Edition · Made for Mettlestate Leagues*
