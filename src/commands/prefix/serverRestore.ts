import { SERVER_ACTION, buildConfirmRow, buildRestoreWarningEmbed } from '../../modules/serverBackupService';
import { createServerActionSession } from '../../modules/serverActionSession';
import { getServerBackup } from '../../storage/serverBackupStore';
import type { PrefixCommand } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { hasAdministrator } from '../../utils/permissions';

const CONFIRM_TTL_MS = 30_000;

export const serverRestoreCommand: PrefixCommand = {
  name: '서버백업',
  description: '저장된 백업으로 서버 채널·역할을 복구합니다 (관리자 전용, 되돌릴 수 없음)',
  async execute(message) {
    const member = message.member ?? (await message.guild.members.fetch(message.author.id));
    if (!hasAdministrator(member)) {
      await message.reply({
        embeds: [errorEmbed('이 명령어는 서버 관리자(Administrator 권한)만 사용할 수 있습니다.')],
      });
      return;
    }

    const backup = await getServerBackup(message.guild.id);
    if (backup === null) {
      await message.reply({ embeds: [errorEmbed('저장된 백업이 없습니다. 먼저 `.서버저장`을 실행해 주세요.')] });
      return;
    }

    const reply = await message.reply({
      embeds: [buildRestoreWarningEmbed(backup)],
      components: [buildConfirmRow(SERVER_ACTION.restore, message.author.id)],
    });

    createServerActionSession(reply.id, SERVER_ACTION.restore, message.author.id, CONFIRM_TTL_MS, () => {
      void reply
        .edit({ embeds: [errorEmbed('⏱️ 시간이 초과되어 복구가 취소되었습니다.')], components: [] })
        .catch(() => undefined);
    });
  },
};
