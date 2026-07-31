import { ComponentId } from '../../config/constants';
import { closeTicket, deleteTicket } from '../../modules/ticketService';
import type { ButtonHandler } from '../../types';
import { buildTicketCreateModal } from '../modals/ticketCreateModal';

export const ticketCreate: ButtonHandler = {
  prefix: ComponentId.ticketCreate,
  async execute(interaction) {
    await interaction.showModal(buildTicketCreateModal());
  },
};

export const ticketClose: ButtonHandler = {
  prefix: ComponentId.ticketClose,
  async execute(interaction) {
    await closeTicket(interaction);
  },
};

export const ticketDelete: ButtonHandler = {
  prefix: ComponentId.ticketDelete,
  async execute(interaction) {
    await deleteTicket(interaction);
  },
};
