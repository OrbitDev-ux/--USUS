import type { Command, UserContextMenuCommand } from '../types';
import { announceCommand } from './announce';
import { banCommand } from './ban';
import { reportUserCommand } from './contextMenus/reportUser';
import { kickCommand } from './kick';
import { maintenanceCommand } from './maintenance';
import { orderCommand } from './order';
import { portfolioCommand } from './portfolio';
import { settingsCommand } from './settings';
import { setupCommand } from './setup';
import { statsCommand } from './stats';
import { timeoutCommand } from './timeout';
import { updateCommand } from './update';
import { warnCommand } from './warn';

export const commands: readonly Command[] = [
  setupCommand,
  settingsCommand,
  announceCommand,
  updateCommand,
  maintenanceCommand,
  warnCommand,
  banCommand,
  timeoutCommand,
  kickCommand,
  orderCommand,
  portfolioCommand,
  statsCommand,
];

export const contextMenuCommands: readonly UserContextMenuCommand[] = [reportUserCommand];

export const commandMap: ReadonlyMap<string, Command> = new Map(
  commands.map((command) => [command.data.name, command]),
);

export const contextMenuCommandMap: ReadonlyMap<string, UserContextMenuCommand> = new Map(
  contextMenuCommands.map((command) => [command.data.name, command]),
);
