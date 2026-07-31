import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../config/constants';
import { sendLog } from '../modules/logService';
import type { Command } from '../types';
import { brandEmbed, errorEmbed, successEmbed } from '../utils/embeds';

const SUB = {
  add: '부여',
  remove: '해제',
} as const;

const OPTION = {
  user: '유저',
  minutes: '분',
  reason: '사유',
} as const;

const MAX_REASON_LENGTH = 300;
const MIN_MINUTES = 1;
const MAX_MINUTES = 40_320; // 디스코드 최대 타임아웃(28일)
const MS_PER_MINUTE = 60_000;

export const timeoutCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('타임아웃')
    .setDescription('멤버 타임아웃을 관리합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName(SUB.add)
        .setDescription('멤버에게 타임아웃을 부여합니다')
        .addUserOption((option) =>
          option.setName(OPTION.user).setDescription('타임아웃할 멤버').setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName(OPTION.minutes)
            .setDescription('타임아웃 시간(분)')
            .setMinValue(MIN_MINUTES)
            .setMaxValue(MAX_MINUTES)
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName(OPTION.reason)
            .setDescription('사유')
            .setMaxLength(MAX_REASON_LENGTH)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(SUB.remove)
        .setDescription('타임아웃을 해제합니다')
        .addUserOption((option) =>
          option.setName(OPTION.user).setDescription('해제할 멤버').setRequired(true),
        ),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const member = interaction.options.getMember(OPTION.user);
    if (member === null) {
      await interaction.reply({
        embeds: [errorEmbed('서버에서 해당 멤버를 찾을 수 없습니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!member.moderatable) {
      await interaction.reply({
        embeds: [errorEmbed('해당 멤버를 제재할 수 없습니다. 봇 역할 순서를 확인해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === SUB.add) {
      const minutes = interaction.options.getInteger(OPTION.minutes, true);
      const reason = interaction.options.getString(OPTION.reason, true).trim();

      await member.timeout(minutes * MS_PER_MINUTE, reason);
      await interaction.reply({
        embeds: [
          brandEmbed(COLORS.warning)
            .setTitle('⏱️ 타임아웃 부여')
            .setDescription(`${member} 님에게 ${minutes}분 타임아웃을 부여했습니다.`)
            .addFields({ name: '사유', value: reason }),
        ],
      });
      await sendLog(
        interaction.guild,
        brandEmbed(COLORS.warning)
          .setTitle('⏱️ 타임아웃 부여')
          .setDescription(`${interaction.member} → ${member} (${minutes}분)`)
          .addFields({ name: '사유', value: reason }),
      );
      return;
    }

    await member.timeout(null, `${interaction.user.tag}의 타임아웃 해제`);
    await interaction.reply({ embeds: [successEmbed(`${member} 님의 타임아웃을 해제했습니다.`)] });
    await sendLog(
      interaction.guild,
      brandEmbed(COLORS.success)
        .setTitle('⏱️ 타임아웃 해제')
        .setDescription(`${interaction.member} 님이 ${member} 님의 타임아웃을 해제했습니다.`),
    );
  },
};
