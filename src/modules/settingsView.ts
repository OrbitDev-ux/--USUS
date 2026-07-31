import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ModalBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  type EmbedBuilder,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import { AUTOMOD_RULE_DEFS, AUTOMOD_RULE_KEYS } from '../config/automodSchema';
import { COLORS, ComponentId } from '../config/constants';
import {
  CHANNEL_SETTING_DEFS,
  CHANNEL_SETTING_KEYS,
  FEATURE_DEFS,
  FEATURE_KEYS,
  ROLE_SETTING_DEFS,
  ROLE_SETTING_KEYS,
  type ChannelSettingKey,
  type RoleSettingKey,
} from '../config/settingsSchema';
import type { GuildSettings } from '../types';
import { brandEmbed } from '../utils/embeds';
import { withArgs } from '../utils/ids';

const AUTOMOD_BUTTONS_PER_ROW = 5;

export const SETTINGS_MENU_VALUE = {
  channelPrefix: 'channel',
  rolePrefix: 'role',
  features: 'features',
  automod: 'automod',
  messages: 'messages',
} as const;

export const SETTINGS_MESSAGE_FIELD = {
  welcome: 'welcome',
  farewell: 'farewell',
} as const;

const UNSET = '`미설정`';
const MAX_MESSAGE_TEMPLATE_LENGTH = 500;

export interface ViewMessage {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
}

function row(component: MessageActionRowComponentBuilder): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(component);
}

function backButtonRow(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return row(
    new ButtonBuilder()
      .setCustomId(ComponentId.settingsBack)
      .setLabel('← 설정으로 돌아가기')
      .setStyle(ButtonStyle.Secondary),
  );
}

export function buildSettingsOverview(settings: GuildSettings): ViewMessage {
  const channelLines = CHANNEL_SETTING_KEYS.map((key) => {
    const value = settings.channels[key];
    return `**${CHANNEL_SETTING_DEFS[key].label}**: ${value !== null ? `<#${value}>` : UNSET}`;
  });
  const roleLines = ROLE_SETTING_KEYS.map((key) => {
    const value = settings.roles[key];
    return `**${ROLE_SETTING_DEFS[key].label}**: ${value !== null ? `<@&${value}>` : UNSET}`;
  });
  const featureLines = FEATURE_KEYS.map(
    (key) => `**${FEATURE_DEFS[key].label}**: ${settings.features[key] ? '🟢 ON' : '🔴 OFF'}`,
  );
  const automodOnCount = AUTOMOD_RULE_KEYS.filter((key) => settings.automod[key]).length;

  const embed = brandEmbed(COLORS.primary)
    .setTitle('⚙️ 서버 설정')
    .setDescription('아래 메뉴에서 변경할 항목을 선택해 주세요.')
    .addFields(
      { name: '📺 채널', value: channelLines.join('\n') },
      { name: '🎭 역할', value: roleLines.join('\n') },
      { name: '🧩 기능', value: featureLines.join('\n') },
      { name: '🛡️ 오토모드', value: `${automodOnCount}/${AUTOMOD_RULE_KEYS.length}개 활성화` },
    );

  const menu = new StringSelectMenuBuilder()
    .setCustomId(ComponentId.settingsMenu)
    .setPlaceholder('변경할 설정 항목 선택')
    .addOptions(
      ...CHANNEL_SETTING_KEYS.map((key) => ({
        label: CHANNEL_SETTING_DEFS[key].label,
        description: CHANNEL_SETTING_DEFS[key].description,
        value: withArgs(SETTINGS_MENU_VALUE.channelPrefix, key),
        emoji: '📺',
      })),
      ...ROLE_SETTING_KEYS.map((key) => ({
        label: ROLE_SETTING_DEFS[key].label,
        description: ROLE_SETTING_DEFS[key].description,
        value: withArgs(SETTINGS_MENU_VALUE.rolePrefix, key),
        emoji: '🎭',
      })),
      {
        label: '기능 ON/OFF',
        description: '환영 메시지, 메시지 로그 등 기능 켜기/끄기',
        value: SETTINGS_MENU_VALUE.features,
        emoji: '🧩',
      },
      {
        label: '오토모드 ON/OFF',
        description: '욕설·도배·링크 등 자동 감지·제재 규칙 켜기/끄기',
        value: SETTINGS_MENU_VALUE.automod,
        emoji: '🛡️',
      },
      {
        label: '환영·퇴장 메시지 편집',
        description: '{user} {server} {memberCount} 변수를 사용할 수 있습니다',
        value: SETTINGS_MENU_VALUE.messages,
        emoji: '💬',
      },
    );

  return { embeds: [embed], components: [row(menu)] };
}

