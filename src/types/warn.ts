export interface Warn {
  id: string;
  moderatorId: string;
  reason: string;
  createdAt: string;
}

/** guilds[guildId][userId] = 해당 유저의 경고 목록 */
export interface WarnData {
  guilds: Record<string, Record<string, Warn[]>>;
}
