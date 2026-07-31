import { COLORS } from '../../config/constants';
import type { PrefixCommand } from '../../types';
import { brandEmbed } from '../../utils/embeds';

export const pingCommand: PrefixCommand = {
  name: '핑',
  description: '봇의 응답 속도를 확인합니다',
  async execute(message) {
    const sent = await message.reply({
      embeds: [brandEmbed(COLORS.info).setDescription('🏓 퐁! 측정 중...')],
    });

    const roundTripMs = sent.createdTimestamp - message.createdTimestamp;
    const wsPingMs = Math.round(message.client.ws.ping);

    await sent.edit({
      embeds: [
        brandEmbed(COLORS.info)
          .setTitle('🏓 퐁!')
          .addFields(
            { name: '응답 속도', value: `${roundTripMs}ms`, inline: true },
            { name: '웹소켓 핑', value: `${wsPingMs}ms`, inline: true },
          ),
      ],
    });
  },
};
