import { MessageFlags } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { isChannelSettingKey, isRoleSettingKey } from '../../config/settingsSchema';
import {
  SETTINGS_MENU_VALUE,
  buildAutomodView,
  buildChannelSelectView,
  buildFeaturesView,
  buildMessagesModal,
  buildRoleSelectView,
} from '../../modules/settingsView';
import { getGuildSettings } from '../../storage/settingsStore';
import type { StringSelectHandler } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { isAdmin } from '../../utils/permissions';

export const settingsMenu: StringSelectHandler = {
  prefix: ComponentId.settingsMenu,
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const value = interaction.values[0];
    if (value === undefined) {
      return;
    }

    const settings = await getGuildSettings(interaction.guild.id);

    if (value === SETTINGS_MENU_VALUE.features) {
      await interaction.update(buildFeaturesView(settings));
      return;
    }

    if (value === SETTINGS_MENU_VALUE.automod) {
      await interaction.update(buildAutomodView(settings));
      return;
    }

    if (value === SETTINGS_MENU_VALUE.messages) {
      await interaction.showModal(buildMessagesModal(settings));
      return;
    }

    const [kind, key] = value.split(':');
    if (kind === SETTINGS_MENU_VALUE.channelPrefix && key !== undefined && isChannelSettingKey(key)) {
      await interaction.update(buildChannelSelectView(key));
      return;
    }
    if (kind === SETTINGS_MENU_VALUE.rolePrefix && key !== undefined && isRoleSettingKey(key)) {
      await interaction.update(buildRoleSelectView(key));
      return;
    }

    await interaction.reply({
      embeds: [errorEmbed('알 수 없는 설정 항목입니다.')],
      flags: MessageFlags.Ephemeral,
    });
  },
};
