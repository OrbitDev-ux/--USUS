import type { EmbedBuilder, Guild } from 'discord.js';
import { getGuildSettings } from '../storage/settingsStore';
import { logger } from '../utils/logger';

/** 로그 채널이 설정된 경우에만 전송하며, 실패해도 호출자 흐름을 막지 않는다. */
export async function sendLog(guild: Guild, embed: EmbedBuilder): Promise<void> {
  try {
    const settings = await getGuildSettings(guild.id);
    if (settings.channels.log === null) {
      return;
    }
    const channel = guild.channels.cache.get(settings.channels.log);
    if (channel === undefined || !channel.isTextBased()) {
      return;
    }
    await channel.send({ embeds: [embed] });
  } catch (error) {
    logger.error(`로그 전송 실패 (guild: ${guild.id})`, error);
  }
}
