import type { Order, OrderData, OrderStatus } from '../types';
import { isRecord } from '../utils/guards';
import { JsonStore } from './jsonStore';
import { dataFile } from './paths';

const ACTIVE_STATUSES: readonly OrderStatus[] = ['pending', 'quoted', 'in_progress', 'review'];

function isOrderData(value: unknown): value is OrderData {
  return isRecord(value) && typeof value.counter === 'number' && Array.isArray(value.orders);
}

const store = new JsonStore<OrderData>(dataFile('orders.json'), () => ({ counter: 0, orders: [] }), isOrderData);

/** 주문 번호를 예약한다. 이후 채널 생성이 실패하면 해당 번호는 건너뛴다. */
export async function reserveOrderId(): Promise<number> {
  return store.update((data) => {
    data.counter += 1;
    return data.counter;
  });
}

export async function addOrder(order: Order): Promise<void> {
  await store.update((data) => {
    data.orders.push(order);
  });
}

export async function findActiveOrderByUser(guildId: string, userId: string): Promise<Order | null> {
  const data = await store.read();
  return (
    data.orders.find(
      (o) => o.guildId === guildId && o.userId === userId && ACTIVE_STATUSES.includes(o.status),
    ) ?? null
  );
}

export async function getOrders(guildId: string): Promise<readonly Order[]> {
  const data = await store.read();
  return data.orders.filter((o) => o.guildId === guildId);
}

export async function findOrderById(guildId: string, orderId: number): Promise<Order | null> {
  const data = await store.read();
  return data.orders.find((o) => o.guildId === guildId && o.id === orderId) ?? null;
}

export async function updateOrderById(
  guildId: string,
  orderId: number,
  mutate: (order: Order) => void,
): Promise<Order | null> {
  return store.update((data) => {
    const order = data.orders.find((o) => o.guildId === guildId && o.id === orderId);
    if (order === undefined) {
      return null;
    }
    mutate(order);
    order.updatedAt = new Date().toISOString();
    return order;
  });
}
