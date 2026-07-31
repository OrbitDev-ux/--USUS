import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import { COLORS, ComponentId } from '../config/constants';
import { brandEmbed } from '../utils/embeds';

export const MESSAGE_SEND_LIMITS = {
  maxContentLength: 2000,
} as const;

export const MESSAGE_SEND_MODAL_FIELD = {
  content: 'content',
} as const;

const SENDABLE_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement] as const;

export function buildMessageSendPromptEmbed() {
  return brandEmbed(COLORS.primary)
    .setTitle('📨 메시지 전송')
    .setDescription('아래 메뉴에서 메시지를 보낼 채널을 선택해 주세요. (긴급 공지 등에 활용)');
}

export function buildMessageSendChannelSelectRow(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(ComponentId.messageSendChannel)
      .setPlaceholder('메시지를 보낼 채널 선택')
      .setChannelTypes(...SENDABLE_CHANNEL_TYPES),
  );
}
