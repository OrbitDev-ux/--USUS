const TTL_MS = 5 * 60 * 1000;

interface PendingEntry {
  version: string;
  expiresAt: number;
}

const pending = new Map<string, PendingEntry>();

/** /업데이트 명령 실행자의 버전 문자열을 모달 제출 시까지 임시 보관한다. */
export function setPendingUpdateVersion(userId: string, version: string): void {
  pending.set(userId, { version, expiresAt: Date.now() + TTL_MS });
}

/** 한 번 꺼내면 즉시 제거된다. 만료됐거나 없으면 null. */
export function takePendingUpdateVersion(userId: string): string | null {
  const entry = pending.get(userId);
  pending.delete(userId);
  if (entry === undefined || entry.expiresAt < Date.now()) {
    return null;
  }
  return entry.version;
}
