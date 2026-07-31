import { COLORS } from '../config/constants';
import type { PortfolioEntry } from '../types';
import { brandEmbed } from '../utils/embeds';

export function buildPortfolioEmbed(entry: PortfolioEntry) {
  const embed = brandEmbed(COLORS.primary)
    .setTitle(`💼 ${entry.title}`)
    .setDescription(entry.description);
  if (entry.imageUrl !== null) {
    embed.setImage(entry.imageUrl);
  }
  if (entry.link !== null) {
    embed.addFields({ name: '🔗 링크', value: entry.link });
  }
  return embed;
}
