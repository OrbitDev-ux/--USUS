import { PermissionFlagsBits, type Guild, type OverwriteResolvable } from 'discord.js';

const MEMBER_ALLOW = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles,
] as const;

const BOT_ALLOW = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.ManageChannels,
] as const;

/** 의뢰인·직원·봇만 볼 수 있는 비공개 채널 권한 설정을 만든다. (티켓·주문 공용) */
export function buildPrivateChannelOverwrites(
  guild: Guild,
  memberId: string,
  botId: string,
  staffRoleId: string | null,
): OverwriteResolvable[] {
  const overwrites: OverwriteResolvable[] = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: memberId, allow: [...MEMBER_ALLOW] },
    { id: botId, allow: [...BOT_ALLOW] },
  ];
  if (staffRoleId !== null) {
    overwrites.push({ id: staffRoleId, allow: [...MEMBER_ALLOW] });
  }
  return overwrites;
}
