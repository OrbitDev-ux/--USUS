const lastUsedAt = new Map<string, number>();

/** 남은 쿨다운(ms)을 반환한다. 0이면 사용 가능하며 사용 시각이 갱신된다. */
export function getRemainingCooldownMs(key: string, cooldownMs: number): number {
  const now = Date.now();
  const last = lastUsedAt.get(key);
  if (last !== undefined && now - last < cooldownMs) {
    return cooldownMs - (now - last);
  }
  lastUsedAt.set(key, now);
  return 0;
}
