import { Events } from 'discord.js';
import { COLORS } from '../config/constants';
import { sendLog } from '../modules/logService';
import { getGuildSettings } from '../storage/settingsStore';
import { defineEvent } from '../types';
import { brandEmbed } from '../utils/embeds';
import { applyTemplate } from '../utils/format';

export const guildMemberRemoveEvent = defineEvent({
  name: Events.GuildMemberRemove,
  async execute(member) {
    const settings = await getGuildSettings(member.guild.id);

    if (settings.features.farewell && settings.channels.welcome !== null) {
      const channel = member.guild.channels.cache.get(settings.channels.welcome);
      if (channel !== undefined && channel.isTextBased()) {
        const content = applyTemplate(settings.messages.farewell, {
          user: member.user.username,
          server: member.guild.name,
          memberCount: String(member.guild.memberCount),
        });
        await channel
          .send({ embeds: [brandEmbed(COLORS.neutral).setDescription(content)] })
          .catch(() => undefined);
      }
    }

    await sendLog(
      member.guild,
      brandEmbed(COLORS.neutral).setTitle('📤 멤버 퇴장').setDescription(`${member.user.tag} (${member.id})`),
    );
  },
});
