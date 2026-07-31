export const BRAND = {
  name: 'Syntax Studio',
  footer: 'Syntax Studio Services',
} as const;

/** 일반 유저용 접두사 명령어(.핑, .도움말)의 접두사 */
export const PREFIX = '.' as const;

export const COLORS = {
  primary: 0x5865f2,
  success: 0x57f287,
  warning: 0xfee75c,
  danger: 0xed4245,
  info: 0x3b82f6,
  neutral: 0x2b2d31,
} as const;

export const LIMITS = {
  buttonCooldownMs: 3_000,
  warnListDisplay: 10,
  orderListDisplay: 10,
  numberPadWidth: 4,
} as const;

/**
 * 모든 컴포넌트 customId의 단일 출처.
 * 형식: `네임스페이스:액션`이며, 라우터는 `접두사` 또는 `접두사:인자...`로 매칭한다.
 */
export const ComponentId = {
  authVerify: 'auth:verify',
  ticketCreate: 'ticket:create',
  ticketCreateModal: 'ticket:modal',
  ticketClose: 'ticket:close',
  ticketDelete: 'ticket:delete',
  orderQuote: 'order:quote',
  orderQuoteModal: 'order:modal',
  announceModal: 'announce:modal',
  settingsMenu: 'settings:menu',
  settingsChannel: 'settings:channel',
  settingsRole: 'settings:role',
  settingsToggle: 'settings:toggle',
  settingsAutomodToggle: 'settings:automod',
  settingsBack: 'settings:back',
  settingsMessagesModal: 'settings:messages',
  updateModal: 'update:modal',
  reportModal: 'report:modal',
  reportResolve: 'report:resolve',
  reportDismiss: 'report:dismiss',
  reviewCreate: 'review:create',
  reviewModal: 'review:modal',
  gameMenu: 'game:menu',
  gameRpsChoice: 'game:rps',
  gameRpsReplay: 'game:rpsreplay',
  gameDiceRoll: 'game:dice',
  gameGuessStart: 'game:guess:start',
  gameGuessModal: 'game:guess:modal',
  serverConfirm: 'server:confirm',
  serverCancel: 'server:cancel',
  channelCreateStart: 'channelcreate:start',
  channelCreateModal: 'channelcreate:modal',
} as const;

/** 환영/퇴장 메시지 템플릿 치환 변수: {user} {server} {memberCount} */
export const MESSAGE_TEMPLATE_VARS = ['user', 'server', 'memberCount'] as const;
