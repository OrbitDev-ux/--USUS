import { Events } from 'discord.js';
import { COLORS } from '../config/constants';
import { sendLog } from '../modules/logService';
import { getGuildSettings } from '../storage/settingsStore';
import { defineEvent } from '../types';
import { brandEmbed } from '../utils/embeds';

const MAX_LOGGED_CONTENT_LENGTH = 1000;

export function describeMessageContent(content: string | null): string {
  if (content === null) {
    return '`(캐시되지 않은 메시지)`';
  }
  if (content === '') {
    return '`(내용 없음)`';
  }
  return content.slice(0, MAX_LOGGED_CONTENT_LENGTH);
}

export const messageDeleteEvent = defineEvent({
  name: Events.MessageDelete,
  async execute(message) {
    if (message.guild === null) {
      return;
    }
    if (message.author?.bot === true) {
      return;
    }

    const settings = await getGuildSettings(message.guild.id);
    if (!settings.features.messageLogs) {
      return;
    }
    if (message.channelId === settings.channels.log) {
      return;
    }

    await sendLog(
      message.guild,
      brandEmbed(COLORS.danger)
        .setTitle('🗑️ 메시지 삭제')
        .addFields(
          { name: '채널', value: `<#${message.channelId}>`, inline: true },
          {
            name: '작성자',
            value: message.author !== null ? `${message.author} (${message.author.tag})` : '`(알 수 없음)`',
            inline: true,
          },
          { name: '내용', value: describeMessageContent(message.content) },
        ),
    );
  },
});
