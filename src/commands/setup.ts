import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { buildAuthPanel, buildQuotePanel, buildTicketPanel, type PanelMessage } from '../modules/panels';
import type { Command } from '../types';
import { errorEmbed, successEmbed } from '../utils/embeds';

const SUB = {
  auth: '인증패널',
  ticket: '티켓패널',
  quote: '견적패널',
} as const;

const OPTION_CHANNEL = '채널';

const PANEL_BUILDERS: Record<string, () => PanelMessage> = {
  [SUB.auth]: buildAuthPanel,
  [SUB.ticket]: buildTicketPanel,
  [SUB.quote]: buildQuotePanel,
};

export const setupCommand: Command = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('인증·티켓·견적 패널을 설치합니다')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName(SUB.auth)
        .setDescription('인증 패널을 설치합니다')
        .addChannelOption((option) =>
          option
            .setName(OPTION_CHANNEL)
            .setDescription('패널을 보낼 채널 (기본: 현재 채널)')
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(SUB.ticket)
        .setDescription('고객 지원 티켓 패널을 설치합니다')
        .addChannelOption((option) =>
          option
            .setName(OPTION_CHANNEL)
            .setDescription('패널을 보낼 채널 (기본: 현재 채널)')
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(SUB.quote)
        .setDescription('외주 견적 문의 패널을 설치합니다')
        .addChannelOption((option) =>
          option
            .setName(OPTION_CHANNEL)
            .setDescription('패널을 보낼 채널 (기본: 현재 채널)')
            .addChannelTypes(ChannelType.GuildText),
        ),
    ),
  async execute(interaction) {
    const target = interaction.options.getChannel(OPTION_CHANNEL) ?? interaction.channel;
    if (target === null || target.type !== ChannelType.GuildText) {
      await interaction.reply({
        embeds: [errorEmbed('텍스트 채널에서만 패널을 설치할 수 있습니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const buildPanel = PANEL_BUILDERS[interaction.options.getSubcommand()];
    if (buildPanel === undefined) {
      await interaction.reply({
        embeds: [errorEmbed('알 수 없는 패널 종류입니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await target.send(buildPanel());
    await interaction.reply({
      embeds: [successEmbed(`패널이 ${target}에 설치되었습니다.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
