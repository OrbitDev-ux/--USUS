import type { MaintenanceData, MaintenanceRecord } from '../types';
import { isRecord } from '../utils/guards';
import { JsonStore } from './jsonStore';
import { dataFile } from './paths';

function isMaintenanceData(value: unknown): value is MaintenanceData {
  return isRecord(value) && typeof value.counter === 'number' && Array.isArray(value.records);
}

const store = new JsonStore<MaintenanceData>(
  dataFile('maintenance.json'),
  () => ({ counter: 0, records: [] }),
  isMaintenanceData,
);

export async function reserveMaintenanceId(): Promise<number> {
  return store.update((data) => {
    data.counter += 1;
    return data.counter;
  });
}

export async function addMaintenanceRecord(record: MaintenanceRecord): Promise<void> {
  await store.update((data) => {
    data.records.push(record);
  });
}

/** 완료로 기록되지 않은 가장 최근 예정/긴급/연장 기록. 없으면 점검 중이 아니다. */
export async function getActiveMaintenance(guildId: string): Promise<MaintenanceRecord | null> {
  const data = await store.read();
  const guildRecords = data.records.filter((r) => r.guildId === guildId);
  const last = guildRecords.at(-1);
  if (last === undefined || last.kind === 'completed') {
    return null;
  }
  return last;
}
