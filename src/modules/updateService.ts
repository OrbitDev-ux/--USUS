import { COLORS } from '../config/constants';
import type { UpdateChangeKind, UpdateEntry } from '../types';
import { brandEmbed } from '../utils/embeds';

export interface UpdateChangeKindDef {
  readonly label: string;
  readonly emoji: string;
}

export const UPDATE_CHANGE_KIND_DEFS: Record<UpdateChangeKind, UpdateChangeKindDef> = {
  added: { label: '추가', emoji: '🆕' },
  changed: { label: '수정', emoji: '🔧' },
  improved: { label: '개선', emoji: '✨' },
  removed: { label: '삭제', emoji: '🗑️' },
  planned: { label: '예정', emoji: '📅' },
};

const CHANGE_KIND_ORDER: readonly UpdateChangeKind[] = ['added', 'changed', 'improved', 'removed', 'planned'];

/** 자유 입력 텍스트를 줄 단위 항목 목록으로 정리한다. 빈 줄은 제거한다. */
export function parseChangeLines(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function buildUpdateEmbed(entry: UpdateEntry) {
  const embed = brandEmbed(COLORS.primary)
    .setTitle(`🚀 업데이트 ${entry.version}`)
    .setDescription(`<@${entry.authorId}> 님이 새 업데이트를 게시했습니다.`);

  for (const kind of CHANGE_KIND_ORDER) {
    const items = entry.changes[kind];
    if (items.length === 0) {
      continue;
    }
    const def = UPDATE_CHANGE_KIND_DEFS[kind];
    embed.addFields({
      name: `${def.emoji} ${def.label}`,
      value: items.map((item) => `• ${item}`).join('\n'),
    });
  }

  return embed;
}
