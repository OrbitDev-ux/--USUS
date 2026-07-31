import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { ComponentId } from '../../config/constants';
import { createTicket } from '../../modules/ticketService';
import type { ModalHandler } from '../../types';

const FIELD = {
  topic: 'topic',
  description: 'description',
} as const;

const MAX_TOPIC_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;

export function buildTicketCreateModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(ComponentId.ticketCreateModal)
    .setTitle('티켓 열기')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(FIELD.topic)
          .setLabel('문의 주제')
          .setPlaceholder('예: 결제 문의, 버그 제보')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(MAX_TOPIC_LENGTH)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(FIELD.description)
          .setLabel('문의 내용')
          .setPlaceholder('문의 내용을 자세히 적어 주세요.')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(MAX_DESCRIPTION_LENGTH)
          .setRequired(true),
      ),
    );
}

export const ticketCreateModal: ModalHandler = {
  prefix: ComponentId.ticketCreateModal,
  async execute(interaction) {
    const topic = interaction.fields.getTextInputValue(FIELD.topic).trim();
    const description = interaction.fields.getTextInputValue(FIELD.description).trim();
    await createTicket(interaction, topic, description);
  },
};
