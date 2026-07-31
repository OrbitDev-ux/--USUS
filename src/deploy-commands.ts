import { REST, Routes } from 'discord.js';
import { commands, contextMenuCommands } from './commands';
import { getEnv } from './config/env';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  const env = getEnv();
  const rest = new REST().setToken(env.token);
  const body = [...commands.map((command) => command.data.toJSON()), ...contextMenuCommands.map((command) => command.data.toJSON())];

  if (env.guildId !== null) {
    await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId), { body });
    logger.info(`${body.length}개 명령어를 서버(${env.guildId})에 등록했습니다.`);
  } else {
    await rest.put(Routes.applicationCommands(env.clientId), { body });
    logger.info(`${body.length}개 명령어를 전역으로 등록했습니다. (반영까지 최대 1시간)`);
  }
}

main().catch((error: unknown) => {
  logger.error('명령어 등록 실패', error);
  process.exitCode = 1;
});
