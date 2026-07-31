import { PermissionFlagsBits, type GuildMember } from 'discord.js';
import type { GuildSettings } from '../types';

export function isAdmin(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.ManageGuild);
}

/** 서버 초기화/백업처럼 되돌릴 수 없는 작업에 한해 요구하는 최고 권한 등급. */
export function hasAdministrator(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

export function isStaff(member: GuildMember, settings: GuildSettings): boolean {
  if (isAdmin(member)) {
    return true;
  }
  return settings.roles.staff !== null && member.roles.cache.has(settings.roles.staff);
}
