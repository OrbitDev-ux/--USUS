import { Events } from 'discord.js';
import { COLORS } from '../config/constants';
import { sendLog } from '../modules/logService';
import { getGuildSettings } from '../storage/settingsStore';
import { defineEvent } from '../types';
import { brandEmbed } from '../utils/embeds';
import { describeMessageContent } from './messageDelete';

export const messageUpdateEvent = defineEvent({
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (newMessage.guild === null) {
      return;
    }
    if (newMessage.author?.bot === true) {
      return;
    }
    if (oldMessage.content === newMessage.content) {
      return;
    }

    const settings = await getGuildSettings(newMessage.guild.id);
    if (!settings.features.messageLogs) {
      return;
    }
    if (newMessage.channelId === settings.channels.log) {
      return;
    }

    await sendLog(
      newMessage.guild,
      brandEmbed(COLORS.warning)
        .setTitle('✏️ 메시지 수정')
        .addFields(
          { name: '채널', value: `<#${newMessage.channelId}>`, inline: true },
          {
            name: '작성자',
            value:
              newMessage.author !== null
                ? `${newMessage.author} (${newMessage.author.tag})`
                : '`(알 수 없음)`',
            inline: true,
          },
          { name: '수정 전', value: describeMessageContent(oldMessage.content) },
          { name: '수정 후', value: describeMessageContent(newMessage.content) },
          { name: '바로가기', value: `[메시지로 이동](${newMessage.url})` },
        ),
    );
  },
});
