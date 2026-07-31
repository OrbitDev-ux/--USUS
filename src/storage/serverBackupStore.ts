import type { ServerBackup, ServerBackupData } from '../types';
import { isRecord } from '../utils/guards';
import { JsonStore } from './jsonStore';
import { dataFile } from './paths';

function isServerBackupData(value: unknown): value is ServerBackupData {
  return isRecord(value) && isRecord(value.guilds);
}

const store = new JsonStore<ServerBackupData>(
  dataFile('server-backups.json'),
  () => ({ guilds: {} }),
  isServerBackupData,
);

export async function saveServerBackup(guildId: string, backup: ServerBackup): Promise<void> {
  await store.update((data) => {
    data.guilds[guildId] = backup;
  });
}

export async function getServerBackup(guildId: string): Promise<ServerBackup | null> {
  const data = await store.read();
  return data.guilds[guildId] ?? null;
}
