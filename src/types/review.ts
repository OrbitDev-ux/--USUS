export interface Review {
  id: number;
  guildId: string;
  orderId: number;
  userId: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface ReviewData {
  counter: number;
  reviews: Review[];
}
