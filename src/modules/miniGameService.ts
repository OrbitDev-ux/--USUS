import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type MessageActionRowComponentBuilder } from 'discord.js';
import { COLORS, ComponentId } from '../config/constants';
import { brandEmbed } from '../utils/embeds';
import { withArgs } from '../utils/ids';

// ─── 가위바위보 ───────────────────────────────────────────────

export type RpsChoice = 'rock' | 'scissors' | 'paper';
export type RpsResult = 'win' | 'lose' | 'draw';

interface RpsChoiceDef {
  readonly label: string;
  readonly emoji: string;
  /** 이 선택이 이기는 상대 선택 */
  readonly beats: RpsChoice;
}

const RPS_DEFS: Record<RpsChoice, RpsChoiceDef> = {
  rock: { label: '바위', emoji: '🪨', beats: 'scissors' },
  scissors: { label: '가위', emoji: '✂️', beats: 'paper' },
  paper: { label: '보', emoji: '📄', beats: 'rock' },
};

const RPS_CHOICES: readonly RpsChoice[] = ['rock', 'scissors', 'paper'];

export function isRpsChoice(value: string): value is RpsChoice {
  return value in RPS_DEFS;
}

export function randomRpsChoice(): RpsChoice {
  return RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)] as RpsChoice;
}

export function judgeRps(user: RpsChoice, bot: RpsChoice): RpsResult {
  if (user === bot) {
    return 'draw';
  }
  return RPS_DEFS[user].beats === bot ? 'win' : 'lose';
}

export function buildRpsPromptEmbed() {
  return brandEmbed(COLORS.primary).setTitle('✊✌️✋ 가위바위보').setDescription('낼 것을 선택하세요!');
}

export function buildRpsChoiceRow(ownerId: string): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    ...RPS_CHOICES.map((choice) =>
      new ButtonBuilder()
        .setCustomId(withArgs(ComponentId.gameRpsChoice, choice, ownerId))
        .setLabel(RPS_DEFS[choice].label)
        .setEmoji(RPS_DEFS[choice].emoji)
        .setStyle(ButtonStyle.Secondary),
    ),
  );
}

export function buildRpsReplayRow(ownerId: string): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(withArgs(ComponentId.gameRpsReplay, ownerId))
      .setLabel('다시 하기')
      .setEmoji('🔁')
      .setStyle(ButtonStyle.Primary),
  );
}

export function buildRpsResultEmbed(userChoice: RpsChoice, botChoice: RpsChoice, result: RpsResult) {
  const resultDef: Record<RpsResult, { text: string; color: number }> = {
    win: { text: '🎉 승리!', color: COLORS.success },
    lose: { text: '😢 패배', color: COLORS.danger },
    draw: { text: '🤝 무승부', color: COLORS.neutral },
  };
  const { text, color } = resultDef[result];
  return brandEmbed(color)
    .setTitle('✊✌️✋ 가위바위보 결과')
    .setDescription(
      `나: ${RPS_DEFS[userChoice].emoji} ${RPS_DEFS[userChoice].label}\n` +
        `봇: ${RPS_DEFS[botChoice].emoji} ${RPS_DEFS[botChoice].label}\n\n**${text}**`,
    );
}

// ─── 주사위 ───────────────────────────────────────────────

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const DICE_MIN = 1;
const DICE_MAX = 6;

export function rollDice(): number {
  return DICE_MIN + Math.floor(Math.random() * DICE_MAX);
}

export function buildDiceEmbed(value: number) {
  return brandEmbed(COLORS.info)
    .setTitle('🎲 주사위 굴리기')
    .setDescription(`${DICE_FACES[value - 1]}\n\n결과: **${value}**`);
}

export function buildDiceRow(ownerId: string): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(withArgs(ComponentId.gameDiceRoll, ownerId))
      .setLabel('다시 굴리기')
      .setEmoji('🎲')
      .setStyle(ButtonStyle.Primary),
  );
}

// ─── 숫자 맞추기 ───────────────────────────────────────────────

export const GUESS_NUMBER_RANGE = { min: 1, max: 100 } as const;
export const GUESS_MAX_ATTEMPTS = 7;

export const GUESS_MODAL_FIELD = { number: 'number' } as const;

export interface GuessSession {
  readonly secret: number;
  attempts: number;
  readonly maxAttempts: number;
  readonly ownerId: string;
  lastHint: string | null;
}

const guessSessions = new Map<string, GuessSession>();

export function startGuessSession(messageId: string, ownerId: string): GuessSession {
  const range = GUESS_NUMBER_RANGE.max - GUESS_NUMBER_RANGE.min + 1;
  const session: GuessSession = {
    secret: GUESS_NUMBER_RANGE.min + Math.floor(Math.random() * range),
    attempts: 0,
    maxAttempts: GUESS_MAX_ATTEMPTS,
    ownerId,
    lastHint: null,
  };
  guessSessions.set(messageId, session);
  return session;
}

export function getGuessSession(messageId: string): GuessSession | undefined {
  return guessSessions.get(messageId);
}

export function endGuessSession(messageId: string): void {
  guessSessions.delete(messageId);
}

export function buildGuessButtonRow(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ComponentId.gameGuessStart)
      .setLabel('숫자 입력')
      .setEmoji('🔢')
      .setStyle(ButtonStyle.Primary),
  );
}

export function buildGuessEmbed(session: GuessSession, outcome: 'won' | 'lost' | false) {
  if (outcome === 'won') {
    return brandEmbed(COLORS.success)
      .setTitle('🔢 숫자 맞추기 — 정답!')
      .setDescription(`정답은 **${session.secret}**이었습니다. ${session.attempts}번 만에 맞히셨습니다! 🎉`);
  }
  if (outcome === 'lost') {
    return brandEmbed(COLORS.danger)
      .setTitle('🔢 숫자 맞추기 — 실패')
      .setDescription(`아쉽게도 기회를 모두 사용했습니다. 정답은 **${session.secret}**이었습니다.`);
  }
  return brandEmbed(COLORS.primary)
    .setTitle('🔢 숫자 맞추기')
    .setDescription(
      `${GUESS_NUMBER_RANGE.min}~${GUESS_NUMBER_RANGE.max} 사이의 숫자를 ${session.maxAttempts}번 안에 맞혀보세요!\n\n` +
        `시도: ${session.attempts}/${session.maxAttempts}` +
        (session.lastHint !== null ? `\n힌트: ${session.lastHint}` : ''),
    );
}