export function buildChannelSelectView(key: ChannelSettingKey): ViewMessage {
  const def = CHANNEL_SETTING_DEFS[key];
  const select = new ChannelSelectMenuBuilder()
    .setCustomId(withArgs(ComponentId.settingsChannel, key))
    .setPlaceholder(`${def.label} 선택`)
    .setChannelTypes(...def.channelTypes);

  return {
    embeds: [brandEmbed(COLORS.info).setTitle(`📺 ${def.label} 설정`).setDescription(def.description)],
    components: [row(select), backButtonRow()],
  };
}

export function buildRoleSelectView(key: RoleSettingKey): ViewMessage {
  const def = ROLE_SETTING_DEFS[key];
  const select = new RoleSelectMenuBuilder()
    .setCustomId(withArgs(ComponentId.settingsRole, key))
    .setPlaceholder(`${def.label} 선택`);

  return {
    embeds: [brandEmbed(COLORS.info).setTitle(`🎭 ${def.label} 설정`).setDescription(def.description)],
    components: [row(select), backButtonRow()],
  };
}

export function buildFeaturesView(settings: GuildSettings): ViewMessage {
  const toggleRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    ...FEATURE_KEYS.map((key) =>
      new ButtonBuilder()
        .setCustomId(withArgs(ComponentId.settingsToggle, key))
        .setLabel(`${FEATURE_DEFS[key].label}: ${settings.features[key] ? 'ON' : 'OFF'}`)
        .setStyle(settings.features[key] ? ButtonStyle.Success : ButtonStyle.Secondary),
    ),
  );

  return {
    embeds: [
      brandEmbed(COLORS.info)
        .setTitle('🧩 기능 설정')
        .setDescription('버튼을 눌러 기능을 켜거나 끌 수 있습니다.'),
    ],
    components: [toggleRow, backButtonRow()],
  };
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export function buildAutomodView(settings: GuildSettings): ViewMessage {
  const toggleRows = chunk(AUTOMOD_RULE_KEYS, AUTOMOD_BUTTONS_PER_ROW).map((keys) =>
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      ...keys.map((key) =>
        new ButtonBuilder()
          .setCustomId(withArgs(ComponentId.settingsAutomodToggle, key))
          .setLabel(`${AUTOMOD_RULE_DEFS[key].label}: ${settings.automod[key] ? 'ON' : 'OFF'}`)
          .setStyle(settings.automod[key] ? ButtonStyle.Success : ButtonStyle.Secondary),
      ),
    ),
  );

  return {
    embeds: [
      brandEmbed(COLORS.info)
        .setTitle('🛡️ 오토모드 설정')
        .setDescription('버튼을 눌러 자동 감지·제재 규칙을 켜거나 끌 수 있습니다.'),
    ],
    components: [...toggleRows, backButtonRow()],
  };
}

export function buildMessagesModal(settings: GuildSettings): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(ComponentId.settingsMessagesModal)
    .setTitle('환영·퇴장 메시지 편집')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(SETTINGS_MESSAGE_FIELD.welcome)
          .setLabel('환영 메시지 ({user} {server} {memberCount})')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(MAX_MESSAGE_TEMPLATE_LENGTH)
          .setValue(settings.messages.welcome)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(SETTINGS_MESSAGE_FIELD.farewell)
          .setLabel('퇴장 메시지 ({user} {server} {memberCount})')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(MAX_MESSAGE_TEMPLATE_LENGTH)
          .setValue(settings.messages.farewell)
          .setRequired(true),
      ),
    );
}
