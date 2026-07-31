import type { PrefixCommand } from '../../types';
import { helpCommand } from './help';
import { pingCommand } from './ping';

export const prefixCommands: readonly PrefixCommand[] = [pingCommand, helpCommand];

export const prefixCommandMap: ReadonlyMap<string, PrefixCommand> = new Map(
  prefixCommands.map((command) => [command.name, command]),
);
