import { AUTOMOD_RULE_KEYS } from '../config/automodSchema';
import type { GuildSettings, SettingsData } from '../types';
import { isRecord } from '../utils/guards';
import { JsonStore } from './jsonStore';
import { dataFile } from './paths';

const DEFAULT_WELCOME_MESSAGE = '{user}님, **{server}**에 오신 것을 환영합니다! 🎉 (현재 {memberCount}명)';
const DEFAULT_FAREWELL_MESSAGE = '{user}님이 서버를 떠났습니다. 👋';

export function createDefaultGuildSettings(): GuildSettings {
  return {
    channels: {
      welcome: null,
      log: null,
      announcement: null,
      ticketCategory: null,
      orderCategory: null,
      update: null,
      maintenance: null,
      report: null,
      review: null,
      portfolio: null,
    },
    roles: {
      staff: null,
      verified: null,
    },
    features: {
      welcome: true,
      farewell: true,
      messageLogs: true,
    },
    automod: Object.fromEntries(AUTOMOD_RULE_KEYS.map((key) => [key, false])) as GuildSettings['automod'],
    messages: {
      welcome: DEFAULT_WELCOME_MESSAGE,
      farewell: DEFAULT_FAREWELL_MESSAGE,
    },
  };
}

function isSettingsData(value: unknown): value is SettingsData {
  return isRecord(value) && isRecord(value.guilds);
}

/** 저장된 값에 누락된 필드가 있어도 항상 완전한 형태로 돌려준다. */
function normalizeGuildSettings(stored: GuildSettings | undefined): GuildSettings {
  const defaults = createDefaultGuildSettings();
  if (stored === undefined) {
    return defaults;
  }
  return {
    channels: { ...defaults.channels, ...stored.channels },
    roles: { ...defaults.roles, ...stored.roles },
    features: { ...defaults.features, ...stored.features },
    automod: { ...defaults.automod, ...stored.automod },
    messages: { ...defaults.messages, ...stored.messages },
  };
}

const store = new JsonStore<SettingsData>(dataFile('settings.json'), () => ({ guilds: {} }), isSettingsData);

export async function getGuildSettings(guildId: string): Promise<GuildSettings> {
  const data = await store.read();
  return normalizeGuildSettings(data.guilds[guildId]);
}

export async function updateGuildSettings(
  guildId: string,
  mutate: (settings: GuildSettings) => void,
): Promise<GuildSettings> {
  return store.update((data) => {
    const settings = normalizeGuildSettings(data.guilds[guildId]);
    mutate(settings);
    data.guilds[guildId] = settings;
    return settings;
  });
}
