export type TicketStatus = 'open' | 'closed' | 'deleted';

export interface Ticket {
  id: number;
  guildId: string;
  channelId: string;
  userId: string;
  topic: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  closedAt: string | null;
}

export interface TicketData {
  counter: number;
  tickets: Ticket[];
}
