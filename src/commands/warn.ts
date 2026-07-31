import { randomUUID } from 'node:crypto';
import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { COLORS, LIMITS } from '../config/constants';
import { sendLog } from '../modules/logService';
import { addWarn, clearWarns, getWarns } from '../storage/warnStore';
import type { Command } from '../types';
import { brandEmbed, errorEmbed, successEmbed } from '../utils/embeds';

const SUB = {
  add: '지급',
  list: '목록',
  clear: '초기화',
} as const;

const OPTION = {
  user: '유저',
  reason: '사유',
} as const;

const MAX_REASON_LENGTH = 300;

function toRelativeTimestamp(iso: string): string {
  return `<t:${Math.floor(Date.parse(iso) / 1000)}:R>`;
}

export const warnCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('경고')
    .setDescription('멤버 경고를 관리합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName(SUB.add)
        .setDescription('멤버에게 경고를 지급합니다')
        .addUserOption((option) =>
          option.setName(OPTION.user).setDescription('경고를 받을 멤버').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName(OPTION.reason)
            .setDescription('경고 사유')
            .setMaxLength(MAX_REASON_LENGTH)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(SUB.list)
        .setDescription('멤버의 경고 목록을 확인합니다')
        .addUserOption((option) =>
          option.setName(OPTION.user).setDescription('확인할 멤버').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(SUB.clear)
        .setDescription('멤버의 경고를 모두 초기화합니다')
        .addUserOption((option) =>
          option.setName(OPTION.user).setDescription('초기화할 멤버').setRequired(true),
        ),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser(OPTION.user, true);

    if (sub === SUB.add) {
      if (user.bot) {
        await interaction.reply({
          embeds: [errorEmbed('봇에게는 경고를 지급할 수 없습니다.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      if (user.id === interaction.user.id) {
        await interaction.reply({
          embeds: [errorEmbed('자기 자신에게는 경고를 지급할 수 없습니다.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const reason = interaction.options.getString(OPTION.reason, true).trim();
      const total = await addWarn(interaction.guild.id, user.id, {
        id: randomUUID(),
        moderatorId: interaction.user.id,
        reason,
        createdAt: new Date().toISOString(),
      });

      await interaction.reply({
        embeds: [
          brandEmbed(COLORS.warning)
            .setTitle('⚠️ 경고 지급')
            .setDescription(`${user} 님에게 경고를 지급했습니다. (누적 **${total}회**)`)
            .addFields({ name: '사유', value: reason }),
        ],
      });

      await user
        .send({
          embeds: [
            brandEmbed(COLORS.warning)
              .setTitle('⚠️ 경고 안내')
              .setDescription(`**${interaction.guild.name}** 서버에서 경고를 받았습니다. (누적 ${total}회)`)
              .addFields({ name: '사유', value: reason }),
          ],
        })
        .catch(() => undefined);

      await sendLog(
        interaction.guild,
        brandEmbed(COLORS.warning)
          .setTitle('⚠️ 경고 지급')
          .setDescription(`${interaction.member} → ${user} (누적 ${total}회)`)
          .addFields({ name: '사유', value: reason }),
      );
      return;
    }

    if (sub === SUB.list) {
      const warns = await getWarns(interaction.guild.id, user.id);
      if (warns.length === 0) {
        await interaction.reply({
          embeds: [successEmbed(`${user} 님은 경고가 없습니다.`)],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const recent = warns.slice(-LIMITS.warnListDisplay);
      const lines = recent.map(
        (warn, index) =>
          `**${index + 1}.** ${warn.reason} — <@${warn.moderatorId}>, ${toRelativeTimestamp(warn.createdAt)}`,
      );
      await interaction.reply({
        embeds: [
          brandEmbed(COLORS.warning)
            .setTitle(`⚠️ ${user.username} 님의 경고 (총 ${warns.length}회)`)
            .setDescription(lines.join('\n')),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const removed = await clearWarns(interaction.guild.id, user.id);
    await interaction.reply({
      embeds: [successEmbed(`${user} 님의 경고 ${removed}건을 초기화했습니다.`)],
    });
    await sendLog(
      interaction.guild,
      brandEmbed(COLORS.info)
        .setTitle('🧹 경고 초기화')
        .setDescription(`${interaction.member} 님이 ${user} 님의 경고 ${removed}건을 초기화했습니다.`),
    );
  },
};
