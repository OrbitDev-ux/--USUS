import { MessageFlags } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { MESSAGE_SEND_MODAL_FIELD } from '../../modules/messageSendService';
import type { ModalHandler } from '../../types';
import { errorEmbed, successEmbed } from '../../utils/embeds';
import { isAdmin } from '../../utils/permissions';

export const messageSendModal: ModalHandler = {
  prefix: ComponentId.messageSendModal,
  async execute(interaction, args) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channelId = args[0];
    if (channelId === undefined) {
      await interaction.reply({ embeds: [errorEmbed('잘못된 요청입니다.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const channel = interaction.guild.channels.cache.get(channelId);
    if (channel === undefined || !channel.isTextBased()) {
      await interaction.reply({ embeds: [errorEmbed('채널을 찾을 수 없습니다.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const content = interaction.fields.getTextInputValue(MESSAGE_SEND_MODAL_FIELD.content);

    try {
      await channel.send({ content });
    } catch {
      await interaction.reply({
        embeds: [errorEmbed('메시지 전송에 실패했습니다. 봇이 해당 채널에 메시지를 보낼 권한이 있는지 확인해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [successEmbed(`${channel}에 메시지를 전송했습니다.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
