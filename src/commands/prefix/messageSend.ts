import { buildMessageSendChannelSelectRow, buildMessageSendPromptEmbed } from '../../modules/messageSendService';
import type { PrefixCommand } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { isAdmin } from '../../utils/permissions';

export const messageSendCommand: PrefixCommand = {
  name: '메시지전송',
  description: '특정 채널에 메시지를 보냅니다 (긴급 공지용, 관리자 전용)',
  async execute(message) {
    const member = message.member ?? (await message.guild.members.fetch(message.author.id));
    if (!isAdmin(member)) {
      await message.reply({ embeds: [errorEmbed('이 명령어는 서버 관리 권한이 필요합니다.')] });
      return;
    }

    await message.reply({
      embeds: [buildMessageSendPromptEmbed()],
      components: [buildMessageSendChannelSelectRow()],
    });
  },
};
