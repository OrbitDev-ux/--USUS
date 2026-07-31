import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  OverwriteType,
  type Guild,
  type MessageActionRowComponentBuilder,
  type OverwriteData,
} from 'discord.js';
import { COLORS, ComponentId } from '../config/constants';
import type { ChannelSnapshot, PermissionOverwriteSnapshot, RoleSnapshot, ServerBackup } from '../types';
import { brandEmbed } from '../utils/embeds';
import { withArgs } from '../utils/ids';

export const SERVER_ACTION = {
  reset: 'reset',
  restore: 'restore',
} as const;

export type ServerAction = (typeof SERVER_ACTION)[keyof typeof SERVER_ACTION];

export interface WipeResult {
  channelsDeleted: number;
  rolesDeleted: number;
  errors: number;
}

export interface RestoreResult {
  rolesCreated: number;
  channelsCreated: number;
  errors: number;
}

// ─── 스냅샷 캡처 ───────────────────────────────────────────────

export function captureServerSnapshot(guild: Guild, createdBy: string): ServerBackup {
  const roles: RoleSnapshot[] = [...guild.roles.cache.values()]
    .filter((role) => role.id !== guild.id && !role.managed)
    .map((role) => ({
      originalId: role.id,
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      mentionable: role.mentionable,
      permissions: role.permissions.bitfield.toString(),
      position: role.position,
    }));

  const channels: ChannelSnapshot[] = [...guild.channels.cache.values()]
    .filter((channel) => !channel.isThread())
    .map((channel) => ({
    originalId: channel.id,
    name: channel.name,
    type: channel.type,
    parentOriginalId: channel.parentId,
    position: channel.position,
    topic: 'topic' in channel ? (channel.topic ?? null) : null,
    nsfw: 'nsfw' in channel ? channel.nsfw : false,
    rateLimitPerUser: 'rateLimitPerUser' in channel ? (channel.rateLimitPerUser ?? null) : null,
    bitrate: 'bitrate' in channel ? channel.bitrate : null,
    userLimit: 'userLimit' in channel ? channel.userLimit : null,
    permissionOverwrites: [...channel.permissionOverwrites.cache.values()].map(
      (overwrite): PermissionOverwriteSnapshot => ({
        id: overwrite.id,
        type: overwrite.type === OverwriteType.Role ? 'role' : 'member',
        allow: overwrite.allow.bitfield.toString(),
        deny: overwrite.deny.bitfield.toString(),
      }),
    ),
  }));

  return {
    createdAt: new Date().toISOString(),
    createdBy,
    everyonePermissions: guild.roles.everyone.permissions.bitfield.toString(),
    roles,
    channels,
  };
}

// ─── 초기화(전체 삭제) ───────────────────────────────────────────

export async function wipeServer(guild: Guild): Promise<WipeResult> {
  const channelResults = await Promise.allSettled(
    [...guild.channels.cache.values()].map((channel) => channel.delete()),
  );
  const channelsDeleted = channelResults.filter((r) => r.status === 'fulfilled').length;
  const channelErrors = channelResults.filter((r) => r.status === 'rejected').length;

  const botTopPosition = guild.members.me?.roles.highest.position ?? 0;
  const deletableRoles = [...guild.roles.cache.values()].filter(
    (role) => role.id !== guild.id && !role.managed && role.position < botTopPosition,
  );
  const roleResults = await Promise.allSettled(deletableRoles.map((role) => role.delete()));
  const rolesDeleted = roleResults.filter((r) => r.status === 'fulfilled').length;
  const roleErrors = roleResults.filter((r) => r.status === 'rejected').length;

  return { channelsDeleted, rolesDeleted, errors: channelErrors + roleErrors };
}

// ─── 백업 데이터로 복구 ───────────────────────────────────────────

function resolveOverwriteId(
  overwrite: PermissionOverwriteSnapshot,
  guildId: string,
  roleIdMap: ReadonlyMap<string, string>,
): string | null {
  if (overwrite.type === 'member') {
    return overwrite.id;
  }
  if (overwrite.id === guildId) {
    return guildId;
  }
  return roleIdMap.get(overwrite.id) ?? null;
}

