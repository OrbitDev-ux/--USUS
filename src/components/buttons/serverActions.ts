import { MessageFlags } from 'discord.js';
import { COLORS, ComponentId } from '../../config/constants';
import { sendLog } from '../../modules/logService';
import { consumeServerActionSession } from '../../modules/serverActionSession';
import {
  SERVER_ACTION,
  buildResultEmbed,
  restoreServerFromBackup,
  wipeServer,
} from '../../modules/serverBackupService';
import { getServerBackup } from '../../storage/serverBackupStore';
import type { ButtonHandler } from '../../types';
import { brandEmbed, errorEmbed } from '../../utils/embeds';

export const serverConfirm: ButtonHandler = {
  prefix: ComponentId.serverConfirm,
  async execute(interaction, args) {
    const [action, ownerId] = args;
    const session = consumeServerActionSession(interaction.message.id);
    if (session === undefined) {
      await interaction.reply({
        embeds: [errorEmbed('만료되었거나 이미 처리된 요청입니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (interaction.user.id !== ownerId || interaction.user.id !== session.ownerId) {
      await interaction.reply({
        embeds: [errorEmbed('명령어를 실행한 본인만 확인할 수 있습니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (action === SERVER_ACTION.reset) {
      await interaction.update({
        embeds: [
          brandEmbed(COLORS.warning)
            .setTitle('⏳ 초기화 진행 중...')
            .setDescription('채널과 역할을 삭제하고 있습니다. 잠시만 기다려 주세요.'),
        ],
        components: [],
      });

      const result = await wipeServer(interaction.guild);
      const resultEmbed = buildResultEmbed(
        '✅ 서버 초기화 완료',
        `📺 채널 ${result.channelsDeleted}개, 🎭 역할 ${result.rolesDeleted}개를 삭제했습니다.` +
          (result.errors > 0 ? `\n⚠️ ${result.errors}건은 삭제하지 못했습니다. (봇 권한·역할 순서를 확인해 주세요)` : '') +
          '\n\n`.서버백업`으로 초기화 직전 상태를 복구할 수 있습니다.',
      );
      await interaction.editReply({ embeds: [resultEmbed] });
      await sendLog(
        interaction.guild,
        brandEmbed(COLORS.warning)
          .setTitle('🗑️ 서버 초기화 실행')
          .setDescription(`${interaction.user} 님이 서버를 초기화했습니다. (채널 ${result.channelsDeleted}개, 역할 ${result.rolesDeleted}개 삭제)`),
      );
      return;
    }

    // restore
    await interaction.update({
      embeds: [
        brandEmbed(COLORS.warning)
          .setTitle('⏳ 복구 진행 중...')
          .setDescription('현재 구조를 삭제하고 백업 데이터로 다시 만들고 있습니다. 잠시만 기다려 주세요.'),
      ],
      components: [],
    });

    const backup = await getServerBackup(interaction.guild.id);
    if (backup === null) {
      await interaction.editReply({ embeds: [errorEmbed('백업 데이터를 찾을 수 없습니다.')] });
      return;
    }

    await wipeServer(interaction.guild);
    const result = await restoreServerFromBackup(interaction.guild, backup);
    const resultEmbed = buildResultEmbed(
      '✅ 서버 복구 완료',
      `📺 채널 ${result.channelsCreated}개, 🎭 역할 ${result.rolesCreated}개를 복구했습니다.` +
        (result.errors > 0 ? `\n⚠️ ${result.errors}건은 복구하지 못했습니다. (봇 권한을 확인해 주세요)` : ''),
    );
    await interaction.editReply({ embeds: [resultEmbed] });
    await sendLog(
      interaction.guild,
      brandEmbed(COLORS.warning)
        .setTitle('♻️ 서버 백업 복구 실행')
        .setDescription(`${interaction.user} 님이 서버를 백업 데이터로 복구했습니다. (채널 ${result.channelsCreated}개, 역할 ${result.rolesCreated}개 생성)`),
    );
  },
};

export const serverCancel: ButtonHandler = {
  prefix: ComponentId.serverCancel,
  async execute(interaction, args) {
    const ownerId = args[1];
    const session = consumeServerActionSession(interaction.message.id);
    if (session === undefined) {
      await interaction.reply({
        embeds: [errorEmbed('만료되었거나 이미 처리된 요청입니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (interaction.user.id !== ownerId || interaction.user.id !== session.ownerId) {
      await interaction.reply({
        embeds: [errorEmbed('명령어를 실행한 본인만 취소할 수 있습니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.update({
      embeds: [brandEmbed(COLORS.neutral).setTitle('🚫 취소됨').setDescription('작업이 취소되었습니다.')],
      components: [],
    });
  },
};
