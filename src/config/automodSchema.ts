export interface AutomodRuleDef {
  readonly label: string;
  readonly description: string;
}

export const AUTOMOD_RULE_DEFS = {
  profanity: {
    label: '욕설 필터',
    description: '금지어 목록에 포함된 욕설 메시지를 삭제',
  },
  spam: {
    label: '도배 방지',
    description: '짧은 시간에 여러 메시지를 연속 전송하는 도배 감지',
  },
  repeat: {
    label: '반복 메시지 방지',
    description: '동일한 내용을 반복 전송하는 메시지 감지',
  },
  link: {
    label: '링크 차단',
    description: '일반 URL 링크가 포함된 메시지를 삭제',
  },
  invite: {
    label: '초대 링크 차단',
    description: '다른 서버 초대 링크가 포함된 메시지를 삭제',
  },
  mentionSpam: {
    label: '멘션 도배 방지',
    description: '한 메시지에 과도한 멘션이 포함된 경우 감지',
  },
  massEmoji: {
    label: '대량 이모지 방지',
    description: '한 메시지에 이모지가 과도하게 포함된 경우 감지',
  },
  capsLock: {
    label: '대량 대문자 방지',
    description: '메시지 대부분이 대문자로 작성된 경우 감지',
  },
} as const satisfies Record<string, AutomodRuleDef>;

export type AutomodRuleKey = keyof typeof AUTOMOD_RULE_DEFS;

export const AUTOMOD_RULE_KEYS = Object.keys(AUTOMOD_RULE_DEFS) as readonly AutomodRuleKey[];

export function isAutomodRuleKey(value: string): value is AutomodRuleKey {
  return value in AUTOMOD_RULE_DEFS;
}

/** 규칙별 감지 임계값. 향후 서버별 커스터마이즈로 확장 가능하도록 분리해 둔다. */
export const AUTOMOD_THRESHOLDS = {
  spamCount: 5,
  spamWindowMs: 5_000,
  repeatCount: 3,
  repeatWindowMs: 15_000,
  mentionSpamCount: 5,
  massEmojiCount: 8,
  capsLockMinLength: 10,
  capsLockRatio: 0.7,
} as const;
