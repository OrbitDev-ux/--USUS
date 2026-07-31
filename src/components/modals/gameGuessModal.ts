import { MessageFlags } from 'discord.js';
import { ComponentId } from '../../config/constants';
import {
  GUESS_MODAL_FIELD,
  GUESS_NUMBER_RANGE,
  buildGuessButtonRow,
  buildGuessEmbed,
  endGuessSession,
  getGuessSession,
} from '../../modules/miniGameService';
import type { ModalHandler } from '../../types';
import { errorEmbed } from '../../utils/embeds';

export const gameGuessModal: ModalHandler = {
  prefix: ComponentId.gameGuessModal,
  async execute(interaction) {
    if (!interaction.isFromMessage()) {
      await interaction.reply({ embeds: [errorEmbed('게임 정보를 찾을 수 없습니다.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const messageId = interaction.message.id;
    const session = getGuessSession(messageId);
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

    const raw = interaction.fields.getTextInputValue(GUESS_MODAL_FIELD.number).trim();
    const guess = Number(raw);
    if (!Number.isInteger(guess) || guess < GUESS_NUMBER_RANGE.min || guess > GUESS_NUMBER_RANGE.max) {
      await interaction.reply({
        embeds: [errorEmbed(`${GUESS_NUMBER_RANGE.min}~${GUESS_NUMBER_RANGE.max} 사이의 숫자를 입력해 주세요.`)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    session.attempts += 1;

    if (guess === session.secret) {
      endGuessSession(messageId);
      await interaction.update({ embeds: [buildGuessEmbed(session, 'won')], components: [] });
      return;
    }

    session.lastHint = guess < session.secret ? '🔼 더 큽니다' : '🔽 더 작습니다';

    if (session.attempts >= session.maxAttempts) {
      endGuessSession(messageId);
      await interaction.update({ embeds: [buildGuessEmbed(session, 'lost')], components: [] });
      return;
    }

    await interaction.update({ embeds: [buildGuessEmbed(session, false)], components: [buildGuessButtonRow()] });
  },
};
