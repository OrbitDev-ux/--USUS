import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { COLORS, LIMITS } from '../config/constants';
import {
  ORDER_STATUS_DEFS,
  buildOrderEmbed,
  formatOrderNumber,
  isOrderStatus,
} from '../modules/orderService';
import { buildReviewRequestRow } from '../modules/reviewService';
import { getOrders, updateOrderById } from '../storage/orderStore';
import type { Command, Order, OrderStatus } from '../types';
import { brandEmbed, errorEmbed, successEmbed } from '../utils/embeds';

const SUB = {
  list: '목록',
  status: '상태',
  progress: '진행률',
} as const;

const OPTION = {
  status: '상태',
  orderId: '번호',
  percent: '퍼센트',
} as const;

const MIN_ORDER_ID = 1;
const MIN_PERCENT = 0;
const MAX_PERCENT = 100;

const STATUS_CHOICES = (Object.keys(ORDER_STATUS_DEFS) as OrderStatus[]).map((status) => ({
  name: ORDER_STATUS_DEFS[status].label,
  value: status,
}));

async function notifyOrderChannel(order: Order, interaction: Parameters<Command['execute']>[0]): Promise<void> {
  if (order.channelId === null) {
    return;
  }
  const channel = interaction.guild.channels.cache.get(order.channelId);
  if (channel === undefined || !channel.isTextBased()) {
    return;
  }
  await channel
    .send({
      content: `<@${order.userId}>`,
      embeds: [buildOrderEmbed(order).setDescription('주문 정보가 업데이트되었습니다.')],
      components: order.status === 'done' ? [buildReviewRequestRow(order.id)] : [],
    })
    .catch(() => undefined);
}

export const orderCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('주문')
    .setDescription('외주 주문을 관리합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName(SUB.list)
        .setDescription('주문 목록을 확인합니다')
        .addStringOption((option) =>
          option
            .setName(OPTION.status)
            .setDescription('필터링할 상태')
            .addChoices(...STATUS_CHOICES),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(SUB.status)
        .setDescription('주문 상태를 변경합니다')
        .addIntegerOption((option) =>
          option
            .setName(OPTION.orderId)
            .setDescription('주문 번호')
            .setMinValue(MIN_ORDER_ID)
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName(OPTION.status)
            .setDescription('변경할 상태')
            .addChoices(...STATUS_CHOICES)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(SUB.progress)
        .setDescription('주문 진행률을 변경합니다')
        .addIntegerOption((option) =>
          option
            .setName(OPTION.orderId)
            .setDescription('주문 번호')
            .setMinValue(MIN_ORDER_ID)
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName(OPTION.percent)
            .setDescription('진행률 (0~100)')
            .setMinValue(MIN_PERCENT)
            .setMaxValue(MAX_PERCENT)
            .setRequired(true),
        ),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === SUB.list) {
      const statusFilter = interaction.options.getString(OPTION.status);
      const orders = await getOrders(interaction.guild.id);
      const filtered =
        statusFilter !== null && isOrderStatus(statusFilter)
          ? orders.filter((o) => o.status === statusFilter)
          : orders;

      if (filtered.length === 0) {
        await interaction.reply({
          embeds: [successEmbed('조건에 맞는 주문이 없습니다.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const recent = [...filtered].sort((a, b) => b.id - a.id).slice(0, LIMITS.orderListDisplay);
      const lines = recent.map(
        (order) =>
          `**${formatOrderNumber(order.id)}** [${ORDER_STATUS_DEFS[order.status].label}] ${order.service} — <@${order.userId}> · ${order.progress}%`,
      );
      await interaction.reply({
        embeds: [
          brandEmbed(COLORS.info)
            .setTitle(`💼 주문 목록 (${filtered.length}건 중 최근 ${recent.length}건)`)
            .setDescription(lines.join('\n')),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const orderId = interaction.options.getInteger(OPTION.orderId, true);

    if (sub === SUB.status) {
      const statusInput = interaction.options.getString(OPTION.status, true);
      if (!isOrderStatus(statusInput)) {
        await interaction.reply({
          embeds: [errorEmbed('알 수 없는 상태입니다.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const order = await updateOrderById(interaction.guild.id, orderId, (o) => {
        o.status = statusInput;
      });
      if (order === null) {
        await interaction.reply({
          embeds: [errorEmbed(`주문 ${formatOrderNumber(orderId)}을(를) 찾을 수 없습니다.`)],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await notifyOrderChannel(order, interaction);
      await interaction.reply({
        embeds: [
          successEmbed(
            `주문 ${formatOrderNumber(orderId)} 상태를 **${ORDER_STATUS_DEFS[statusInput].label}**(으)로 변경했습니다.`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const percent = interaction.options.getInteger(OPTION.percent, true);
    const order = await updateOrderById(interaction.guild.id, orderId, (o) => {
      o.progress = percent;
    });
    if (order === null) {
      await interaction.reply({
        embeds: [errorEmbed(`주문 ${formatOrderNumber(orderId)}을(를) 찾을 수 없습니다.`)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await notifyOrderChannel(order, interaction);
    await interaction.reply({
      embeds: [successEmbed(`주문 ${formatOrderNumber(orderId)} 진행률을 **${percent}%**로 변경했습니다.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
