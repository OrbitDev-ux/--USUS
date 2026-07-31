import type { Message } from 'discord.js';
import { AUTOMOD_THRESHOLDS, type AutomodRuleKey } from '../config/automodSchema';
import { PROFANITY_WORDS } from '../config/profanityList';

const URL_PATTERN = /https?:\/\/\S+/i;
const INVITE_PATTERN = /(discord\.gg|discord(?:app)?\.com\/invite)\/\S+/i;
const MENTION_PATTERN = /<@!?\d+>/g;
const PICTOGRAPHIC_EMOJI_PATTERN = /\p{Extended_Pictographic}/gu;
const CUSTOM_EMOJI_PATTERN = /<a?:\w+:\d+>/g;
const LETTER_PATTERN = /[a-zA-Z가-힣]/g;
const UPPERCASE_LETTER_PATTERN = /[A-Z]/g;

interface UserActivity {
  spamTimestamps: number[];
  lastContent: string;
  repeatCount: number;
  repeatAt: number;
}

const activityByKey = new Map<string, UserActivity>();

function getActivity(key: string): UserActivity {
  let activity = activityByKey.get(key);
  if (activity === undefined) {
    activity = { spamTimestamps: [], lastContent: '', repeatCount: 0, repeatAt: 0 };
    activityByKey.set(key, activity);
  }
  return activity;
}

function containsProfanity(content: string): boolean {
  const lower = content.toLowerCase();
  return PROFANITY_WORDS.some((word) => lower.includes(word.toLowerCase()));
}

function isSpamming(activity: UserActivity, now: number): boolean {
  activity.spamTimestamps.push(now);
  activity.spamTimestamps = activity.spamTimestamps.filter(
    (t) => now - t <= AUTOMOD_THRESHOLDS.spamWindowMs,
  );
  return activity.spamTimestamps.length >= AUTOMOD_THRESHOLDS.spamCount;
}

function isRepeating(activity: UserActivity, content: string, now: number): boolean {
  const trimmed = content.trim();
  if (trimmed === '' ) {
    return false;
  }
  if (trimmed === activity.lastContent && now - activity.repeatAt <= AUTOMOD_THRESHOLDS.repeatWindowMs) {
    activity.repeatCount += 1;
  } else {
    activity.repeatCount = 1;
  }
  activity.lastContent = trimmed;
  activity.repeatAt = now;
  return activity.repeatCount >= AUTOMOD_THRESHOLDS.repeatCount;
}

function hasMentionSpam(content: string): boolean {
  const matches = content.match(MENTION_PATTERN);
  return (matches?.length ?? 0) >= AUTOMOD_THRESHOLDS.mentionSpamCount;
}

function hasMassEmoji(content: string): boolean {
  const pictographic = content.match(PICTOGRAPHIC_EMOJI_PATTERN)?.length ?? 0;
  const custom = content.match(CUSTOM_EMOJI_PATTERN)?.length ?? 0;
  return pictographic + custom >= AUTOMOD_THRESHOLDS.massEmojiCount;
}

function hasExcessiveCaps(content: string): boolean {
  const letters = content.match(LETTER_PATTERN) ?? [];
  if (letters.length < AUTOMOD_THRESHOLDS.capsLockMinLength) {
    return false;
  }
  const uppercase = content.match(UPPERCASE_LETTER_PATTERN)?.length ?? 0;
  return uppercase / letters.length >= AUTOMOD_THRESHOLDS.capsLockRatio;
}

/** 활성화된 규칙 중 처음 위반한 규칙을 반환한다. 없으면 null. */
export function detectViolation(
  message: Message<true>,
  enabledRules: Readonly<Record<AutomodRuleKey, boolean>>,
): AutomodRuleKey | null {
  const content = message.content;
  const key = `${message.guildId}:${message.author.id}`;
  const now = Date.now();

  if (enabledRules.invite && INVITE_PATTERN.test(content)) {
    return 'invite';
  }
  if (enabledRules.link && URL_PATTERN.test(content) && !INVITE_PATTERN.test(content)) {
    return 'link';
  }
  if (enabledRules.profanity && containsProfanity(content)) {
    return 'profanity';
  }
  if (enabledRules.mentionSpam && hasMentionSpam(content)) {
    return 'mentionSpam';
  }
  if (enabledRules.massEmoji && hasMassEmoji(content)) {
    return 'massEmoji';
  }
  if (enabledRules.capsLock && hasExcessiveCaps(content)) {
    return 'capsLock';
  }

  const activity = getActivity(key);
  if (enabledRules.repeat && isRepeating(activity, content, now)) {
    return 'repeat';
  }
  if (enabledRules.spam && isSpamming(activity, now)) {
    return 'spam';
  }

  return null;
}
