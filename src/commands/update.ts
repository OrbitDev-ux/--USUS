import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { buildUpdateModal } from '../components/modals/updateModal';
import { setPendingUpdateVersion } from '../modules/pendingUpdateVersion';
import { getGuildSettings } from '../storage/settingsStore';
import type { Command } from '../types';
import { errorEmbed } from '../utils/embeds';

const OPTION = {
  version: '버전',
} as const;

const MAX_VERSION_LENGTH = 30;

export const updateCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('업데이트')
    .setDescription('업데이트 채널에 릴리즈 노트를 작성합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option
        .setName(OPTION.version)
        .setDescription('버전 정보 (예: v1.2.0)')
        .setMaxLength(MAX_VERSION_LENGTH)
        .setRequired(true),
    ),
  async execute(interaction) {
    const settings = await getGuildSettings(interaction.guild.id);
    if (settings.channels.update === null) {
      await interaction.reply({
        embeds: [errorEmbed('업데이트 채널이 설정되지 않았습니다. `/설정`에서 먼저 설정해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const version = interaction.options.getString(OPTION.version, true).trim();
    setPendingUpdateVersion(interaction.user.id, version);
    await interaction.showModal(buildUpdateModal());
  },
};
