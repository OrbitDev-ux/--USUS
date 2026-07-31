import { COLORS } from '../config/constants';
import type { MaintenanceKind, MaintenanceRecord } from '../types';
import { brandEmbed } from '../utils/embeds';

export interface MaintenanceKindDef {
  readonly label: string;
  readonly emoji: string;
  readonly color: number;
}

export const MAINTENANCE_KIND_DEFS: Record<MaintenanceKind, MaintenanceKindDef> = {
  scheduled: { label: '예정 점검', emoji: '🛠️', color: COLORS.info },
  emergency: { label: '긴급 점검', emoji: '🚨', color: COLORS.danger },
  completed: { label: '점검 완료', emoji: '✅', color: COLORS.success },
  extended: { label: '점검 연장', emoji: '⏳', color: COLORS.warning },
};

export function buildMaintenanceEmbed(record: MaintenanceRecord) {
  const def = MAINTENANCE_KIND_DEFS[record.kind];
  const embed = brandEmbed(def.color)
    .setTitle(`${def.emoji} ${def.label}`)
    .addFields({ name: '내용', value: record.reason });

  if (record.expectedEnd !== null) {
    embed.addFields({ name: '⏰ 예상 종료', value: record.expectedEnd });
  }

  return embed;
}
