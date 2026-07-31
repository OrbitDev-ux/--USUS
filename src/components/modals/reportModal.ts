import { MessageFlags } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { buildReportActionRow, buildReportEmbed } from '../../modules/reportService';
import { addReport, reserveReportId } from '../../storage/reportStore';
import { getGuildSettings } from '../../storage/settingsStore';
import type { ModalHandler } from '../../types';
import { errorEmbed, successEmbed } from '../../utils/embeds';

const FIELD = { reason: 'reason' } as const;

export const reportModal: ModalHandler = {
  prefix: ComponentId.reportModal,
  async execute(interaction, args) {
    const targetId = args[0];
    if (targetId === undefined) {
      await interaction.reply({ embeds: [errorEmbed('잘못된 요청입니다.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const settings = await getGuildSettings(interaction.guild.id);
    if (settings.channels.report === null) {
      await interaction.reply({
        embeds: [
          errorEmbed('신고 접수 채널이 설정되지 않았습니다. 신고가 접수되지 않았으니 관리자에게 문의해 주세요.'),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const channel = interaction.guild.channels.cache.get(settings.channels.report);
    if (channel === undefined || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [errorEmbed('신고 접수 채널을 찾을 수 없습니다. 관리자에게 문의해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const reason = interaction.fields.getTextInputValue(FIELD.reason).trim();
    const id = await reserveReportId();
    const report = {
      id,
      guildId: interaction.guild.id,
      reporterId: interaction.user.id,
      targetId,
      reason,
      status: 'pending' as const,
      handledBy: null,
      createdAt: new Date().toISOString(),
    };
    await addReport(report);

    const staffMention = settings.roles.staff !== null ? `<@&${settings.roles.staff}>` : '';
    await channel.send({
      content: staffMention,
      embeds: [buildReportEmbed(report)],
      components: [buildReportActionRow(id)],
    });

    await interaction.reply({
      embeds: [successEmbed('신고가 접수되었습니다. 담당자가 확인 후 처리합니다.')],
      flags: MessageFlags.Ephemeral,
    });
  },
};
