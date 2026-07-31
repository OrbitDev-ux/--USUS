import { Events, MessageFlags, type Interaction, type InteractionReplyOptions } from 'discord.js';
import { commandMap, contextMenuCommandMap } from '../commands';
import {
  buttonHandlers,
  channelSelectHandlers,
  modalHandlers,
  roleSelectHandlers,
  stringSelectHandlers,
} from '../components';
import { LIMITS } from '../config/constants';
import { defineEvent, type ComponentHandler } from '../types';
import { getRemainingCooldownMs } from '../utils/cooldown';
import { errorEmbed } from '../utils/embeds';
import { logger } from '../utils/logger';
import { isAdmin } from '../utils/permissions';

const MS_PER_SECOND = 1000;

interface MatchedHandler<I> {
  handler: ComponentHandler<I>;
  args: readonly string[];
}

function matchHandler<I>(
  handlers: readonly ComponentHandler<I>[],
  customId: string,
): MatchedHandler<I> | null {
  for (const handler of handlers) {
    if (customId === handler.prefix) {
      return { handler, args: [] };
    }
    if (customId.startsWith(`${handler.prefix}:`)) {
      return { handler, args: customId.slice(handler.prefix.length + 1).split(':') };
    }
  }
  return null;
}

async function dispatch<I extends { customId: string }>(
  handlers: readonly ComponentHandler<I>[],
  interaction: I,
): Promise<void> {
  const matched = matchHandler(handlers, interaction.customId);
  if (matched !== null) {
    await matched.handler.execute(interaction, matched.args);
  }
}

async function safeReplyError(interaction: Interaction): Promise<void> {
  if (!interaction.isRepliable()) {
    return;
  }
  const payload: InteractionReplyOptions = {
    embeds: [errorEmbed('요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')],
    flags: MessageFlags.Ephemeral,
  };
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch {
    // 이미 만료된 인터랙션 등 응답 불가 상황은 무시한다.
  }
}

async function routeInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.inCachedGuild()) {
    if (interaction.isRepliable()) {
      await interaction.reply({
        embeds: [errorEmbed('이 봇은 서버 안에서만 사용할 수 있습니다.')],
        flags: MessageFlags.Ephemeral,
      });
    }
    return;
  }

  if (interaction.isChatInputCommand()) {
    const command = commandMap.get(interaction.commandName);
    if (command === undefined) {
      await interaction.reply({
        embeds: [errorEmbed('알 수 없는 명령어입니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (command.adminOnly === true && !isAdmin(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('서버 관리 권한이 필요합니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await command.execute(interaction);
    return;
  }

  if (interaction.isUserContextMenuCommand()) {
    const command = contextMenuCommandMap.get(interaction.commandName);
    if (command === undefined) {
      await interaction.reply({
        embeds: [errorEmbed('알 수 없는 명령어입니다.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await command.execute(interaction);
    return;
  }

  if (interaction.isButton()) {
    const matched = matchHandler(buttonHandlers, interaction.customId);
    if (matched === null) {
      return;
    }
    const cooldownKey = `${interaction.user.id}:${matched.handler.prefix}`;
    const remaining = getRemainingCooldownMs(cooldownKey, LIMITS.buttonCooldownMs);
    if (remaining > 0) {
      await interaction.reply({
        embeds: [errorEmbed(`잠시 후 다시 시도해 주세요. (${Math.ceil(remaining / MS_PER_SECOND)}초)`)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await matched.handler.execute(interaction, matched.args);
    return;
  }

  if (interaction.isStringSelectMenu()) {
    await dispatch(stringSelectHandlers, interaction);
    return;
  }
  if (interaction.isChannelSelectMenu()) {
    await dispatch(channelSelectHandlers, interaction);
    return;
  }
  if (interaction.isRoleSelectMenu()) {
    await dispatch(roleSelectHandlers, interaction);
    return;
  }
  if (interaction.isModalSubmit()) {
    await dispatch(modalHandlers, interaction);
  }
}

export const interactionCreateEvent = defineEvent({
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      await routeInteraction(interaction);
    } catch (error) {
      logger.error('인터랙션 처리 중 오류', error);
      await safeReplyError(interaction);
    }
  },
});
