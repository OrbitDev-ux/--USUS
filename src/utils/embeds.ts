import { EmbedBuilder } from 'discord.js';
import { BRAND, COLORS } from '../config/constants';

export function brandEmbed(color: number = COLORS.primary): EmbedBuilder {
  return new EmbedBuilder().setColor(color).setFooter({ text: BRAND.footer }).setTimestamp();
}

export function successEmbed(description: string): EmbedBuilder {
  return brandEmbed(COLORS.success).setDescription(`✅ ${description}`);
}

export function errorEmbed(description: string): EmbedBuilder {
  return brandEmbed(COLORS.danger).setDescription(`⚠️ ${description}`);
}
