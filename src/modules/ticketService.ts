import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  type ButtonInteraction,
  type ModalSubmitInteraction,
} from 'discord.js';
import { COLORS, ComponentId, LIMITS } from '../config/constants';
import { addTicket, findOpenTicketByUser, findTicketByChannel, reserveTicketId, updateTicketByChannel } from '../storage/ticketStore';
import { getGuildSettings } from '../storage/settingsStore';
import { brandEmbed, errorEmbed, successEmbed } from '../utils/embeds';
import { padNumber } from '../utils/format';
import { isStaff } from '../utils/permissions';
import { buildPrivateChannelOverwrites } from './privateChannel';
import { sendLog } from './logService';

const TICKET_CHANNEL_PREFIX = '티켓';

export async function createTicket(
  interaction: ModalSubmitInteraction<'cached'>,
  topic: string,
  description: string,
): Promise<void> {
  const { guild, member } = interaction;

  const existing = await findOpenTicketByUser(guild.id, member.id);
  if (existing !== null) {
    await interaction.reply({
      embeds: [errorEmbed(`이미 열려 있는 티켓이 있습니다: <#${existing.channelId}>`)],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const settings = await getGuildSettings(guild.id);
  const id = await reserveTicketId();
  const channel = await guild.channels.create({
    name: `${TICKET_CHANNEL_PREFIX}-${padNumber(id, LIMITS.numberPadWidth)}`,
    type: ChannelType.GuildText,
    parent: settings.channels.ticketCategory ?? undefined,
    permissionOverwrites: buildPrivateChannelOverwrites(
      guild,
      member.id,
      interaction.client.user.id,
      settings.roles.staff,
    ),
    topic: `${member.user.tag} 님의 문의 티켓`,
  });

  const intro = brandEmbed(COLORS.primary)
    .setTitle(`🎫 티켓 #${padNumber(id, LIMITS.numberPadWidth)}`)
    .setDescription(`${member} 님, 티켓이 생성되었습니다.\n담당 직원이 곧 확인할 예정이니 잠시만 기다려 주세요.`)
    .addFields(
      { name: '📌 문의 주제', value: topic },
      { name: '📝 문의 내용', value: description },
    );

  const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ComponentId.ticketClose)
      .setLabel('티켓 종료')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Secondary),
  );

  await channel.send({ content: member.toString(), embeds: [intro], components: [closeRow] });

  await addTicket({
    id,
    guildId: guild.id,
    channelId: channel.id,
    userId: member.id,
    topic,
    description,
    status: 'open',
    createdAt: new Date().toISOString(),
    closedAt: null,
  });

  await interaction.editReply({ embeds: [successEmbed(`티켓이 생성되었습니다: ${channel}`)] });

  await sendLog(
    guild,
    brandEmbed(COLORS.info)
      .setTitle('🎫 티켓 생성')
      .setDescription(`${member} 님이 티켓 #${padNumber(id, LIMITS.numberPadWidth)}을(를) 열었습니다.`)
      .addFields({ name: '주제', value: topic }),
  );
}

export async function closeTicket(interaction: ButtonInteraction<'cached'>): Promise<void> {
  const ticket = await findTicketByChannel(interaction.channelId);
  if (ticket === null) {
    await interaction.reply({ embeds: [errorEmbed('티켓 채널이 아닙니다.')], flags: MessageFlags.Ephemeral });
    return;
  }
  if (ticket.status !== 'open') {
    await interaction.reply({ embeds: [errorEmbed('이미 종료된 티켓입니다.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const settings = await getGuildSettings(interaction.guild.id);
  const canClose = interaction.member.id === ticket.userId || isStaff(interaction.member, settings);
  if (!canClose) {
    await interaction.reply({
      embeds: [errorEmbed('티켓을 종료할 권한이 없습니다.')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const channel = interaction.channel;
  if (channel !== null && channel.type === ChannelType.GuildText) {
    await channel.permissionOverwrites.edit(ticket.userId, { SendMessages: false });
  }

  await updateTicketByChannel(interaction.channelId, (t) => {
    t.status = 'closed';
    t.closedAt = new Date().toISOString();
  });

  const deleteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ComponentId.ticketDelete)
      .setLabel('채널 삭제')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({
    embeds: [
      brandEmbed(COLORS.warning)
        .setTitle('🔒 티켓 종료')
        .setDescription(`${interaction.member} 님이 티켓을 종료했습니다.\n직원은 아래 버튼으로 채널을 삭제할 수 있습니다.`),
    ],
    components: [deleteRow],
  });

  await sendLog(
    interaction.guild,
    brandEmbed(COLORS.warning)
      .setTitle('🔒 티켓 종료')
      .setDescription(
        `티켓 #${padNumber(ticket.id, LIMITS.numberPadWidth)}이(가) ${interaction.member} 님에 의해 종료되었습니다.`,
      ),
  );
}

export async function deleteTicket(interaction: ButtonInteraction<'cached'>): Promise<void> {
  const ticket = await findTicketByChannel(interaction.channelId);
  if (ticket === null) {
    await interaction.reply({ embeds: [errorEmbed('티켓 채널이 아닙니다.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const settings = await getGuildSettings(interaction.guild.id);
  if (!isStaff(interaction.member, settings)) {
    await interaction.reply({
      embeds: [errorEmbed('채널 삭제는 직원만 할 수 있습니다.')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await updateTicketByChannel(interaction.channelId, (t) => {
    t.status = 'deleted';
  });

  await sendLog(
    interaction.guild,
    brandEmbed(COLORS.danger)
      .setTitle('🗑️ 티켓 채널 삭제')
      .setDescription(
        `티켓 #${padNumber(ticket.id, LIMITS.numberPadWidth)} 채널이 ${interaction.member} 님에 의해 삭제되었습니다.`,
      ),
  );

  await interaction.reply({ embeds: [successEmbed('채널을 삭제합니다.')] });
  await interaction.channel?.delete();
}
