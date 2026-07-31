import { MessageFlags } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { isChannelSettingKey } from '../../config/settingsSchema';
import { buildSettingsOverview } from '../../modules/settingsView';
import { updateGuildSettings } from '../../storage/settingsStore';
import type { ChannelSelectHandler } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { isAdmin } from '../../utils/permissions';

export const settingsChannel: ChannelSelectHandler = {
  prefix: ComponentId.settingsChannel,
  async execute(interaction, args) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const key = args[0];
    const channelId = interaction.values[0];
    if (key === undefined || channelId === undefined || !isChannelSettingKey(key)) {
      await interaction.reply({
        embeds: [errorEmbed('잘못된 설정 요청입니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const updated = await updateGuildSettings(interaction.guild.id, (settings) => {
      settings.channels[key] = channelId;
    });

    await interaction.update(buildSettingsOverview(updated));
  },
};
