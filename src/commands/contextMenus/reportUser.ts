import {
  ActionRowBuilder,
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { ComponentId } from '../../config/constants';
import type { UserContextMenuCommand } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { withArgs } from '../../utils/ids';

const FIELD = {
  reason: 'reason',
} as const;

const MAX_REASON_LENGTH = 500;

export const reportUserCommand: UserContextMenuCommand = {
  data: new ContextMenuCommandBuilder().setName('🚨 신고하기').setType(ApplicationCommandType.User),
  async execute(interaction) {
    if (interaction.targetId === interaction.user.id) {
      await interaction.reply({
        embeds: [errorEmbed('자기 자신은 신고할 수 없습니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (interaction.targetUser.bot) {
      await interaction.reply({ embeds: [errorEmbed('봇은 신고할 수 없습니다.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(withArgs(ComponentId.reportModal, interaction.targetId))
      .setTitle(`${interaction.targetUser.username} 님 신고`)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(FIELD.reason)
            .setLabel('신고 사유')
            .setPlaceholder('무슨 일이 있었는지 자세히 적어 주세요.')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(MAX_REASON_LENGTH)
            .setRequired(true),
        ),
      );

    await interaction.showModal(modal);
  },
};
