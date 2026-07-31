import { MessageFlags } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { isRoleSettingKey } from '../../config/settingsSchema';
import { buildSettingsOverview } from '../../modules/settingsView';
import { updateGuildSettings } from '../../storage/settingsStore';
import type { RoleSelectHandler } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { isAdmin } from '../../utils/permissions';

export const settingsRole: RoleSelectHandler = {
  prefix: ComponentId.settingsRole,
  async execute(interaction, args) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const key = args[0];
    const roleId = interaction.values[0];
    if (key === undefined || roleId === undefined || !isRoleSettingKey(key)) {
      await interaction.reply({
        embeds: [errorEmbed('잘못된 설정 요청입니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const updated = await updateGuildSettings(interaction.guild.id, (settings) => {
      settings.roles[key] = roleId;
    });

    await interaction.update(buildSettingsOverview(updated));
  },
};
