# Memento Agent

<div align="center">
    <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs" alt="Node.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Telegram-grammY-26A5E4?style=for-the-badge&logo=telegram" alt="Telegram" />
    <img src="https://img.shields.io/badge/Claude-Haiku-D97757?style=for-the-badge&logo=anthropic" alt="Anthropic" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/SQLite-Memory-003B57?style=for-the-badge&logo=sqlite" alt="SQLite" />
    <img src="https://img.shields.io/badge/AWS-EC2-FF9900?style=for-the-badge&logo=amazonaws" alt="AWS" />
</div>

<p align="center">
    <i>Memo is the official AI assistant of Memento Academy — a Telegram agent that teaches Web3, moderates the community, and personalizes responses using real user data from Supabase.</i>
</p>

## Channel Behavior

Each topic channel in the Telegram group has a distinct behavior and language assignment.

| Channel | Language | Behavior |
|---|---|---|
| **General** | Spanish | Trigger-based responses, weekly course reminders |
| **Español** | Spanish | Trigger-based responses |
| **English** | English | Trigger-based responses |
| **Quiz & Retos** | Spanish | Weekly quiz, automatic answer feedback |
| **MEMO Token** | Spanish | Responds to all messages without trigger |
| **Novedades** | Spanish | Automated crypto market summary |

## Scheduled Actions

Memo posts autonomously on a fixed weekly schedule without requiring user interaction.

| Day | Time (CET) | Channel | Content |
|---|---|---|---|
| **Monday** | 19:00 | Novedades | Top 3 crypto prices via CoinGecko |
| **Wednesday** | 19:00 | General | Available course reminder |
| **Thursday** | 20:00 | Quiz & Retos | Weekly quiz with automatic feedback |

## Moderation

Memo detects and acts on policy violations automatically. The owner receives a private alert for every triggered event.

| Violation Type | Detection Method | Actions Taken |
|---|---|---|
| **Spam** | Regex: suspicious links, giveaway/airdrop keywords, investment fraud | Delete message, public warning, private alert |
| **Offensive language** | Regex: profanity and insults in Spanish and English | Delete message, public warning, private alert |

Public warnings auto-delete after 30 minutes.

## User Profile Integration

Memo connects each Telegram user to their Memento Academy profile via `telegram_username` stored in Supabase. When a match is found, responses are personalized with real platform data.

| Data Source | Fields Used |
|---|---|
| **profiles** | `full_name`, `membership_tier`, `telegram_username` |
| **game_sessions** | `score`, `max_streak`, `rewarded` |
| **course_progress** | `course_id`, `progress_percentage` |

Users link their account by adding their Telegram username in their Memento Academy profile settings.

## System Architecture

| Component | Role |
|---|---|
| **telegram.ts** | Main bot handler — routes messages, manages rate limiting, calls Claude |
| **scheduler.ts** | Weekly cron — quiz, course reminders, crypto news |
| **supabase.ts** | Reads user profiles, game stats, and course progress from Supabase |
| **memory.ts** | Persists conversation history per thread in SQLite |
| **prices.ts** | Detects price-related queries and fetches live data from CoinGecko |
| **moderation.ts** | Regex-based spam and offensive content detection |
| **Anthropic Claude Haiku** | Generates all natural language responses |
| **AWS EC2 + systemd** | Hosts the process, restarts on failure |

## Technology Stack

- **Runtime**: Node.js 20+, TypeScript 5.7
- **Bot Framework**: grammY
- **AI**: Anthropic Claude Haiku (`claude-haiku-4-5-20251001`)
- **Database**: Supabase (PostgreSQL) for user data, SQLite via `better-sqlite3` for conversation memory
- **Prices**: CoinGecko API (free tier)
- **Deployment**: AWS EC2 Ubuntu 24.04, systemd service

## Key Features

1. **Persistent memory** — conversation history stored in SQLite survives bot restarts
2. **Real-time price awareness** — detects price questions and injects live CoinGecko data into the prompt
3. **Supabase-powered personalization** — responses reference actual user progress, scores, and membership tier
4. **Autonomous moderation** — deletes violations, warns users publicly, and alerts the owner privately
5. **Multi-language routing** — language assigned per topic channel, not per user
6. **Weekly autonomous schedule** — quiz, reminders, and market summary posted without human intervention
7. **Welcome onboarding** — new members receive instructions for linking their Memento Academy account

## Testing Strategy

There is no automated test suite. The bot is verified manually by triggering each handler directly in the Telegram group: sending `!quiz` to test the quiz flow, posting policy-violating messages to verify moderation, and using `!perfil` with a linked account to confirm Supabase reads. The scheduler is verified by temporarily setting the trigger time to the next minute and checking that the message posts correctly.

## Project Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env`:

   ```env
   # Telegram
   TELEGRAM_BOT_TOKEN=
   TELEGRAM_CHAT_ID=
   TELEGRAM_ES_THREAD_ID=
   TELEGRAM_EN_THREAD_ID=
   TELEGRAM_QUIZ_THREAD_ID=
   TELEGRAM_MEMO_THREAD_ID=
   TELEGRAM_OWNER_ID=

   # Anthropic
   ANTHROPIC_API_KEY=

   # Supabase
   SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

3. Build and start:

   ```bash
   npm run build
   node dist/index.js
   ```

4. Or run as a systemd service:

   ```bash
   sudo systemctl start memento-agent
   ```

---

Built for [Memento Academy](https://memento-academy.com) — Web3, crypto, and blockchain education.
