import {
  ChannelType,
  MessageFlags,
  type ModalSubmitInteraction,
} from 'discord.js';
import { COLORS, LIMITS } from '../config/constants';
import { addOrder, findActiveOrderByUser, reserveOrderId } from '../storage/orderStore';
import { getGuildSettings } from '../storage/settingsStore';
import type { Order, OrderStatus } from '../types';
import { brandEmbed, errorEmbed, successEmbed } from '../utils/embeds';
import { padNumber, renderProgressBar } from '../utils/format';
import { buildPrivateChannelOverwrites } from './privateChannel';
import { sendLog } from './logService';

const ORDER_CHANNEL_PREFIX = '주문';

export interface OrderStatusDef {
  readonly label: string;
  readonly color: number;
}

export const ORDER_STATUS_DEFS: Record<OrderStatus, OrderStatusDef> = {
  pending: { label: '접수됨', color: COLORS.info },
  quoted: { label: '견적 제시', color: COLORS.warning },
  in_progress: { label: '진행 중', color: COLORS.primary },
  review: { label: '검수 중', color: COLORS.warning },
  done: { label: '완료', color: COLORS.success },
  cancelled: { label: '취소됨', color: COLORS.danger },
};

export function isOrderStatus(value: string): value is OrderStatus {
  return value in ORDER_STATUS_DEFS;
}

export function formatOrderNumber(id: number): string {
  return `#${padNumber(id, LIMITS.numberPadWidth)}`;
}

export function buildOrderEmbed(order: Order) {
  const statusDef = ORDER_STATUS_DEFS[order.status];
  return brandEmbed(statusDef.color)
    .setTitle(`💼 주문 ${formatOrderNumber(order.id)}`)
    .addFields(
      { name: '👤 의뢰인', value: `<@${order.userId}>`, inline: true },
      { name: '🛠️ 서비스', value: order.service, inline: true },
      { name: '💰 예산', value: order.budget, inline: true },
      { name: '📅 희망 마감일', value: order.deadline, inline: true },
      { name: '📊 상태', value: statusDef.label, inline: true },
      { name: '📈 진행률', value: renderProgressBar(order.progress), inline: true },
      { name: '📝 상세 내용', value: order.details },
    );
}

export interface OrderRequestFields {
  readonly service: string;
  readonly budget: string;
  readonly deadline: string;
  readonly details: string;
}

export async function createOrder(
  interaction: ModalSubmitInteraction<'cached'>,
  fields: OrderRequestFields,
): Promise<void> {
  const { guild, member } = interaction;

  const existing = await findActiveOrderByUser(guild.id, member.id);
  if (existing !== null) {
    const location = existing.channelId !== null ? `<#${existing.channelId}>` : formatOrderNumber(existing.id);
    await interaction.reply({
      embeds: [errorEmbed(`이미 진행 중인 주문이 있습니다: ${location}\n완료 후 새 견적을 요청해 주세요.`)],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const settings = await getGuildSettings(guild.id);
  const id = await reserveOrderId();
  const now = new Date().toISOString();

  const channel = await guild.channels.create({
    name: `${ORDER_CHANNEL_PREFIX}-${padNumber(id, LIMITS.numberPadWidth)}`,
    type: ChannelType.GuildText,
    parent: settings.channels.orderCategory ?? undefined,
    permissionOverwrites: buildPrivateChannelOverwrites(
      guild,
      member.id,
      interaction.client.user.id,
      settings.roles.staff,
    ),
    topic: `${member.user.tag} 님의 외주 주문 ${formatOrderNumber(id)}`,
  });

  const order: Order = {
    id,
    guildId: guild.id,
    userId: member.id,
    channelId: channel.id,
    service: fields.service,
    budget: fields.budget,
    deadline: fields.deadline,
    details: fields.details,
    status: 'pending',
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };

  const staffMention = settings.roles.staff !== null ? ` <@&${settings.roles.staff}>` : '';
  await channel.send({
    content: `${member}${staffMention}`,
    embeds: [
      buildOrderEmbed(order).setDescription(
        '견적 요청이 접수되었습니다. 담당자가 확인 후 이 채널에서 상담을 진행합니다.',
      ),
    ],
  });

  await addOrder(order);

  await interaction.editReply({
    embeds: [successEmbed(`견적 요청이 접수되었습니다! 상담 채널: ${channel}`)],
  });

  await sendLog(
    guild,
    brandEmbed(COLORS.info)
      .setTitle('💼 새 견적 요청')
      .setDescription(`${member} 님이 주문 ${formatOrderNumber(id)}을(를) 접수했습니다.`)
      .addFields(
        { name: '서비스', value: fields.service, inline: true },
        { name: '예산', value: fields.budget, inline: true },
      ),
  );
}
