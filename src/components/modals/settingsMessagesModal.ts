import { MessageFlags } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { SETTINGS_MESSAGE_FIELD } from '../../modules/settingsView';
import { updateGuildSettings } from '../../storage/settingsStore';
import type { ModalHandler } from '../../types';
import { errorEmbed, successEmbed } from '../../utils/embeds';
import { isAdmin } from '../../utils/permissions';

export const settingsMessagesModal: ModalHandler = {
  prefix: ComponentId.settingsMessagesModal,
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const welcome = interaction.fields.getTextInputValue(SETTINGS_MESSAGE_FIELD.welcome).trim();
    const farewell = interaction.fields.getTextInputValue(SETTINGS_MESSAGE_FIELD.farewell).trim();

    await updateGuildSettings(interaction.guild.id, (settings) => {
      settings.messages.welcome = welcome;
      settings.messages.farewell = farewell;
    });

    await interaction.reply({
      embeds: [successEmbed('환영·퇴장 메시지가 저장되었습니다.')],
      flags: MessageFlags.Ephemeral,
    });
  },
};
