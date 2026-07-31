import {
  ActionRowBuilder,
  ModalBuilder,
  MessageFlags,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { COLORS, ComponentId } from '../../config/constants';
import { sendLog } from '../../modules/logService';
import { getGuildSettings } from '../../storage/settingsStore';
import type { ModalHandler } from '../../types';
import { brandEmbed, errorEmbed, successEmbed } from '../../utils/embeds';
import { isValidHttpUrl } from '../../utils/url';

const FIELD = {
  title: 'title',
  content: 'content',
  imageUrl: 'imageUrl',
  color: 'color',
} as const;

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 4000;
const MAX_URL_LENGTH = 500;
const HEX_COLOR_PATTERN = /^#?([0-9a-fA-F]{6})$/;
const HEX_RADIX = 16;

export function buildAnnounceModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(ComponentId.announceModal)
    .setTitle('공지 작성')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(FIELD.title)
          .setLabel('제목')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(MAX_TITLE_LENGTH)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(FIELD.content)
          .setLabel('내용')
          .setPlaceholder('여러 줄 입력이 가능합니다.')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(MAX_CONTENT_LENGTH)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(FIELD.imageUrl)
          .setLabel('이미지 URL (선택)')
          .setPlaceholder('https://...')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(MAX_URL_LENGTH)
          .setRequired(false),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(FIELD.color)
          .setLabel('색상 HEX (선택, 예: #5865F2)')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(7)
          .setRequired(false),
      ),
    );
}

function parseHexColor(input: string): number | null {
  const match = HEX_COLOR_PATTERN.exec(input);
  const hex = match?.[1];
  return hex === undefined ? null : Number.parseInt(hex, HEX_RADIX);
}

export const announceModal: ModalHandler = {
  prefix: ComponentId.announceModal,
  async execute(interaction) {
    const settings = await getGuildSettings(interaction.guild.id);
    if (settings.channels.announcement === null) {
      await interaction.reply({
        embeds: [errorEmbed('공지 채널이 설정되지 않았습니다. `/설정`에서 먼저 설정해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = interaction.guild.channels.cache.get(settings.channels.announcement);
    if (channel === undefined || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [errorEmbed('공지 채널을 찾을 수 없습니다. `/설정`에서 다시 설정해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const title = interaction.fields.getTextInputValue(FIELD.title).trim();
    const content = interaction.fields.getTextInputValue(FIELD.content).trim();
    const imageUrl = interaction.fields.getTextInputValue(FIELD.imageUrl).trim();
    const colorInput = interaction.fields.getTextInputValue(FIELD.color).trim();

    let color: number = COLORS.primary;
    if (colorInput !== '') {
      const parsed = parseHexColor(colorInput);
      if (parsed === null) {
        await interaction.reply({
          embeds: [errorEmbed('색상 형식이 올바르지 않습니다. 예: `#5865F2`')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      color = parsed;
    }

    if (imageUrl !== '' && !isValidHttpUrl(imageUrl)) {
      await interaction.reply({
        embeds: [errorEmbed('이미지 URL 형식이 올바르지 않습니다. `https://`로 시작해야 합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = brandEmbed(color)
      .setTitle(`📢 ${title}`)
      .setDescription(content)
      .setAuthor({
        name: interaction.user.displayName,
        iconURL: interaction.user.displayAvatarURL(),
      });
    if (imageUrl !== '') {
      embed.setImage(imageUrl);
    }

    await channel.send({ embeds: [embed] });

    await interaction.reply({
      embeds: [successEmbed(`공지를 게시했습니다: ${channel}`)],
      flags: MessageFlags.Ephemeral,
    });

    await sendLog(
      interaction.guild,
      brandEmbed(COLORS.info)
        .setTitle('📢 공지 게시')
        .setDescription(`${interaction.member} 님이 공지 **${title}**을(를) 게시했습니다.`),
    );
  },
};
