# NanoClaw

<div align="center">
    <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs" alt="Node.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Claude-Anthropic-D97757?style=for-the-badge&logo=anthropic" alt="Anthropic" />
    <img src="https://img.shields.io/badge/Discord-129_online-5865F2?style=for-the-badge&logo=discord" alt="Discord" />
    <img src="https://img.shields.io/badge/Tokens-35.6k-orange?style=for-the-badge" alt="Tokens" />
</div>

<p align="center">
    <i>A personal Claude assistant that runs securely in containers — lightweight, auditable, and built to be understood and customized for your own needs.</i>
</p>

## Why NanoClaw Was Built

[OpenClaw](https://github.com/open-claw) is an impressive project with a great vision. But it is hard to sleep well running software you do not understand with access to your life. OpenClaw has 52+ modules, 8 config management files, 45+ dependencies, and abstractions for 15 channel providers. Security is application-level — allowlists and pairing codes — rather than OS isolation. Everything runs in one Node process with shared memory.

NanoClaw gives you the same core functionality in a codebase you can understand in 8 minutes. One process. A handful of files. Agents run in actual Linux containers with filesystem isolation, not behind permission checks.

## Design Principles

| Principle | Implementation |
|---|---|
| **Minimal** | Handful of files, no unnecessary abstractions |
| **Auditable** | Codebase readable in under 10 minutes |
| **Isolated** | Agents run in Linux containers with filesystem isolation |
| **Extensible** | Add channels, tools, and behaviors without touching core logic |
| **Transparent** | No magic — every behavior is traceable to a specific file |

## Agent Swarms

NanoClaw was the first Claude assistant to support **Agent Swarms** — teams of agents that collaborate inside your chat. Each agent runs in its own isolated container and communicates through a shared message bus.

## System Architecture

| Component | Role |
|---|---|
| **Core process** | Single Node.js process managing all channels and agent lifecycles |
| **Channel adapters** | Pluggable connectors for Telegram, WhatsApp, and other platforms |
| **Container runner** | Spins up isolated Linux containers per agent execution |
| **Task scheduler** | Cron-based scheduler for autonomous periodic actions |
| **SQLite store** | Lightweight persistence for conversation history and state |

## Technology Stack

- **Runtime**: Node.js 20+, TypeScript 5.7
- **AI**: Anthropic Claude (configurable model)
- **Containers**: Linux (Docker or native) with filesystem isolation
- **Storage**: SQLite via `better-sqlite3`
- **Testing**: Vitest

## Key Features

1. **Container isolation** — each agent runs in an isolated Linux container, not just permission checks
2. **Agent Swarms** — multiple agents collaborate in a single chat session
3. **Minimal surface area** — full codebase readable in under 10 minutes
4. **Pluggable channels** — add new messaging platforms without modifying core logic
5. **Built-in task scheduler** — cron-based autonomous actions with no external dependencies

## Testing Strategy

NanoClaw uses Vitest for unit and integration tests. Core modules — the database layer, container runner, IPC, and channel adapters — each have dedicated test files with mocked external dependencies. The WhatsApp channel is tested against a mock Baileys socket.

## Project Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env`:

   ```env
   ANTHROPIC_API_KEY=
   TELEGRAM_BOT_TOKEN=
   TELEGRAM_CHAT_ID=
   ```

3. Build and start:

   ```bash
   npm run build
   npm start
   ```

---

Original project by [NanoClaw](https://github.com/nanoclaw/nanoclaw).
