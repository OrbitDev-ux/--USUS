import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { COLORS, ComponentId } from '../../config/constants';
import { GUESS_MAX_ATTEMPTS, GUESS_NUMBER_RANGE } from '../../modules/miniGameService';
import type { PrefixCommand } from '../../types';
import { brandEmbed } from '../../utils/embeds';
import { withArgs } from '../../utils/ids';

export const MINIGAME_MENU_VALUE = {
  rps: 'rps',
  dice: 'dice',
  guess: 'guess',
} as const;

export const minigameCommand: PrefixCommand = {
  name: '미니게임',
  description: '가위바위보·주사위·숫자맞추기를 즐깁니다',
  async execute(message) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(withArgs(ComponentId.gameMenu, message.author.id))
      .setPlaceholder('즐길 게임을 선택하세요')
      .addOptions(
        {
          label: '가위바위보',
          description: '봇과 가위바위보 대결',
          value: MINIGAME_MENU_VALUE.rps,
          emoji: '✊',
        },
        {
          label: '주사위 굴리기',
          description: `${1}~${6} 랜덤 주사위`,
          value: MINIGAME_MENU_VALUE.dice,
          emoji: '🎲',
        },
        {
          label: '숫자 맞추기',
          description: `${GUESS_NUMBER_RANGE.min}~${GUESS_NUMBER_RANGE.max} 숫자를 ${GUESS_MAX_ATTEMPTS}번 안에 맞혀보세요`,
          value: MINIGAME_MENU_VALUE.guess,
          emoji: '🔢',
        },
      );

    await message.reply({
      embeds: [
        brandEmbed(COLORS.primary)
          .setTitle('🎮 미니게임')
          .setDescription('아래 메뉴에서 즐길 게임을 선택해 주세요.'),
      ],
      components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
    });
  },
};
