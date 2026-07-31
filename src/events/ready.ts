import { ActivityType, Events } from 'discord.js';
import { defineEvent } from '../types';
import { logger } from '../utils/logger';

export const readyEvent = defineEvent({
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`로그인 완료: ${client.user.tag}`);
    client.user.setActivity('Syntax Studio 외주 접수', { type: ActivityType.Watching });
  },
});
