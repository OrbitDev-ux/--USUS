import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, type MessageActionRowComponentBuilder } from 'discord.js';
import { COLORS, ComponentId } from '../config/constants';
import { brandEmbed } from '../utils/embeds';

export type ChannelKind = 'text' | 'voice';

const KIND_LABEL: Record<ChannelKind, string> = { text: '텍스트', voice: '음성' };
const KIND_TYPE: Record<ChannelKind, ChannelType.GuildText | ChannelType.GuildVoice> = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
};

export const CHANNEL_CREATE_LIMITS = {
  minCount: 1,
  maxCount: 20,
  maxNameLength: 80,
} as const;

export const CHANNEL_CREATE_MODAL_FIELD = {
  name: 'name',
  count: 'count',
  kind: 'kind',
} as const;

/** '텍스트'/'음성' 자유 입력을 정규화한다. 비어있으면 텍스트로 간주한다. */
export function parseChannelKind(input: string): ChannelKind | null {
  const trimmed = input.trim();
  if (trimmed === '') {
    return 'text';
  }
  if (trimmed === '텍스트' || trimmed.toLowerCase() === 'text') {
    return 'text';
  }
  if (trimmed === '음성' || trimmed.toLowerCase() === 'voice') {
    return 'voice';
  }
  return null;
}

export function buildChannelCreatePromptEmbed() {
  return brandEmbed(COLORS.primary)
    .setTitle('📺 채널 생성')
    .setDescription(
      '아래 버튼을 눌러 만들 채널의 이름·개수·종류를 입력해 주세요.\n' +
        `개수가 1보다 크면 \`이름-1\`, \`이름-2\`… 형식으로 만들어집니다. (최대 ${CHANNEL_CREATE_LIMITS.maxCount}개)`,
    );
}

export function buildChannelCreateButtonRow(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ComponentId.channelCreateStart)
      .setLabel('채널 만들기')
      .setEmoji('📺')
      .setStyle(ButtonStyle.Primary),
  );
}

export interface BulkCreateResult {
  createdNames: readonly string[];
  errors: number;
}

/** 이름·개수만큼 채널을 병렬로 생성한다. */
export async function createChannelsBulk(
  guild: import('discord.js').Guild,
  baseName: string,
  count: number,
  kind: ChannelKind,
): Promise<BulkCreateResult> {
  const names = count === 1 ? [baseName] : Array.from({ length: count }, (_, i) => `${baseName}-${i + 1}`);

  const results = await Promise.allSettled(
    names.map((name) => guild.channels.create({ name, type: KIND_TYPE[kind] })),
  );

  const createdNames = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value.name);
  const errors = results.filter((r) => r.status === 'rejected').length;

  return { createdNames, errors };
}

export function buildChannelCreateResultEmbed(kind: ChannelKind, result: BulkCreateResult) {
  const embed = brandEmbed(result.createdNames.length > 0 ? COLORS.success : COLORS.danger)
    .setTitle('📺 채널 생성 결과')
    .setDescription(
      `${KIND_LABEL[kind]} 채널 **${result.createdNames.length}개** 생성 완료` +
        (result.errors > 0 ? `\n⚠️ ${result.errors}개는 생성하지 못했습니다. (봇 권한을 확인해 주세요)` : ''),
    );
  if (result.createdNames.length > 0) {
    embed.addFields({ name: '생성된 채널', value: result.createdNames.map((n) => `\`${n}\``).join(', ') });
  }
  return embed;
}
