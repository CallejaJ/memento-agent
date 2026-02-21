# # Memento Agent — Memo

Memo is the official AI assistant of [Memento Academy](https://memento-academy.com), a free educational platform about Web3, cryptocurrencies, and blockchain.

Built on top of [NanoClaw](NANOCLAW.md) — a lightweight Claude agent framework.

---

## Features

### Community Management
- **Automatic welcome** — greets new members with onboarding instructions
- **Multi-language support** — responds in Spanish or English based on the topic channel
- **Profile linking** — users link their Memento Academy account via Telegram username
- **User stats** — `!perfil` shows real-time stats from Supabase (sessions, score, courses)

### Weekly Schedule
- **Monday 19:00 CET** — crypto market summary (Bitcoin, Ethereum, BNB) via CoinGecko
- **Wednesday 19:00 CET** — course reminder posted in General
- **Thursday 20:00 CET** — weekly quiz in Quiz & Retos with automatic feedback

### Intelligence
- **Real-time prices** — detects price-related questions and fetches live data from CoinGecko
- **Persistent memory** — conversation history stored in SQLite, survives restarts
- **Supabase integration** — personalized responses based on user profile, game stats, and course progress

### Moderation
- **Spam detection** — blocks suspicious links, giveaway scams, and investment fraud
- **Offensive content filtering** — detects and removes inappropriate language
- **Auto-delete** — removes offending messages immediately
- **Public warning** — notifies the user in the channel (auto-deletes after 30 min)
- **Private alert** — sends a detailed moderation report to the owner

### Commands
| Command | Description |
|---|---|
| `!perfil` | Shows your Memento Academy stats |
| `!quiz` | Manually triggers the weekly quiz (admin) |

---

## Tech Stack

- **Runtime** — Node.js + TypeScript
- **Bot framework** — [grammY](https://grammy.dev)
- **AI** — Anthropic Claude Haiku
- **Database** — Supabase (user profiles, game sessions, course progress)
- **Memory** — SQLite via better-sqlite3
- **Prices** — CoinGecko API (free tier)
- **Infrastructure** — AWS EC2 Ubuntu 24.04 + systemd

---

## Group Structure

| Topic | Language | Behavior |
|---|---|---|
| General | ES | Trigger-based, course reminders |
| Español | ES | Trigger-based |
| English | EN | Trigger-based |
| Quiz & Retos | ES | Quiz answers, weekly quiz |
| MEMO Token | ES | Responds to all messages |
| Novedades | ES | Crypto news (automated) |

---

## Environment Variables

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_ES_THREAD_ID=
TELEGRAM_EN_THREAD_ID=
TELEGRAM_QUIZ_THREAD_ID=
TELEGRAM_MEMO_THREAD_ID=
TELEGRAM_OWNER_ID=
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Deployment

```bash
npm install
npm run build
sudo systemctl start memento-agent
```
