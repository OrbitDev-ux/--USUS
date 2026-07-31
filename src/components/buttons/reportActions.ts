import { MessageFlags } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { buildReportActionRow, buildReportEmbed } from '../../modules/reportService';
import { updateReportStatus } from '../../storage/reportStore';
import { getGuildSettings } from '../../storage/settingsStore';
import type { ButtonHandler, ReportStatus } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { isStaff } from '../../utils/permissions';

async function handle(
  interaction: Parameters<ButtonHandler['execute']>[0],
  args: readonly string[],
  status: ReportStatus,
): Promise<void> {
  const settings = await getGuildSettings(interaction.guild.id);
  if (!isStaff(interaction.member, settings)) {
    await interaction.reply({ embeds: [errorEmbed('신고 처리 권한이 없습니다.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const reportId = Number(args[0]);
  if (!Number.isInteger(reportId)) {
    await interaction.reply({ embeds: [errorEmbed('잘못된 신고 번호입니다.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const report = await updateReportStatus(interaction.guild.id, reportId, status, interaction.user.id);
  if (report === null) {
    await interaction.reply({ embeds: [errorEmbed('신고 내역을 찾을 수 없습니다.')], flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.update({
    embeds: [buildReportEmbed(report)],
    components: [buildReportActionRow(report.id, true)],
  });
}

export const reportResolve: ButtonHandler = {
  prefix: ComponentId.reportResolve,
  async execute(interaction, args) {
    await handle(interaction, args, 'resolved');
  },
};

export const reportDismiss: ButtonHandler = {
  prefix: ComponentId.reportDismiss,
  async execute(interaction, args) {
    await handle(interaction, args, 'dismissed');
  },
};
