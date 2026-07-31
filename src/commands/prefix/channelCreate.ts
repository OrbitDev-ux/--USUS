import { buildChannelCreateButtonRow, buildChannelCreatePromptEmbed } from '../../modules/channelCreateService';
import type { PrefixCommand } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { isAdmin } from '../../utils/permissions';

export const channelCreateCommand: PrefixCommand = {
  name: '채널생성',
  description: '이름·개수·종류를 입력해 채널을 한 번에 여러 개 생성합니다 (관리자 전용)',
  async execute(message) {
    const member = message.member ?? (await message.guild.members.fetch(message.author.id));
    if (!isAdmin(member)) {
      await message.reply({ embeds: [errorEmbed('이 명령어는 서버 관리 권한이 필요합니다.')] });
      return;
    }

    await message.reply({
      embeds: [buildChannelCreatePromptEmbed()],
      components: [buildChannelCreateButtonRow()],
    });
  },
};
