import { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { findOrderById } from '../../storage/orderStore';
import { hasReviewForOrder } from '../../storage/reviewStore';
import type { ButtonHandler } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { withArgs } from '../../utils/ids';

export const REVIEW_MODAL_FIELD = {
  rating: 'rating',
  content: 'content',
} as const;

const MAX_CONTENT_LENGTH = 500;

export const reviewCreate: ButtonHandler = {
  prefix: ComponentId.reviewCreate,
  async execute(interaction, args) {
    const orderId = Number(args[0]);
    if (!Number.isInteger(orderId)) {
      await interaction.reply({ embeds: [errorEmbed('잘못된 주문 번호입니다.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const order = await findOrderById(interaction.guild.id, orderId);
    if (order === null) {
      await interaction.reply({ embeds: [errorEmbed('주문을 찾을 수 없습니다.')], flags: MessageFlags.Ephemeral });
      return;
    }
    if (order.userId !== interaction.user.id) {
      await interaction.reply({
        embeds: [errorEmbed('본인이 의뢰한 주문에만 후기를 작성할 수 있습니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (await hasReviewForOrder(interaction.guild.id, orderId)) {
      await interaction.reply({
        embeds: [errorEmbed('이미 이 주문에 대한 후기를 작성했습니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(withArgs(ComponentId.reviewModal, orderId))
      .setTitle('후기 작성')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(REVIEW_MODAL_FIELD.rating)
            .setLabel('평점 (1~5 숫자로 입력)')
            .setPlaceholder('5')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(1)
            .setRequired(true),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(REVIEW_MODAL_FIELD.content)
            .setLabel('후기 내용')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(MAX_CONTENT_LENGTH)
            .setRequired(true),
        ),
      );

    await interaction.showModal(modal);
  },
};
