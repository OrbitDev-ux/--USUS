import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../config/constants';
import { buildPortfolioEmbed } from '../modules/portfolioService';
import {
  addPortfolioEntry,
  getPortfolioEntries,
  removePortfolioEntry,
  reservePortfolioId,
} from '../storage/portfolioStore';
import { getGuildSettings } from '../storage/settingsStore';
import type { Command } from '../types';
import { brandEmbed, errorEmbed, successEmbed } from '../utils/embeds';
import { isValidHttpUrl } from '../utils/url';

const SUB = {
  add: '추가',
  list: '목록',
  remove: '삭제',
} as const;

const OPTION = {
  title: '제목',
  description: '설명',
  imageUrl: '이미지',
  link: '링크',
  id: '번호',
} as const;

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_URL_LENGTH = 500;
const MIN_ID = 1;

export const portfolioCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('포트폴리오')
    .setDescription('포트폴리오를 관리합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName(SUB.add)
        .setDescription('포트폴리오 항목을 추가하고 게시합니다')
        .addStringOption((option) =>
          option.setName(OPTION.title).setDescription('제목').setMaxLength(MAX_TITLE_LENGTH).setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName(OPTION.description)
            .setDescription('설명')
            .setMaxLength(MAX_DESCRIPTION_LENGTH)
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName(OPTION.imageUrl).setDescription('이미지 URL').setMaxLength(MAX_URL_LENGTH),
        )
        .addStringOption((option) =>
          option.setName(OPTION.link).setDescription('관련 링크 URL').setMaxLength(MAX_URL_LENGTH),
        ),
    )
    .addSubcommand((sub) => sub.setName(SUB.list).setDescription('포트폴리오 목록을 확인합니다'))
    .addSubcommand((sub) =>
      sub
        .setName(SUB.remove)
        .setDescription('포트폴리오 항목을 삭제합니다')
        .addIntegerOption((option) =>
          option.setName(OPTION.id).setDescription('항목 번호').setMinValue(MIN_ID).setRequired(true),
        ),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === SUB.list) {
      const entries = await getPortfolioEntries(interaction.guild.id);
      if (entries.length === 0) {
        await interaction.reply({ embeds: [successEmbed('등록된 포트폴리오가 없습니다.')], flags: MessageFlags.Ephemeral });
        return;
      }
      const lines = entries.map((entry) => `**#${entry.id}** ${entry.title}`);
      await interaction.reply({
        embeds: [brandEmbed(COLORS.info).setTitle('💼 포트폴리오 목록').setDescription(lines.join('\n'))],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === SUB.remove) {
      const id = interaction.options.getInteger(OPTION.id, true);
      const removed = await removePortfolioEntry(interaction.guild.id, id);
      if (!removed) {
        await interaction.reply({ embeds: [errorEmbed(`#${id} 항목을 찾을 수 없습니다.`)], flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply({ embeds: [successEmbed(`포트폴리오 #${id}을(를) 삭제했습니다.`)], flags: MessageFlags.Ephemeral });
      return;
    }

    const settings = await getGuildSettings(interaction.guild.id);
    if (settings.channels.portfolio === null) {
      await interaction.reply({
        embeds: [errorEmbed('포트폴리오 채널이 설정되지 않았습니다. `/설정`에서 먼저 설정해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const channel = interaction.guild.channels.cache.get(settings.channels.portfolio);
    if (channel === undefined || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [errorEmbed('포트폴리오 채널을 찾을 수 없습니다. `/설정`에서 다시 설정해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const imageUrl = interaction.options.getString(OPTION.imageUrl)?.trim() ?? '';
    const link = interaction.options.getString(OPTION.link)?.trim() ?? '';
    if (imageUrl !== '' && !isValidHttpUrl(imageUrl)) {
      await interaction.reply({ embeds: [errorEmbed('이미지 URL 형식이 올바르지 않습니다.')], flags: MessageFlags.Ephemeral });
      return;
    }
    if (link !== '' && !isValidHttpUrl(link)) {
      await interaction.reply({ embeds: [errorEmbed('링크 URL 형식이 올바르지 않습니다.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const id = await reservePortfolioId();
    const entry = {
      id,
      guildId: interaction.guild.id,
      title: interaction.options.getString(OPTION.title, true).trim(),
      description: interaction.options.getString(OPTION.description, true).trim(),
      imageUrl: imageUrl === '' ? null : imageUrl,
      link: link === '' ? null : link,
      authorId: interaction.user.id,
      createdAt: new Date().toISOString(),
    };
    await addPortfolioEntry(entry);
    await channel.send({ embeds: [buildPortfolioEmbed(entry)] });

    await interaction.reply({ embeds: [successEmbed(`포트폴리오가 ${channel}에 게시되었습니다.`)], flags: MessageFlags.Ephemeral });
  },
};
