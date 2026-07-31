import type { UpdateData, UpdateEntry } from '../types';
import { isRecord } from '../utils/guards';
import { JsonStore } from './jsonStore';
import { dataFile } from './paths';

function isUpdateData(value: unknown): value is UpdateData {
  return isRecord(value) && typeof value.counter === 'number' && Array.isArray(value.entries);
}

const store = new JsonStore<UpdateData>(dataFile('updates.json'), () => ({ counter: 0, entries: [] }), isUpdateData);

export async function reserveUpdateId(): Promise<number> {
  return store.update((data) => {
    data.counter += 1;
    return data.counter;
  });
}

export async function addUpdateEntry(entry: UpdateEntry): Promise<void> {
  await store.update((data) => {
    data.entries.push(entry);
  });
}

export async function getLatestUpdateEntry(guildId: string): Promise<UpdateEntry | null> {
  const data = await store.read();
  const guildEntries = data.entries.filter((e) => e.guildId === guildId);
  return guildEntries.at(-1) ?? null;
}
