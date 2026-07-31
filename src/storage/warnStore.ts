import type { Warn, WarnData } from '../types';
import { isRecord } from '../utils/guards';
import { JsonStore } from './jsonStore';
import { dataFile } from './paths';

function isWarnData(value: unknown): value is WarnData {
  return isRecord(value) && isRecord(value.guilds);
}

const store = new JsonStore<WarnData>(dataFile('warns.json'), () => ({ guilds: {} }), isWarnData);

/** 경고를 추가하고 해당 유저의 누적 경고 수를 반환한다. */
export async function addWarn(guildId: string, userId: string, warn: Warn): Promise<number> {
  return store.update((data) => {
    const guildWarns = (data.guilds[guildId] ??= {});
    const userWarns = (guildWarns[userId] ??= []);
    userWarns.push(warn);
    return userWarns.length;
  });
}

export async function getWarns(guildId: string, userId: string): Promise<readonly Warn[]> {
  const data = await store.read();
  return data.guilds[guildId]?.[userId] ?? [];
}

/** 서버 전체에서 지금까지 지급된 경고 총합. */
export async function getTotalWarnCount(guildId: string): Promise<number> {
  const data = await store.read();
  const guildWarns = data.guilds[guildId];
  if (guildWarns === undefined) {
    return 0;
  }
  return Object.values(guildWarns).reduce((sum, warns) => sum + warns.length, 0);
}

/** 경고를 모두 삭제하고 삭제된 개수를 반환한다. */
export async function clearWarns(guildId: string, userId: string): Promise<number> {
  return store.update((data) => {
    const userWarns = data.guilds[guildId]?.[userId];
    if (userWarns === undefined) {
      return 0;
    }
    const removed = userWarns.length;
    delete data.guilds[guildId]?.[userId];
    return removed;
  });
}
