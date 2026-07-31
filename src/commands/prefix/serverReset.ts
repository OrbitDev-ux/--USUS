import { SERVER_ACTION, buildConfirmRow, buildResetWarningEmbed, captureServerSnapshot } from '../../modules/serverBackupService';
import { createServerActionSession } from '../../modules/serverActionSession';
import { saveServerBackup } from '../../storage/serverBackupStore';
import type { PrefixCommand } from '../../types';
import { errorEmbed } from '../../utils/embeds';
import { hasAdministrator } from '../../utils/permissions';

const CONFIRM_TTL_MS = 30_000;

export const serverResetCommand: PrefixCommand = {
  name: '서버초기화',
  description: '서버의 모든 채널·역할을 삭제합니다 (관리자 전용, 되돌릴 수 없음)',
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

    const reply = await message.reply({
      embeds: [buildResetWarningEmbed(backup.channels.length, backup.roles.length)],
      components: [buildConfirmRow(SERVER_ACTION.reset, message.author.id)],
    });

    createServerActionSession(reply.id, SERVER_ACTION.reset, message.author.id, CONFIRM_TTL_MS, () => {
      void reply
        .edit({ embeds: [errorEmbed('⏱️ 시간이 초과되어 초기화가 취소되었습니다.')], components: [] })
        .catch(() => undefined);
    });
  },
};
