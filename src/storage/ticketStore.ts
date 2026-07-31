import type { Ticket, TicketData } from '../types';
import { isRecord } from '../utils/guards';
import { JsonStore } from './jsonStore';
import { dataFile } from './paths';

function isTicketData(value: unknown): value is TicketData {
  return isRecord(value) && typeof value.counter === 'number' && Array.isArray(value.tickets);
}

const store = new JsonStore<TicketData>(dataFile('tickets.json'), () => ({ counter: 0, tickets: [] }), isTicketData);

/** 티켓 번호를 예약한다. 이후 채널 생성이 실패하면 해당 번호는 건너뛴다. */
export async function reserveTicketId(): Promise<number> {
  return store.update((data) => {
    data.counter += 1;
    return data.counter;
  });
}

export async function addTicket(ticket: Ticket): Promise<void> {
  await store.update((data) => {
    data.tickets.push(ticket);
  });
}

export async function getTickets(guildId: string): Promise<readonly Ticket[]> {
  const data = await store.read();
  return data.tickets.filter((t) => t.guildId === guildId);
}

export async function findOpenTicketByUser(guildId: string, userId: string): Promise<Ticket | null> {
  const data = await store.read();
  return (
    data.tickets.find((t) => t.guildId === guildId && t.userId === userId && t.status === 'open') ?? null
  );
}

export async function findTicketByChannel(channelId: string): Promise<Ticket | null> {
  const data = await store.read();
  return data.tickets.find((t) => t.channelId === channelId) ?? null;
}

export async function updateTicketByChannel(
  channelId: string,
  mutate: (ticket: Ticket) => void,
): Promise<Ticket | null> {
  return store.update((data) => {
    const ticket = data.tickets.find((t) => t.channelId === channelId);
    if (ticket === undefined) {
      return null;
    }
    mutate(ticket);
    return ticket;
  });
}
