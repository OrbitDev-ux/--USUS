import type { Review, ReviewData } from '../types';
import { isRecord } from '../utils/guards';
import { JsonStore } from './jsonStore';
import { dataFile } from './paths';

function isReviewData(value: unknown): value is ReviewData {
  return isRecord(value) && typeof value.counter === 'number' && Array.isArray(value.reviews);
}

const store = new JsonStore<ReviewData>(dataFile('reviews.json'), () => ({ counter: 0, reviews: [] }), isReviewData);

export async function reserveReviewId(): Promise<number> {
  return store.update((data) => {
    data.counter += 1;
    return data.counter;
  });
}

export async function addReview(review: Review): Promise<void> {
  await store.update((data) => {
    data.reviews.push(review);
  });
}

export async function hasReviewForOrder(guildId: string, orderId: number): Promise<boolean> {
  const data = await store.read();
  return data.reviews.some((r) => r.guildId === guildId && r.orderId === orderId);
}

export async function getReviews(guildId: string): Promise<readonly Review[]> {
  const data = await store.read();
  return data.reviews.filter((r) => r.guildId === guildId);
}
