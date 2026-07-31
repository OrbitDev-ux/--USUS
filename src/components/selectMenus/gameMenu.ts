import { MessageFlags } from 'discord.js';
import { MINIGAME_MENU_VALUE } from '../../commands/prefix/minigame';
import { ComponentId } from '../../config/constants';
import {
  buildDiceEmbed,
  buildDiceRow,
  buildGuessButtonRow,
  buildGuessEmbed,
  buildRpsChoiceRow,
  buildRpsPromptEmbed,
  rollDice,
  startGuessSession,
} from '../../modules/miniGameService';
import type { StringSelectHandler } from '../../types';
import { errorEmbed } from '../../utils/embeds';

export const gameMenu: StringSelectHandler = {
  prefix: ComponentId.gameMenu,
  async execute(interaction, args) {
    const ownerId = args[0];
    if (ownerId === undefined || interaction.user.id !== ownerId) {
      await interaction.reply({
        embeds: [errorEmbed('명령어를 실행한 본인만 선택할 수 있습니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const value = interaction.values[0];

    if (value === MINIGAME_MENU_VALUE.rps) {
      await interaction.update({ embeds: [buildRpsPromptEmbed()], components: [buildRpsChoiceRow(ownerId)] });
      return;
    }

    if (value === MINIGAME_MENU_VALUE.dice) {
      const result = rollDice();
      await interaction.update({ embeds: [buildDiceEmbed(result)], components: [buildDiceRow(ownerId)] });
      return;
    }

    if (value === MINIGAME_MENU_VALUE.guess) {
      const session = startGuessSession(interaction.message.id, ownerId);
      await interaction.update({ embeds: [buildGuessEmbed(session, false)], components: [buildGuessButtonRow()] });
      return;
    }

    await interaction.reply({ embeds: [errorEmbed('알 수 없는 게임입니다.')], flags: MessageFlags.Ephemeral });
  },
};
