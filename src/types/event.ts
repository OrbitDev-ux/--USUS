import type { ClientEvents } from 'discord.js';

export interface AppEvent<K extends keyof ClientEvents> {
  readonly name: K;
  readonly once?: boolean;
  execute(...args: ClientEvents[K]): Promise<void> | void;
}

export function defineEvent<K extends keyof ClientEvents>(event: AppEvent<K>): AppEvent<K> {
  return event;
}
