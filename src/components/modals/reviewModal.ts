import { MessageFlags } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { REVIEW_MODAL_FIELD } from '../buttons/reviewButtons';
import { buildReviewEmbed } from '../../modules/reviewService';
import { findOrderById } from '../../storage/orderStore';
import { addReview, hasReviewForOrder, reserveReviewId } from '../../storage/reviewStore';
import { getGuildSettings } from '../../storage/settingsStore';
import type { ModalHandler } from '../../types';
import { errorEmbed, successEmbed } from '../../utils/embeds';

const MIN_RATING = 1;
const MAX_RATING = 5;

export const reviewModal: ModalHandler = {
  prefix: ComponentId.reviewModal,
  async execute(interaction, args) {
    const orderId = Number(args[0]);
    if (!Number.isInteger(orderId)) {
      await interaction.reply({ embeds: [errorEmbed('잘못된 주문 번호입니다.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const order = await findOrderById(interaction.guild.id, orderId);
    if (order === null || order.userId !== interaction.user.id) {
      await interaction.reply({
        embeds: [errorEmbed('후기를 작성할 수 없는 주문입니다.')],
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

    const ratingInput = interaction.fields.getTextInputValue(REVIEW_MODAL_FIELD.rating).trim();
    const rating = Number(ratingInput);
    if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
      await interaction.reply({
        embeds: [errorEmbed('평점은 1~5 사이의 숫자로 입력해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const settings = await getGuildSettings(interaction.guild.id);
    const content = interaction.fields.getTextInputValue(REVIEW_MODAL_FIELD.content).trim();

    const id = await reserveReviewId();
    const review = {
      id,
      guildId: interaction.guild.id,
      orderId,
      userId: interaction.user.id,
      rating,
      content,
      createdAt: new Date().toISOString(),
    };
    await addReview(review);

    if (settings.channels.review !== null) {
      const channel = interaction.guild.channels.cache.get(settings.channels.review);
      if (channel !== undefined && channel.isTextBased()) {
        await channel.send({ embeds: [buildReviewEmbed(review)] }).catch(() => undefined);
      }
    }

    await interaction.reply({
      embeds: [successEmbed('소중한 후기 감사합니다! 🙏')],
      flags: MessageFlags.Ephemeral,
    });
  },
};
