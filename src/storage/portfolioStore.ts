import type { PortfolioData, PortfolioEntry } from '../types';
import { isRecord } from '../utils/guards';
import { JsonStore } from './jsonStore';
import { dataFile } from './paths';

function isPortfolioData(value: unknown): value is PortfolioData {
  return isRecord(value) && typeof value.counter === 'number' && Array.isArray(value.entries);
}

const store = new JsonStore<PortfolioData>(
  dataFile('portfolio.json'),
  () => ({ counter: 0, entries: [] }),
  isPortfolioData,
);

export async function reservePortfolioId(): Promise<number> {
  return store.update((data) => {
    data.counter += 1;
    return data.counter;
  });
}

export async function addPortfolioEntry(entry: PortfolioEntry): Promise<void> {
  await store.update((data) => {
    data.entries.push(entry);
  });
}

export async function getPortfolioEntries(guildId: string): Promise<readonly PortfolioEntry[]> {
  const data = await store.read();
  return data.entries.filter((e) => e.guildId === guildId);
}

export async function removePortfolioEntry(guildId: string, id: number): Promise<boolean> {
  return store.update((data) => {
    const index = data.entries.findIndex((e) => e.guildId === guildId && e.id === id);
    if (index === -1) {
      return false;
    }
    data.entries.splice(index, 1);
    return true;
  });
}
