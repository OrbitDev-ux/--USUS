import type { AutomodRuleKey } from '../config/automodSchema';
import type { ChannelSettingKey, FeatureKey, RoleSettingKey } from '../config/settingsSchema';

export interface GuildSettings {
  channels: Record<ChannelSettingKey, string | null>;
  roles: Record<RoleSettingKey, string | null>;
  features: Record<FeatureKey, boolean>;
  automod: Record<AutomodRuleKey, boolean>;
  messages: {
    welcome: string;
    farewell: string;
  };
}

export interface SettingsData {
  guilds: Record<string, GuildSettings>;
}
