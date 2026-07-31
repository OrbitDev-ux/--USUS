import { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { ComponentId } from '../../config/constants';
import {
  GUESS_MODAL_FIELD,
  GUESS_NUMBER_RANGE,
  buildDiceEmbed,
  buildDiceRow,
  buildRpsChoiceRow,
  buildRpsPromptEmbed,
  buildRpsReplayRow,
  buildRpsResultEmbed,
  getGuessSession,
  isRpsChoice,
  judgeRps,
  randomRpsChoice,
  rollDice,
} from '../../modules/miniGameService';
import type { ButtonHandler } from '../../types';
import { errorEmbed } from '../../utils/embeds';

function isOwner(userId: string, ownerId: string | undefined): boolean {
  return ownerId !== undefined && userId === ownerId;
}

export const gameRpsChoice: ButtonHandler = {
  prefix: ComponentId.gameRpsChoice,
  async execute(interaction, args) {
    const [choiceRaw, ownerId] = args;
    if (!isOwner(interaction.user.id, ownerId)) {
      await interaction.reply({ embeds: [errorEmbed('본인만 플레이할 수 있습니다.')], flags: MessageFlags.Ephemeral });
      return;
    }
    if (choiceRaw === undefined || !isRpsChoice(choiceRaw)) {
      await interaction.reply({ embeds: [errorEmbed('잘못된 선택입니다.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const botChoice = randomRpsChoice();
    const result = judgeRps(choiceRaw, botChoice);
    await interaction.update({
      embeds: [buildRpsResultEmbed(choiceRaw, botChoice, result)],
      components: [buildRpsReplayRow(ownerId as string)],
    });
  },
};

export const gameRpsReplay: ButtonHandler = {
  prefix: ComponentId.gameRpsReplay,
  async execute(interaction, args) {
    const ownerId = args[0];
    if (!isOwner(interaction.user.id, ownerId)) {
      await interaction.reply({ embeds: [errorEmbed('본인만 플레이할 수 있습니다.')], flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.update({ embeds: [buildRpsPromptEmbed()], components: [buildRpsChoiceRow(ownerId as string)] });
  },
};

export const gameDiceRoll: ButtonHandler = {
  prefix: ComponentId.gameDiceRoll,
  async execute(interaction, args) {
    const ownerId = args[0];
    if (!isOwner(interaction.user.id, ownerId)) {
      await interaction.reply({ embeds: [errorEmbed('본인만 플레이할 수 있습니다.')], flags: MessageFlags.Ephemeral });
      return;
    }
    const result = rollDice();
    await interaction.update({ embeds: [buildDiceEmbed(result)], components: [buildDiceRow(ownerId as string)] });
  },
};

export const gameGuessStart: ButtonHandler = {
  prefix: ComponentId.gameGuessStart,
  async execute(interaction) {
    const session = getGuessSession(interaction.message.id);
    if (session === undefined) {
      await interaction.reply({
        embeds: [errorEmbed('게임이 만료되었습니다. `.미니게임`으로 다시 시작해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (interaction.user.id !== session.ownerId) {
      await interaction.reply({ embeds: [errorEmbed('본인만 플레이할 수 있습니다.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(ComponentId.gameGuessModal)
      .setTitle('숫자 맞추기')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(GUESS_MODAL_FIELD.number)
            .setLabel(`${GUESS_NUMBER_RANGE.min}~${GUESS_NUMBER_RANGE.max} 사이의 숫자`)
            .setStyle(TextInputStyle.Short)
            .setMaxLength(3)
            .setRequired(true),
        ),
      );

    await interaction.showModal(modal);
  },
};
