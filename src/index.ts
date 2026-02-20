import { startScheduler } from "./scheduler.js";
import { TelegramChannel } from './channels/telegram.js';
import { logger } from './logger.js';

// Re-export for backwards compatibility during refactor
export { escapeXml, formatMessages } from './router.js';

const telegram = new TelegramChannel();

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutdown signal received');
  await telegram.disconnect();
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function main(): Promise<void> {
  await telegram.connect();

const scheduler = { sendQuiz: async () => {} };
  logger.info('Memento Agent running (trigger: @MementoAcademyBot)');
}

// Guard: only run when executed directly, not when imported by tests
const isDirectRun =
  process.argv[1] &&
  new URL(import.meta.url).pathname === new URL(`file://${process.argv[1]}`).pathname;

if (isDirectRun) {
  main().catch((err) => {
    logger.error({ err }, 'Failed to start NanoClaw');
    process.exit(1);
  });
}
