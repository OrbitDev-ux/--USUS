import 'dotenv/config';

export interface BotEnv {
  readonly token: string;
  readonly clientId: string;
  readonly guildId: string | null;
}

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (value === undefined || value === '') {
    throw new Error(`환경 변수 ${key}가 설정되지 않았습니다. .env 파일을 확인해 주세요. (.env.example 참고)`);
  }
  return value;
}

function optionalEnv(key: string): string | null {
  const value = process.env[key]?.trim();
  return value === undefined || value === '' ? null : value;
}

let cached: BotEnv | null = null;

export function getEnv(): BotEnv {
  cached ??= {
    token: requireEnv('DISCORD_TOKEN'),
    clientId: requireEnv('DISCORD_CLIENT_ID'),
    guildId: optionalEnv('DISCORD_GUILD_ID'),
  };
  return cached;
}
