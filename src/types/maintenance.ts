export type MaintenanceKind = 'scheduled' | 'emergency' | 'completed' | 'extended';

export interface MaintenanceRecord {
  id: number;
  guildId: string;
  kind: MaintenanceKind;
  reason: string;
  /** 예정/긴급/연장 시 예상 종료 시각 (자유 형식 문자열, 완료에는 없음) */
  expectedEnd: string | null;
  authorId: string;
  createdAt: string;
}

export interface MaintenanceData {
  counter: number;
  records: MaintenanceRecord[];
}
