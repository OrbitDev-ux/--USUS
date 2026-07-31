import { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { CHANNEL_CREATE_LIMITS, CHANNEL_CREATE_MODAL_FIELD } from '../../modules/channelCreateService';
import type { ButtonHandler } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { isAdmin } from '../../utils/permissions';

export const channelCreateStart: ButtonHandler = {
  prefix: ComponentId.channelCreateStart,
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(ComponentId.channelCreateModal)
      .setTitle('채널 생성')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(CHANNEL_CREATE_MODAL_FIELD.name)
            .setLabel('채널 이름')
            .setPlaceholder('상담')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(CHANNEL_CREATE_LIMITS.maxNameLength)
            .setRequired(true),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(CHANNEL_CREATE_MODAL_FIELD.count)
            .setLabel(`개수 (${CHANNEL_CREATE_LIMITS.minCount}~${CHANNEL_CREATE_LIMITS.maxCount})`)
            .setPlaceholder('1')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(2)
            .setRequired(true),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(CHANNEL_CREATE_MODAL_FIELD.kind)
            .setLabel('종류 (텍스트 / 음성, 비우면 텍스트)')
            .setPlaceholder('텍스트')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(10)
            .setRequired(false),
        ),
      );

    await interaction.showModal(modal);
  },
};
