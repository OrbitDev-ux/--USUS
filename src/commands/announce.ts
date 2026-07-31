import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { buildAnnounceModal } from '../components/modals/announceModal';
import { getGuildSettings } from '../storage/settingsStore';
import type { Command } from '../types';
import { errorEmbed } from '../utils/embeds';

export const announceCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('공지')
    .setDescription('공지 채널에 임베드 공지를 작성합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const settings = await getGuildSettings(interaction.guild.id);
    if (settings.channels.announcement === null) {
      await interaction.reply({
        embeds: [errorEmbed('공지 채널이 설정되지 않았습니다. `/설정`에서 먼저 설정해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.showModal(buildAnnounceModal());
  },
};
