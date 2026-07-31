import { randomUUID } from 'node:crypto';
import { Events } from 'discord.js';
import { AUTOMOD_RULE_DEFS } from '../config/automodSchema';
import { COLORS } from '../config/constants';
import { detectViolation } from '../modules/automodService';
import { sendLog } from '../modules/logService';
import { getGuildSettings } from '../storage/settingsStore';
import { addWarn } from '../storage/warnStore';
import { defineEvent } from '../types';
import { brandEmbed } from '../utils/embeds';
import { isStaff } from '../utils/permissions';

const NOTICE_AUTO_DELETE_MS = 6_000;

export const messageCreateEvent = defineEvent({
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.inGuild()) {
      return;
    }

    const settings = await getGuildSettings(message.guildId);
    if (isStaff(message.member ?? (await message.guild.members.fetch(message.author.id)), settings)) {
      return;
    }

    const violation = detectViolation(message, settings.automod);
    if (violation === null) {
      return;
    }

    const ruleDef = AUTOMOD_RULE_DEFS[violation];

    await message.delete().catch(() => undefined);

    const notice = await message.channel
      .send({
        embeds: [
          brandEmbed(COLORS.warning)
            .setTitle(`🛡️ ${ruleDef.label} 감지`)
            .setDescription(`${message.author} 님의 메시지가 자동 삭제되었습니다.`),
        ],
      })
      .catch(() => null);
    if (notice !== null) {
      setTimeout(() => {
        void notice.delete().catch(() => undefined);
      }, NOTICE_AUTO_DELETE_MS);
    }

    const total = await addWarn(message.guildId, message.author.id, {
      id: randomUUID(),
      moderatorId: message.client.user.id,
      reason: `[오토모드] ${ruleDef.label}`,
      createdAt: new Date().toISOString(),
    });

    await sendLog(
      message.guild,
      brandEmbed(COLORS.warning)
        .setTitle(`🛡️ 오토모드: ${ruleDef.label}`)
        .setDescription(`${message.author} (${message.author.tag}) 님의 메시지가 삭제되었습니다. (누적 경고 ${total}회)`)
        .addFields(
          { name: '채널', value: `<#${message.channelId}>`, inline: true },
          { name: '규칙', value: ruleDef.description, inline: true },
        ),
    );
  },
});
