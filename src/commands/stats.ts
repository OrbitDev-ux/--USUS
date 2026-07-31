import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../config/constants';
import { ORDER_STATUS_DEFS } from '../modules/orderService';
import { getOrders } from '../storage/orderStore';
import { getReports } from '../storage/reportStore';
import { getReviews } from '../storage/reviewStore';
import { getTickets } from '../storage/ticketStore';
import { getTotalWarnCount } from '../storage/warnStore';
import type { Command, OrderStatus } from '../types';
import { brandEmbed } from '../utils/embeds';

export const statsCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('통계')
    .setDescription('서버 운영 통계를 확인합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const [tickets, orders, reports, reviews, totalWarns] = await Promise.all([
      getTickets(interaction.guild.id),
      getOrders(interaction.guild.id),
      getReports(interaction.guild.id),
      getReviews(interaction.guild.id),
      getTotalWarnCount(interaction.guild.id),
    ]);

    const openTickets = tickets.filter((t) => t.status === 'open').length;
    const pendingReports = reports.filter((r) => r.status === 'pending').length;
    const avgRating =
      reviews.length === 0 ? null : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const orderStatusLines = (Object.keys(ORDER_STATUS_DEFS) as OrderStatus[])
      .map((status) => {
        const count = orders.filter((o) => o.status === status).length;
        return count > 0 ? `${ORDER_STATUS_DEFS[status].label}: ${count}건` : null;
      })
      .filter((line): line is string => line !== null);

    await interaction.reply({
      embeds: [
        brandEmbed(COLORS.primary)
          .setTitle('📊 서버 통계')
          .addFields(
            { name: '👥 멤버 수', value: `${interaction.guild.memberCount}명`, inline: true },
            { name: '🎫 티켓', value: `총 ${tickets.length}건 (진행 중 ${openTickets}건)`, inline: true },
            { name: '⚠️ 누적 경고', value: `${totalWarns}건`, inline: true },
            { name: '🚨 신고', value: `총 ${reports.length}건 (대기 ${pendingReports}건)`, inline: true },
            {
              name: '⭐ 후기',
              value: reviews.length === 0 ? '없음' : `${reviews.length}건, 평균 ${avgRating!.toFixed(1)}점`,
              inline: true,
            },
            {
              name: '💼 주문 현황',
              value: orders.length === 0 ? '없음' : `총 ${orders.length}건\n${orderStatusLines.join('\n')}`,
            },
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
