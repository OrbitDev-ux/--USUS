import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { ComponentId } from '../../config/constants';
import { createOrder } from '../../modules/orderService';
import type { ModalHandler } from '../../types';

const FIELD = {
  service: 'service',
  budget: 'budget',
  deadline: 'deadline',
  details: 'details',
} as const;

const MAX_SHORT_LENGTH = 100;
const MAX_DETAILS_LENGTH = 1000;

export function buildOrderQuoteModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(ComponentId.orderQuoteModal)
    .setTitle('외주 견적 요청')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(FIELD.service)
          .setLabel('의뢰할 서비스')
          .setPlaceholder('예: 디스코드 봇, 웹사이트, 서버 세팅')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(MAX_SHORT_LENGTH)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(FIELD.budget)
          .setLabel('예산')
          .setPlaceholder('예: 10만원 ~ 30만원, 협의 가능')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(MAX_SHORT_LENGTH)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(FIELD.deadline)
          .setLabel('희망 마감일')
          .setPlaceholder('예: 2주 이내, 협의 가능')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(MAX_SHORT_LENGTH)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(FIELD.details)
          .setLabel('상세 내용')
          .setPlaceholder('필요한 기능, 참고 자료 등을 자세히 적어 주세요.')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(MAX_DETAILS_LENGTH)
          .setRequired(true),
      ),
    );
}

export const orderQuoteModal: ModalHandler = {
  prefix: ComponentId.orderQuoteModal,
  async execute(interaction) {
    await createOrder(interaction, {
      service: interaction.fields.getTextInputValue(FIELD.service).trim(),
      budget: interaction.fields.getTextInputValue(FIELD.budget).trim(),
      deadline: interaction.fields.getTextInputValue(FIELD.deadline).trim(),
      details: interaction.fields.getTextInputValue(FIELD.details).trim(),
    });
  },
};
