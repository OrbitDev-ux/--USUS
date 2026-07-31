import { getEnv } from './config/env';
import { createClient } from './core/client';
import { registerEvents } from './events';
import { logger } from './utils/logger';

process.on('unhandledRejection', (reason) => {
  logger.error('처리되지 않은 Promise 거부', reason);
});

async function main(): Promise<void> {
  const env = getEnv();
  const client = createClient();
  registerEvents(client);
  await client.login(env.token);
}

main().catch((error: unknown) => {
  logger.error('봇 시작 실패', error);
  process.exitCode = 1;
});
