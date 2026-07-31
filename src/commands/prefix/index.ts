import type { PrefixCommand } from '../../types';
import { channelCreateCommand } from './channelCreate';
import { helpCommand } from './help';
import { messageSendCommand } from './messageSend';
import { minigameCommand } from './minigame';
import { pingCommand } from './ping';
import { serverResetCommand } from './serverReset';
import { serverRestoreCommand } from './serverRestore';
import { serverSaveCommand } from './serverSave';

/** `.서버백업`과 완전히 동일하게 동작하는 별칭. 초기화 직후 되돌리고 싶을 때 이름으로도 찾을 수 있도록 둔다. */
const serverUndoCommand: PrefixCommand = {
  name: '서버실행취소',
  description: serverRestoreCommand.description,
  execute: serverRestoreCommand.execute,
};

export const prefixCommands: readonly PrefixCommand[] = [
  pingCommand,
  helpCommand,
  minigameCommand,
  channelCreateCommand,
  messageSendCommand,
  serverSaveCommand,
  serverResetCommand,
  serverRestoreCommand,
  serverUndoCommand,
];

export const prefixCommandMap: ReadonlyMap<string, PrefixCommand> = new Map(
  prefixCommands.map((command) => [command.name, command]),
);
