import type { Message } from 'discord.js';

export interface PrefixCommand {
  readonly name: string;
  readonly description: string;
  execute(message: Message<true>, args: readonly string[]): Promise<void>;
}
