import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type MessageActionRowComponentBuilder } from 'discord.js';
import { COLORS, ComponentId, LIMITS } from '../config/constants';
import type { Review } from '../types';
import { brandEmbed } from '../utils/embeds';
import { padNumber } from '../utils/format';
import { withArgs } from '../utils/ids';

const MAX_STARS = 5;

export function renderStars(rating: number): string {
  const filled = Math.max(0, Math.min(MAX_STARS, Math.round(rating)));
  return '⭐'.repeat(filled) + '☆'.repeat(MAX_STARS - filled);
}

export function buildReviewRequestRow(orderId: number): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(withArgs(ComponentId.reviewCreate, orderId))
      .setLabel('후기 작성')
      .setEmoji('⭐')
      .setStyle(ButtonStyle.Primary),
  );
}

export function buildReviewEmbed(review: Review) {
  return brandEmbed(COLORS.warning)
    .setTitle(`⭐ 고객 후기 (주문 #${padNumber(review.orderId, LIMITS.numberPadWidth)})`)
    .addFields(
      { name: '작성자', value: `<@${review.userId}>`, inline: true },
      { name: '평점', value: renderStars(review.rating), inline: true },
      { name: '내용', value: review.content },
    );
}
