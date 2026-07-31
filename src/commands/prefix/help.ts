import { COLORS, PREFIX } from '../../config/constants';
import type { PrefixCommand } from '../../types';
import { brandEmbed } from '../../utils/embeds';
import { commandMap, contextMenuCommands } from '../index';

export const helpCommand: PrefixCommand = {
  name: '도움말',
  description: '사용 가능한 명령어와 이용 방법을 안내합니다',
  async execute(message) {
    const adminCommandLines = [...commandMap.values()].map((command) => {
      const description = command.data.toJSON().description ?? '';
      return `\`/${command.data.name}\` — ${description}`;
    });
    const contextMenuLines = contextMenuCommands.map((command) => `\`${command.data.name}\` (유저 우클릭 → 앱)`);

    await message.reply({
      embeds: [
        brandEmbed(COLORS.primary)
          .setTitle('📖 도움말')
          .setDescription('Syntax Studio Services Bot 이용 안내입니다.')
          .addFields(
            {
              name: '💬 일반 명령어',
              value: [
                `\`${PREFIX}핑\` — 봇의 응답 속도를 확인합니다`,
                `\`${PREFIX}도움말\` — 이 안내를 표시합니다`,
                `\`${PREFIX}미니게임\` — 가위바위보·주사위·숫자맞추기를 즐깁니다`,
              ].join('\n'),
            },
            {
              name: '🖱️ 패널 이용',
              value: '인증·티켓·견적은 채널에 설치된 패널의 버튼을 눌러 이용해 주세요.',
            },
            { name: '🚨 신고', value: contextMenuLines.join('\n') },
            { name: '🛠️ 관리자 명령어', value: adminCommandLines.join('\n') },
          ),
      ],
    });
  },
};
