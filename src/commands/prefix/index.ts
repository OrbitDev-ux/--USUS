import type { PrefixCommand } from '../../types';
import { helpCommand } from './help';
import { minigameCommand } from './minigame';
import { pingCommand } from './ping';

export const prefixCommands: readonly PrefixCommand[] = [pingCommand, helpCommand, minigameCommand];

export const prefixCommandMap: ReadonlyMap<string, PrefixCommand> = new Map(
  prefixCommands.map((command) => [command.name, command]),
);
