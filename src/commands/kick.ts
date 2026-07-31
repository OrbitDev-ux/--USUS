import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../config/constants';
import { sendLog } from '../modules/logService';
import type { Command } from '../types';
import { brandEmbed, errorEmbed } from '../utils/embeds';

const OPTION = {
  user: '유저',
  reason: '사유',
} as const;

const MAX_REASON_LENGTH = 300;

export const kickCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('킥')
    .setDescription('멤버를 서버에서 추방합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) => option.setName(OPTION.user).setDescription('추방할 멤버').setRequired(true))
    .addStringOption((option) =>
      option.setName(OPTION.reason).setDescription('추방 사유').setMaxLength(MAX_REASON_LENGTH).setRequired(true),
    ),
  async execute(interaction) {
    const member = interaction.options.getMember(OPTION.user);
    if (member === null) {
      await interaction.reply({
        embeds: [errorEmbed('서버에서 해당 멤버를 찾을 수 없습니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (!member.kickable) {
      await interaction.reply({
        embeds: [errorEmbed('해당 멤버를 추방할 수 없습니다. 봇 역할 순서를 확인해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const reason = interaction.options.getString(OPTION.reason, true).trim();
    const tag = member.user.tag;
    await member.kick(reason);

    await interaction.reply({
      embeds: [
        brandEmbed(COLORS.danger)
          .setTitle('👢 멤버 추방')
          .setDescription(`${tag} 님을 추방했습니다.`)
          .addFields({ name: '사유', value: reason }),
      ],
    });
    await sendLog(
      interaction.guild,
      brandEmbed(COLORS.danger)
        .setTitle('👢 멤버 추방')
        .setDescription(`${interaction.member} → ${tag}`)
        .addFields({ name: '사유', value: reason }),
    );
  },
};
