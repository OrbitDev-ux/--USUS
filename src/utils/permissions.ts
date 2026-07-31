import { PermissionFlagsBits, type GuildMember } from 'discord.js';
import type { GuildSettings } from '../types';

export function isAdmin(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.ManageGuild);
}

export function isStaff(member: GuildMember, settings: GuildSettings): boolean {
  if (isAdmin(member)) {
    return true;
  }
  return settings.roles.staff !== null && member.roles.cache.has(settings.roles.staff);
}
