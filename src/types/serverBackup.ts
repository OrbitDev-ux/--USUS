export interface PermissionOverwriteSnapshot {
  id: string;
  type: 'role' | 'member';
  allow: string;
  deny: string;
}

export interface ChannelSnapshot {
  originalId: string;
  name: string;
  type: number;
  parentOriginalId: string | null;
  position: number;
  topic: string | null;
  nsfw: boolean;
  rateLimitPerUser: number | null;
  bitrate: number | null;
  userLimit: number | null;
  permissionOverwrites: readonly PermissionOverwriteSnapshot[];
}

export interface RoleSnapshot {
  originalId: string;
  name: string;
  color: number;
  hoist: boolean;
  mentionable: boolean;
  permissions: string;
  position: number;
}

export interface ServerBackup {
  createdAt: string;
  createdBy: string;
  everyonePermissions: string;
  roles: readonly RoleSnapshot[];
  channels: readonly ChannelSnapshot[];
}

export interface ServerBackupData {
  guilds: Record<string, ServerBackup>;
}
