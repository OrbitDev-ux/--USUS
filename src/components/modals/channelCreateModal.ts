import { MessageFlags } from 'discord.js';
import { COLORS, ComponentId } from '../../config/constants';
import {
  CHANNEL_CREATE_LIMITS,
  CHANNEL_CREATE_MODAL_FIELD,
  buildChannelCreateResultEmbed,
  createChannelsBulk,
  parseChannelKind,
} from '../../modules/channelCreateService';
import type { ModalHandler } from '../../types';
import { brandEmbed, errorEmbed } from '../../utils/embeds';
import { isAdmin } from '../../utils/permissions';

export const channelCreateModal: ModalHandler = {
  prefix: ComponentId.channelCreateModal,
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const name = interaction.fields.getTextInputValue(CHANNEL_CREATE_MODAL_FIELD.name).trim();
    if (name === '') {
      await interaction.reply({ embeds: [errorEmbed('채널 이름을 입력해 주세요.')], flags: MessageFlags.Ephemeral });
      return;
    }

    const countRaw = interaction.fields.getTextInputValue(CHANNEL_CREATE_MODAL_FIELD.count).trim();
    const count = Number(countRaw);
    if (
      !Number.isInteger(count) ||
      count < CHANNEL_CREATE_LIMITS.minCount ||
      count > CHANNEL_CREATE_LIMITS.maxCount
    ) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            `개수는 ${CHANNEL_CREATE_LIMITS.minCount}~${CHANNEL_CREATE_LIMITS.maxCount} 사이의 숫자로 입력해 주세요.`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const kind = parseChannelKind(interaction.fields.getTextInputValue(CHANNEL_CREATE_MODAL_FIELD.kind));
    if (kind === null) {
      await interaction.reply({
        embeds: [errorEmbed('종류는 "텍스트" 또는 "음성"으로 입력해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const projectedTotal = interaction.guild.channels.cache.size + count;
    if (projectedTotal > CHANNEL_CREATE_LIMITS.guildChannelCap) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            `디스코드 서버당 채널 최대 개수(${CHANNEL_CREATE_LIMITS.guildChannelCap}개)를 초과합니다. ` +
              `현재 ${interaction.guild.channels.cache.size}개 + 요청 ${count}개 = ${projectedTotal}개.`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const isFromMessage = interaction.isFromMessage();
    const progressEmbed = brandEmbed(COLORS.warning)
      .setTitle('⏳ 채널 생성 중...')
      .setDescription(`채널 ${count}개를 만들고 있습니다. 잠시만 기다려 주세요.`);
    if (isFromMessage) {
      await interaction.update({ embeds: [progressEmbed], components: [] });
    } else {
      await interaction.reply({ embeds: [progressEmbed], flags: MessageFlags.Ephemeral });
    }

    const result = await createChannelsBulk(interaction.guild, name, count, kind);
    await interaction.editReply({ embeds: [buildChannelCreateResultEmbed(kind, result)] });
  },
};
