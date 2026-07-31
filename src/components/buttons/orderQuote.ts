import { ComponentId } from '../../config/constants';
import type { ButtonHandler } from '../../types';
import { buildOrderQuoteModal } from '../modals/orderQuoteModal';

export const orderQuote: ButtonHandler = {
  prefix: ComponentId.orderQuote,
  async execute(interaction) {
    await interaction.showModal(buildOrderQuoteModal());
  },
};
