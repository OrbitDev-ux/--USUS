export type OrderStatus = 'pending' | 'quoted' | 'in_progress' | 'review' | 'done' | 'cancelled';

export interface Order {
  id: number;
  guildId: string;
  userId: string;
  channelId: string | null;
  service: string;
  budget: string;
  deadline: string;
  details: string;
  status: OrderStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderData {
  counter: number;
  orders: Order[];
}
