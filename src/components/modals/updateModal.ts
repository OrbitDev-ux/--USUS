import { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { ComponentId } from '../../config/constants';
import { UPDATE_CHANGE_KIND_DEFS, buildUpdateEmbed, parseChangeLines } from '../../modules/updateService';
import { takePendingUpdateVersion } from '../../modules/pendingUpdateVersion';
import { addUpdateEntry, reserveUpdateId } from '../../storage/updateStore';
import { getGuildSettings } from '../../storage/settingsStore';
import type { ModalHandler, UpdateChangeKind } from '../../types';
import { errorEmbed, successEmbed } from '../../utils/embeds';

const FIELD: Record<UpdateChangeKind, UpdateChangeKind> = {
  added: 'added',
  changed: 'changed',
  improved: 'improved',
  removed: 'removed',
  planned: 'planned',
};

const MAX_SECTION_LENGTH = 1000;

export function buildUpdateModal(): ModalBuilder {
  const modal = new ModalBuilder().setCustomId(ComponentId.updateModal).setTitle('업데이트 게시');
  for (const kind of Object.values(FIELD)) {
    const def = UPDATE_CHANGE_KIND_DEFS[kind];
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(kind)
          .setLabel(`${def.emoji} ${def.label} (한 줄에 하나씩, 선택)`)
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(MAX_SECTION_LENGTH)
          .setRequired(false),
      ),
    );
  }
  return modal;
}

export const updateModal: ModalHandler = {
  prefix: ComponentId.updateModal,
  async execute(interaction) {
    const version = takePendingUpdateVersion(interaction.user.id);
    if (version === null) {
      await interaction.reply({
        embeds: [errorEmbed('요청이 만료되었습니다. `/업데이트`를 다시 실행해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const settings = await getGuildSettings(interaction.guild.id);
    if (settings.channels.update === null) {
      await interaction.reply({
        embeds: [errorEmbed('업데이트 채널이 설정되지 않았습니다. `/설정`에서 먼저 설정해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const channel = interaction.guild.channels.cache.get(settings.channels.update);
    if (channel === undefined || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [errorEmbed('업데이트 채널을 찾을 수 없습니다. `/설정`에서 다시 설정해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const changes: Record<UpdateChangeKind, readonly string[]> = {
      added: parseChangeLines(interaction.fields.getTextInputValue(FIELD.added)),
      changed: parseChangeLines(interaction.fields.getTextInputValue(FIELD.changed)),
      improved: parseChangeLines(interaction.fields.getTextInputValue(FIELD.improved)),
      removed: parseChangeLines(interaction.fields.getTextInputValue(FIELD.removed)),
      planned: parseChangeLines(interaction.fields.getTextInputValue(FIELD.planned)),
    };

    if (Object.values(changes).every((items) => items.length === 0)) {
      await interaction.reply({
        embeds: [errorEmbed('최소 한 항목 이상 입력해 주세요.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const id = await reserveUpdateId();
    const entry = {
      id,
      guildId: interaction.guild.id,
      version,
      changes,
      authorId: interaction.user.id,
      createdAt: new Date().toISOString(),
    };
    await addUpdateEntry(entry);

    await channel.send({ embeds: [buildUpdateEmbed(entry)] });

    await interaction.reply({
      embeds: [successEmbed(`업데이트 ${version}이(가) ${channel}에 게시되었습니다.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
