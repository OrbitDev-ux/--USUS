export type UpdateChangeKind = 'added' | 'changed' | 'improved' | 'removed' | 'planned';

export interface UpdateEntry {
  id: number;
  guildId: string;
  version: string;
  changes: Record<UpdateChangeKind, readonly string[]>;
  authorId: string;
  createdAt: string;
}

export interface UpdateData {
  counter: number;
  entries: UpdateEntry[];
}
