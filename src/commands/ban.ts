import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../config/constants';
import { sendLog } from '../modules/logService';
import type { Command } from '../types';
import { brandEmbed, errorEmbed, successEmbed } from '../utils/embeds';

const SUB = {
  add: '추가',
  remove: '해제',
} as const;

const OPTION = {
  user: '유저',
  reason: '사유',
  userId: '유저id',
} as const;

const MAX_REASON_LENGTH = 300;

export const banCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('차단')
    .setDescription('멤버 차단을 관리합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addSubcommand((sub) =>
      sub
        .setName(SUB.add)
        .setDescription('멤버를 서버에서 차단합니다')
        .addUserOption((option) =>
          option.setName(OPTION.user).setDescription('차단할 멤버').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName(OPTION.reason)
            .setDescription('차단 사유')
            .setMaxLength(MAX_REASON_LENGTH)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(SUB.remove)
        .setDescription('차단을 해제합니다')
        .addStringOption((option) =>
          option.setName(OPTION.userId).setDescription('차단 해제할 유저 ID').setRequired(true),
        ),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === SUB.add) {
      const user = interaction.options.getUser(OPTION.user, true);
      const reason = interaction.options.getString(OPTION.reason, true).trim();

      if (user.id === interaction.user.id) {
        await interaction.reply({
          embeds: [errorEmbed('자기 자신을 차단할 수 없습니다.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const member = interaction.options.getMember(OPTION.user);
      if (member !== null && !member.bannable) {
        await interaction.reply({
          embeds: [errorEmbed('해당 멤버를 차단할 수 없습니다. 봇 역할 순서를 확인해 주세요.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.guild.members.ban(user, { reason });
      await interaction.reply({
        embeds: [
          brandEmbed(COLORS.danger)
            .setTitle('⛔ 멤버 차단')
            .setDescription(`${user.tag} 님을 차단했습니다.`)
            .addFields({ name: '사유', value: reason }),
        ],
      });
      await sendLog(
        interaction.guild,
        brandEmbed(COLORS.danger)
          .setTitle('⛔ 멤버 차단')
          .setDescription(`${interaction.member} → ${user.tag} (${user.id})`)
          .addFields({ name: '사유', value: reason }),
      );
      return;
    }

    const userId = interaction.options.getString(OPTION.userId, true).trim();
    try {
      await interaction.guild.bans.remove(userId, `${interaction.user.tag}의 차단 해제`);
    } catch {
      await interaction.reply({
        embeds: [errorEmbed('차단 목록에서 해당 유저를 찾을 수 없습니다. 유저 ID를 확인해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({ embeds: [successEmbed(`유저 \`${userId}\`의 차단을 해제했습니다.`)] });
    await sendLog(
      interaction.guild,
      brandEmbed(COLORS.success)
        .setTitle('🔓 차단 해제')
        .setDescription(`${interaction.member} 님이 유저 \`${userId}\`의 차단을 해제했습니다.`),
    );
  },
};
