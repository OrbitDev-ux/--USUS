import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type MessageActionRowComponentBuilder } from 'discord.js';
import { COLORS, ComponentId } from '../config/constants';
import type { Report } from '../types';
import { brandEmbed } from '../utils/embeds';
import { withArgs } from '../utils/ids';

export interface ReportStatusDef {
  readonly label: string;
  readonly color: number;
}

export const REPORT_STATUS_DEFS: Record<Report['status'], ReportStatusDef> = {
  pending: { label: '⏳ 대기 중', color: COLORS.warning },
  resolved: { label: '✅ 처리 완료', color: COLORS.success },
  dismissed: { label: '🚫 반려됨', color: COLORS.neutral },
};

export function buildReportEmbed(report: Report) {
  const statusDef = REPORT_STATUS_DEFS[report.status];
  const embed = brandEmbed(statusDef.color)
    .setTitle(`🚨 신고 #${report.id}`)
    .addFields(
      { name: '신고자', value: `<@${report.reporterId}>`, inline: true },
      { name: '대상', value: `<@${report.targetId}>`, inline: true },
      { name: '상태', value: statusDef.label, inline: true },
      { name: '사유', value: report.reason },
    );
  if (report.handledBy !== null) {
    embed.addFields({ name: '처리자', value: `<@${report.handledBy}>` });
  }
  return embed;
}

export function buildReportActionRow(reportId: number, disabled = false): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(withArgs(ComponentId.reportResolve, reportId))
      .setLabel('처리 완료')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(withArgs(ComponentId.reportDismiss, reportId))
      .setLabel('반려')
      .setEmoji('🚫')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );
}
