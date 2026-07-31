import type { Client, ClientEvents } from 'discord.js';
import type { AppEvent } from '../types';
import { logger } from '../utils/logger';
import { guildMemberAddEvent } from './guildMemberAdd';
import { guildMemberRemoveEvent } from './guildMemberRemove';
import { interactionCreateEvent } from './interactionCreate';
import { messageCreateEvent } from './messageCreate';
import { messageDeleteEvent } from './messageDelete';
import { messageUpdateEvent } from './messageUpdate';
import { readyEvent } from './ready';

function bind<K extends keyof ClientEvents>(client: Client, event: AppEvent<K>): void {
  const listener = (...args: ClientEvents[K]): void => {
    void Promise.resolve(event.execute(...args)).catch((error: unknown) => {
      logger.error(`이벤트 처리 중 오류: ${String(event.name)}`, error);
    });
  };
  if (event.once === true) {
    client.once(event.name, listener);
  } else {
    client.on(event.name, listener);
  }
}

export function registerEvents(client: Client): void {
  bind(client, readyEvent);
  bind(client, interactionCreateEvent);
  bind(client, guildMemberAddEvent);
  bind(client, guildMemberRemoveEvent);
  bind(client, messageCreateEvent);
  bind(client, messageDeleteEvent);
  bind(client, messageUpdateEvent);
}
