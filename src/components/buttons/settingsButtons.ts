import { MessageFlags } from 'discord.js';
import { isAutomodRuleKey } from '../../config/automodSchema';
import { ComponentId } from '../../config/constants';
import { isFeatureKey } from '../../config/settingsSchema';
import { buildAutomodView, buildFeaturesView, buildSettingsOverview } from '../../modules/settingsView';
import { getGuildSettings, updateGuildSettings } from '../../storage/settingsStore';
import type { ButtonHandler } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { isAdmin } from '../../utils/permissions';

export const settingsToggle: ButtonHandler = {
  prefix: ComponentId.settingsToggle,
  async execute(interaction, args) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const key = args[0];
    if (key === undefined || !isFeatureKey(key)) {
      await interaction.reply({
        embeds: [errorEmbed('잘못된 설정 요청입니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const updated = await updateGuildSettings(interaction.guild.id, (settings) => {
      settings.features[key] = !settings.features[key];
    });

    await interaction.update(buildFeaturesView(updated));
  },
};

export const settingsAutomodToggle: ButtonHandler = {
  prefix: ComponentId.settingsAutomodToggle,
  async execute(interaction, args) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const key = args[0];
    if (key === undefined || !isAutomodRuleKey(key)) {
      await interaction.reply({
        embeds: [errorEmbed('잘못된 설정 요청입니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const updated = await updateGuildSettings(interaction.guild.id, (settings) => {
      settings.automod[key] = !settings.automod[key];
    });

    await interaction.update(buildAutomodView(updated));
  },
};

export const settingsBack: ButtonHandler = {
  prefix: ComponentId.settingsBack,
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const settings = await getGuildSettings(interaction.guild.id);
    await interaction.update(buildSettingsOverview(settings));
  },
};