export async function restoreServerFromBackup(guild: Guild, backup: ServerBackup): Promise<RestoreResult> {
  let rolesCreated = 0;
  let channelsCreated = 0;
  let errors = 0;

  try {
    await guild.roles.everyone.setPermissions(BigInt(backup.everyonePermissions));
  } catch {
    errors += 1;
  }

  const roleIdMap = new Map<string, string>();
  const roleResults = await Promise.allSettled(
    backup.roles.map(async (roleSnapshot) => {
      const role = await guild.roles.create({
        name: roleSnapshot.name,
        color: roleSnapshot.color,
        hoist: roleSnapshot.hoist,
        mentionable: roleSnapshot.mentionable,
        permissions: BigInt(roleSnapshot.permissions),
      });
      roleIdMap.set(roleSnapshot.originalId, role.id);
    }),
  );
  rolesCreated += roleResults.filter((r) => r.status === 'fulfilled').length;
  errors += roleResults.filter((r) => r.status === 'rejected').length;

  const channelIdMap = new Map<string, string>();
  const categorySnapshots = backup.channels
    .filter((c) => c.type === ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position);
  const otherSnapshots = backup.channels
    .filter((c) => c.type !== ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position);

  async function createFromSnapshot(snapshot: ChannelSnapshot): Promise<void> {
    const parentId =
      snapshot.parentOriginalId === null ? undefined : channelIdMap.get(snapshot.parentOriginalId);
    interface ResolvedOverwrite {
      id: string;
      type: OverwriteType;
      allow: bigint;
      deny: bigint;
    }
    const overwrites: OverwriteData[] = snapshot.permissionOverwrites
      .map((overwrite): ResolvedOverwrite | null => {
        const id = resolveOverwriteId(overwrite, guild.id, roleIdMap);
        if (id === null) {
          return null;
        }
        return {
          id,
          type: overwrite.type === 'role' ? OverwriteType.Role : OverwriteType.Member,
          allow: BigInt(overwrite.allow),
          deny: BigInt(overwrite.deny),
        };
      })
      .filter((o): o is ResolvedOverwrite => o !== null);

    const channel = await guild.channels.create({
      name: snapshot.name,
      type: snapshot.type as Exclude<
        ChannelType,
        ChannelType.DM | ChannelType.GroupDM | ChannelType.PublicThread | ChannelType.AnnouncementThread | ChannelType.PrivateThread
      >,
      parent: parentId,
      topic: snapshot.topic ?? undefined,
      nsfw: snapshot.nsfw,
      rateLimitPerUser: snapshot.rateLimitPerUser ?? undefined,
      bitrate: snapshot.bitrate ?? undefined,
      userLimit: snapshot.userLimit ?? undefined,
      permissionOverwrites: overwrites,
    });
    channelIdMap.set(snapshot.originalId, channel.id);
  }

  // 카테고리는 자식 채널의 parentId가 참조하므로 먼저 모두 생성한 뒤 나머지를 병렬 생성한다.
  const categoryResults = await Promise.allSettled(categorySnapshots.map((c) => createFromSnapshot(c)));
  const otherResults = await Promise.allSettled(otherSnapshots.map((c) => createFromSnapshot(c)));
  channelsCreated +=
    categoryResults.filter((r) => r.status === 'fulfilled').length +
    otherResults.filter((r) => r.status === 'fulfilled').length;
  errors +=
    categoryResults.filter((r) => r.status === 'rejected').length +
    otherResults.filter((r) => r.status === 'rejected').length;

  return { rolesCreated, channelsCreated, errors };
}

// ─── UI ───────────────────────────────────────────────

export function buildConfirmRow(action: ServerAction, ownerId: string): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(withArgs(ComponentId.serverConfirm, action, ownerId))
      .setLabel(action === SERVER_ACTION.reset ? '정말 초기화하기' : '정말 복구하기')
      .setEmoji('⚠️')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(withArgs(ComponentId.serverCancel, action, ownerId))
      .setLabel('취소')
      .setStyle(ButtonStyle.Secondary),
  );
}

export function buildResetWarningEmbed(channelCount: number, roleCount: number) {
  return brandEmbed(COLORS.danger)
    .setTitle('⚠️ 서버 초기화 확인')
    .setDescription(
      '이 작업은 되돌릴 수 없습니다. 아래 항목이 모두 삭제됩니다.\n\n' +
        `📺 채널 **${channelCount}개**\n🎭 역할 **${roleCount}개**\n\n` +
        '초기화 직전 자동으로 현재 상태를 백업했습니다. 이후 `.서버백업`으로 구조를 복구할 수 있습니다.\n' +
        '(단, 메시지 기록·정확한 채널/역할 ID·웹훅 등은 복구되지 않습니다)\n\n' +
        '30초 안에 아래 버튼을 눌러야 실행됩니다.',
    );
}

export function buildRestoreWarningEmbed(backup: ServerBackup) {
  return brandEmbed(COLORS.danger)
    .setTitle('⚠️ 서버 복구 확인')
    .setDescription(
      '현재 서버의 채널·역할을 모두 삭제하고, 저장된 백업 구조로 다시 만듭니다. 되돌릴 수 없습니다.\n\n' +
        `📅 백업 시각: <t:${Math.floor(new Date(backup.createdAt).getTime() / 1000)}:F>\n` +
        `📺 채널 **${backup.channels.length}개** · 🎭 역할 **${backup.roles.length}개** 복구 예정\n\n` +
        '(메시지 기록·정확한 채널/역할 ID·웹훅 등은 복구되지 않습니다)\n\n' +
        '30초 안에 아래 버튼을 눌러야 실행됩니다.',
    );
}

export function buildResultEmbed(title: string, description: string) {
  return brandEmbed(COLORS.success).setTitle(title).setDescription(description);
}
