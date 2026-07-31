import type { PrefixCommand } from '../../types';
import { channelCreateCommand } from './channelCreate';
import { helpCommand } from './help';
import { minigameCommand } from './minigame';
import { pingCommand } from './ping';
import { serverResetCommand } from './serverReset';
import { serverRestoreCommand } from './serverRestore';
import { serverSaveCommand } from './serverSave';

export const prefixCommands: readonly PrefixCommand[] = [
  pingCommand,
  helpCommand,
  minigameCommand,
  channelCreateCommand,
  serverSaveCommand,
  serverResetCommand,
  serverRestoreCommand,
];

export const prefixCommandMap: ReadonlyMap<string, PrefixCommand> = new Map(
  prefixCommands.map((command) => [command.name, command]),
);
