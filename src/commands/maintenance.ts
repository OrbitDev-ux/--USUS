import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { buildMaintenanceEmbed } from '../modules/maintenanceService';
import { addMaintenanceRecord, getActiveMaintenance, reserveMaintenanceId } from '../storage/maintenanceStore';
import { getGuildSettings } from '../storage/settingsStore';
import type { Command, MaintenanceKind } from '../types';
import { errorEmbed, successEmbed } from '../utils/embeds';

const SUB = {
  scheduled: '예정',
  emergency: '긴급',
  completed: '완료',
  extended: '연장',
} as const;

const SUB_TO_KIND: Record<string, MaintenanceKind> = {
  [SUB.scheduled]: 'scheduled',
  [SUB.emergency]: 'emergency',
  [SUB.completed]: 'completed',
  [SUB.extended]: 'extended',
};

const OPTION = {
  reason: '사유',
  expectedEnd: '예상종료',
} as const;

const MAX_REASON_LENGTH = 500;
const MAX_EXPECTED_END_LENGTH = 100;

export const maintenanceCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('점검')
    .setDescription('서버 점검을 안내합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName(SUB.scheduled)
        .setDescription('예정된 점검을 안내합니다')
        .addStringOption((option) =>
          option.setName(OPTION.reason).setDescription('점검 사유').setMaxLength(MAX_REASON_LENGTH).setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName(OPTION.expectedEnd)
            .setDescription('예상 종료 시각 (예: 2026-08-01 03:00 KST)')
            .setMaxLength(MAX_EXPECTED_END_LENGTH)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(SUB.emergency)
        .setDescription('긴급 점검을 안내합니다')
        .addStringOption((option) =>
          option.setName(OPTION.reason).setDescription('점검 사유').setMaxLength(MAX_REASON_LENGTH).setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName(OPTION.expectedEnd)
            .setDescription('예상 종료 시각')
            .setMaxLength(MAX_EXPECTED_END_LENGTH)
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(SUB.extended)
        .setDescription('진행 중인 점검의 연장을 안내합니다')
        .addStringOption((option) =>
          option.setName(OPTION.reason).setDescription('연장 사유').setMaxLength(MAX_REASON_LENGTH).setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName(OPTION.expectedEnd)
            .setDescription('새 예상 종료 시각')
            .setMaxLength(MAX_EXPECTED_END_LENGTH)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(SUB.completed)
        .setDescription('점검 완료를 안내합니다')
        .addStringOption((option) =>
          option
            .setName(OPTION.reason)
            .setDescription('완료 안내 메시지')
            .setMaxLength(MAX_REASON_LENGTH)
            .setRequired(true),
        ),
    ),
  async execute(interaction) {
    const settings = await getGuildSettings(interaction.guild.id);
    if (settings.channels.maintenance === null) {
      await interaction.reply({
        embeds: [errorEmbed('점검 채널이 설정되지 않았습니다. `/설정`에서 먼저 설정해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const channel = interaction.guild.channels.cache.get(settings.channels.maintenance);
    if (channel === undefined || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [errorEmbed('점검 채널을 찾을 수 없습니다. `/설정`에서 다시 설정해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const subName = interaction.options.getSubcommand();
    const kind = SUB_TO_KIND[subName];
    if (kind === undefined) {
      await interaction.reply({ embeds: [errorEmbed('알 수 없는 하위 명령어입니다.')], flags: MessageFlags.Ephemeral });
      return;
    }

    if ((kind === 'extended' || kind === 'completed') && (await getActiveMaintenance(interaction.guild.id)) === null) {
      await interaction.reply({
        embeds: [errorEmbed('현재 진행 중인 점검이 없습니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const reason = interaction.options.getString(OPTION.reason, true).trim();
    const expectedEnd = interaction.options.getString(OPTION.expectedEnd)?.trim() ?? null;

    const id = await reserveMaintenanceId();
    const record = {
      id,
      guildId: interaction.guild.id,
      kind,
      reason,
      expectedEnd: kind === 'completed' ? null : expectedEnd,
      authorId: interaction.user.id,
      createdAt: new Date().toISOString(),
    };
    await addMaintenanceRecord(record);

    await channel.send({ embeds: [buildMaintenanceEmbed(record)] });
    await interaction.reply({
      embeds: [successEmbed(`점검 안내가 ${channel}에 게시되었습니다.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
