import type { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
  readonly data: Pick<SlashCommandBuilder, 'name' | 'toJSON'>;
  /** true면 라우터에서 서버 관리 권한을 추가로 검증한다. */
  readonly adminOnly?: boolean;
  execute(interaction: ChatInputCommandInteraction<'cached'>): Promise<void>;
}
