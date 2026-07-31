import { Events } from 'discord.js';
import { COLORS } from '../config/constants';
import { sendLog } from '../modules/logService';
import { getGuildSettings } from '../storage/settingsStore';
import { defineEvent } from '../types';
import { brandEmbed } from '../utils/embeds';
import { applyTemplate } from '../utils/format';

const MS_PER_SECOND = 1000;

export const guildMemberAddEvent = defineEvent({
  name: Events.GuildMemberAdd,
  async execute(member) {
    const settings = await getGuildSettings(member.guild.id);

    if (settings.features.welcome && settings.channels.welcome !== null) {
      const channel = member.guild.channels.cache.get(settings.channels.welcome);
      if (channel !== undefined && channel.isTextBased()) {
        const content = applyTemplate(settings.messages.welcome, {
          user: member.toString(),
          server: member.guild.name,
          memberCount: String(member.guild.memberCount),
        });
        await channel
          .send({
            embeds: [
              brandEmbed(COLORS.success)
                .setDescription(content)
                .setThumbnail(member.user.displayAvatarURL()),
            ],
          })
          .catch(() => undefined);
      }
    }

    await sendLog(
      member.guild,
      brandEmbed(COLORS.success)
        .setTitle('📥 멤버 입장')
        .setDescription(`${member} (${member.user.tag})`)
        .addFields({
          name: '계정 생성일',
          value: `<t:${Math.floor(member.user.createdTimestamp / MS_PER_SECOND)}:R>`,
        }),
    );
  },
});
