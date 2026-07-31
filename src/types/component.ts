import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';

/**
 * customId가 `prefix`와 정확히 일치하거나 `prefix:인자1:인자2...` 형태일 때 실행된다.
 * 인자 부분은 `args`로 분리되어 전달된다.
 */
export interface ComponentHandler<I> {
  readonly prefix: string;
  execute(interaction: I, args: readonly string[]): Promise<void>;
}

export type ButtonHandler = ComponentHandler<ButtonInteraction<'cached'>>;
export type StringSelectHandler = ComponentHandler<StringSelectMenuInteraction<'cached'>>;
export type ChannelSelectHandler = ComponentHandler<ChannelSelectMenuInteraction<'cached'>>;
export type RoleSelectHandler = ComponentHandler<RoleSelectMenuInteraction<'cached'>>;
export type ModalHandler = ComponentHandler<ModalSubmitInteraction<'cached'>>;
