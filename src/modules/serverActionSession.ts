import type { ServerAction } from './serverBackupService';

interface Session {
  readonly action: ServerAction;
  readonly ownerId: string;
  readonly timeoutHandle: NodeJS.Timeout;
}

const sessions = new Map<string, Session>();

/** 확인 버튼이 달린 메시지 ID를 기준으로 세션을 만들고, ttlMs가 지나면 자동으로 만료 처리한다. */
export function createServerActionSession(
  messageId: string,
  action: ServerAction,
  ownerId: string,
  ttlMs: number,
  onTimeout: () => void,
): void {
  const timeoutHandle = setTimeout(() => {
    sessions.delete(messageId);
    onTimeout();
  }, ttlMs);
  sessions.set(messageId, { action, ownerId, timeoutHandle });
}

/** 세션을 한 번 소비하고 제거한다(중복 클릭 방지). 없거나 이미 소비됐으면 undefined. */
export function consumeServerActionSession(messageId: string): Session | undefined {
  const session = sessions.get(messageId);
  if (session === undefined) {
    return undefined;
  }
  clearTimeout(session.timeoutHandle);
  sessions.delete(messageId);
  return session;
}
