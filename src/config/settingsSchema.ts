import { ChannelType } from 'discord.js';

export interface ChannelSettingDef {
  readonly label: string;
  readonly description: string;
  readonly channelTypes: readonly ChannelType[];
}

export interface RoleSettingDef {
  readonly label: string;
  readonly description: string;
}

export interface FeatureDef {
  readonly label: string;
  readonly description: string;
}

export const CHANNEL_SETTING_DEFS = {
  welcome: {
    label: '환영·퇴장 채널',
    description: '입장/퇴장 인사를 보낼 채널',
    channelTypes: [ChannelType.GuildText],
  },
  log: {
    label: '로그 채널',
    description: '서버 활동 로그를 기록할 채널',
    channelTypes: [ChannelType.GuildText],
  },
  announcement: {
    label: '공지 채널',
    description: '/공지 명령으로 작성한 공지를 보낼 채널',
    channelTypes: [ChannelType.GuildText],
  },
  ticketCategory: {
    label: '티켓 카테고리',
    description: '고객 지원 티켓 채널이 생성될 카테고리',
    channelTypes: [ChannelType.GuildCategory],
  },
  orderCategory: {
    label: '주문 카테고리',
    description: '외주 견적/주문 채널이 생성될 카테고리',
    channelTypes: [ChannelType.GuildCategory],
  },
  update: {
    label: '업데이트 채널',
    description: '/업데이트 명령으로 작성한 릴리즈 노트를 보낼 채널',
    channelTypes: [ChannelType.GuildText],
  },
  maintenance: {
    label: '점검 채널',
    description: '/점검 명령으로 작성한 점검 안내를 보낼 채널',
    channelTypes: [ChannelType.GuildText],
  },
  report: {
    label: '신고 접수 채널',
    description: '유저 신고가 접수되면 직원에게 알릴 채널',
    channelTypes: [ChannelType.GuildText],
  },
  review: {
    label: '후기 채널',
    description: '완료된 주문에 대한 고객 후기를 게시할 채널',
    channelTypes: [ChannelType.GuildText],
  },
  portfolio: {
    label: '포트폴리오 채널',
    description: '/포트폴리오 명령으로 작성한 포트폴리오를 게시할 채널',
    channelTypes: [ChannelType.GuildText],
  },
} as const satisfies Record<string, ChannelSettingDef>;

export const ROLE_SETTING_DEFS = {
  staff: {
    label: '직원 역할',
    description: '티켓·주문 채널 열람과 처리 권한을 가진 역할',
  },
  verified: {
    label: '인증 역할',
    description: '인증 패널에서 인증 시 부여할 역할',
  },
} as const satisfies Record<string, RoleSettingDef>;

export const FEATURE_DEFS = {
  welcome: {
    label: '환영 메시지',
    description: '멤버 입장 시 환영 메시지 전송',
  },
  farewell: {
    label: '퇴장 메시지',
    description: '멤버 퇴장 시 안내 메시지 전송',
  },
  messageLogs: {
    label: '메시지 로그',
    description: '메시지 수정/삭제를 로그 채널에 기록',
  },
} as const satisfies Record<string, FeatureDef>;

export type ChannelSettingKey = keyof typeof CHANNEL_SETTING_DEFS;
export type RoleSettingKey = keyof typeof ROLE_SETTING_DEFS;
export type FeatureKey = keyof typeof FEATURE_DEFS;

export const CHANNEL_SETTING_KEYS = Object.keys(CHANNEL_SETTING_DEFS) as readonly ChannelSettingKey[];
export const ROLE_SETTING_KEYS = Object.keys(ROLE_SETTING_DEFS) as readonly RoleSettingKey[];
export const FEATURE_KEYS = Object.keys(FEATURE_DEFS) as readonly FeatureKey[];

export function isChannelSettingKey(value: string): value is ChannelSettingKey {
  return value in CHANNEL_SETTING_DEFS;
}

export function isRoleSettingKey(value: string): value is RoleSettingKey {
  return value in ROLE_SETTING_DEFS;
}

export function isFeatureKey(value: string): value is FeatureKey {
  return value in FEATURE_DEFS;
}
