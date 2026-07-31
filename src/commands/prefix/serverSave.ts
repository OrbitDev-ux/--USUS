import { COLORS } from '../../config/constants';
import { captureServerSnapshot } from '../../modules/serverBackupService';
import { saveServerBackup } from '../../storage/serverBackupStore';
import type { PrefixCommand } from '../../types';
import { brandEmbed, errorEmbed } from '../../utils/embeds';
import { hasAdministrator } from '../../utils/permissions';

export const serverSaveCommand: PrefixCommand = {
  name: '서버저장',
  description: '현재 서버의 채널·역할 구조를 백업으로 저장합니다 (관리자 전용)',
  async execute(message) {
    const member = message.member ?? (await message.guild.members.fetch(message.author.id));
    if (!hasAdministrator(member)) {
      await message.reply({
        embeds: [errorEmbed('이 명령어는 서버 관리자(Administrator 권한)만 사용할 수 있습니다.')],
      });
      return;
    }

    const backup = captureServerSnapshot(message.guild, message.author.id);
    await saveServerBackup(message.guild.id, backup);

    await message.reply({
      embeds: [
        brandEmbed(COLORS.success)
          .setTitle('💾 서버 백업 저장 완료')
          .setDescription(
            `📺 채널 **${backup.channels.length}개**\n🎭 역할 **${backup.roles.length}개**\n\n` +
              '`.서버백업`으로 이 상태를 언제든 복구할 수 있습니다.\n' +
              '(메시지 기록·정확한 채널/역할 ID·웹훅은 백업 대상이 아닙니다)',
          ),
      ],
    });
  },
};
