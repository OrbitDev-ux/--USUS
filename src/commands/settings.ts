import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { buildSettingsOverview } from '../modules/settingsView';
import { getGuildSettings } from '../storage/settingsStore';
import type { Command } from '../types';

export const settingsCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('설정')
    .setDescription('봇 설정을 GUI로 관리합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const settings = await getGuildSettings(interaction.guild.id);
    await interaction.reply({
      ...buildSettingsOverview(settings),
      flags: MessageFlags.Ephemeral,
    });
  },
};
