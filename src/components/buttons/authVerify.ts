import { MessageFlags } from 'discord.js';
import { COLORS, ComponentId } from '../../config/constants';
import { sendLog } from '../../modules/logService';
import { getGuildSettings } from '../../storage/settingsStore';
import type { ButtonHandler } from '../../types';
import { brandEmbed, errorEmbed, successEmbed } from '../../utils/embeds';

export const authVerify: ButtonHandler = {
  prefix: ComponentId.authVerify,
  async execute(interaction) {
    const settings = await getGuildSettings(interaction.guild.id);
    const roleId = settings.roles.verified;

    if (roleId === null) {
      await interaction.reply({
        embeds: [errorEmbed('인증 역할이 설정되지 않았습니다. 관리자에게 문의해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (interaction.member.roles.cache.has(roleId)) {
      await interaction.reply({
        embeds: [successEmbed('이미 인증이 완료되어 있습니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await interaction.member.roles.add(roleId, '인증 패널 인증');
    } catch {
      await interaction.reply({
        embeds: [errorEmbed('역할 부여에 실패했습니다. 봇 역할이 인증 역할보다 위에 있는지 확인해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [successEmbed('인증이 완료되었습니다! 서버에 오신 것을 환영합니다. 🎉')],
      flags: MessageFlags.Ephemeral,
    });

    await sendLog(
      interaction.guild,
      brandEmbed(COLORS.success)
        .setTitle('✅ 멤버 인증')
        .setDescription(`${interaction.member} (${interaction.user.tag}) 님이 인증을 완료했습니다.`),
    );
  },
};
