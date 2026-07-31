import type { ContextMenuCommandBuilder, UserContextMenuCommandInteraction } from 'discord.js';

export interface UserContextMenuCommand {
  readonly data: Pick<ContextMenuCommandBuilder, 'name' | 'toJSON'>;
  execute(interaction: UserContextMenuCommandInteraction<'cached'>): Promise<void>;
}
