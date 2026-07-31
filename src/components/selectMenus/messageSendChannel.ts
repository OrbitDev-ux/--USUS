import { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { MESSAGE_SEND_LIMITS, MESSAGE_SEND_MODAL_FIELD } from '../../modules/messageSendService';
import type { ChannelSelectHandler } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { isAdmin } from '../../utils/permissions';
import { withArgs } from '../../utils/ids';

export const messageSendChannel: ChannelSelectHandler = {
  prefix: ComponentId.messageSendChannel,
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channelId = interaction.values[0];
    if (channelId === undefined) {
      await interaction.reply({ embeds: [errorEmbed('채널을 선택해 주세요.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(withArgs(ComponentId.messageSendModal, channelId))
      .setTitle('메시지 전송')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(MESSAGE_SEND_MODAL_FIELD.content)
            .setLabel('보낼 메시지 내용')
            .setPlaceholder('예: @everyone 긴급 점검으로 서버가 10분간 중단됩니다.')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(MESSAGE_SEND_LIMITS.maxContentLength)
            .setRequired(true),
        ),
      );

    await interaction.showModal(modal);
  },
};
