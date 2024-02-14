import {type EmojiInfo} from 'discord-interactions';
import Bitfield from '../bitfield.js';
import {type RESTClient} from '../rest.js';
import {type Role} from '../discord-types.js';

enum DefaultMessageNotificationLevel {
	ALL_MESSAGES = 0,
	ONLY_MENTIONS = 1,
}

enum ExplicitContentFilterLevel {
	DISABLED = 0,
	MEMBERS_WITHOUT_ROLES = 1,
	ALL_MEMBERS = 2,
}

enum MFALevel {
	NONE = 0,
	ELEVATED = 1,
}

enum VerificationLevel {
	NONE = 0,
	LOW = 1,
	MEDIUM = 2,
	HIGH = 3,
	VERY_HIGH = 4,
}

enum PremiumTier {
	NONE = 0,
	TIER_1 = 1,
	TIER_2 = 2,
	TIER_3 = 3,
}

enum SystemChannelFlag {
	SUPPRESS_JOIN_NOTIFICATIONS = 0,
	SUPPRESS_PREMIUM_SUBSCRIPTIONS = 1,
	SUPPRESS_GUILD_REMINDER_NOTIFICATIONS = 2,
}

enum GuildFeature {
	ANIMATED_ICON = 'ANIMATED_ICON',
	BANNER = 'BANNER',
	COMMERCE = 'COMMERCE',
	COMMUNITY = 'COMMUNITY',
	DISCOVERABLE = 'DISCOVERABLE',
	FEATURABLE = 'FEATURABLE',
	INVITE_SPLASH = 'INVITE_SPLASH',
	MEMBER_VERIFICATION_GATE_ENABLED = 'MEMBER_VERIFICATION_GATE_ENABLED',
	NEWS = 'NEWS',
	PARTNERED = 'PARTNERED',
	PREVIEW_ENABLED = 'PREVIEW_ENABLED',
	VANITY_URL = 'VANITY_URL',
	VERIFIED = 'VERIFIED',
	VIP_REGIONS = 'VIP_REGIONS',
	WELCOME_SCREEN_ENABLED = 'WELCOME_SCREEN_ENABLED',
}

export enum Permission {
	CREATE_INSTANT_INVITE = 0x0_00_00_00_01,
	KICK_MEMBERS = 0x0_00_00_00_02,
	BAN_MEMBERS = 0x0_00_00_00_04,
	ADMINISTRATOR = 0x0_00_00_00_08,
	MANAGE_CHANNELS = 0x0_00_00_00_10,
	MANAGE_GUILD = 0x0_00_00_00_20,
	ADD_REACTIONS = 0x0_00_00_00_40,
	VIEW_AUDIT_LOG = 0x0_00_00_00_80,
	PRIORITY_SPEAKER = 0x0_00_00_01_00,
	STREAM = 0x0_00_00_02_00,
	VIEW_CHANNEL = 0x0_00_00_04_00,
	SEND_MESSAGES = 0x0_00_00_08_00,
	SEND_TTS_MESSAGES = 0x0_00_00_10_00,
	MANAGE_MESSAGES = 0x0_00_00_20_00,
	EMBED_LINKS = 0x0_00_00_40_00,
	ATTACH_FILES = 0x0_00_00_80_00,
	READ_MESSAGE_HISTORY = 0x0_00_01_00_00,
	MENTION_EVERYONE = 0x0_00_02_00_00,
	USE_EXTERNAL_EMOJIS = 0x0_00_04_00_00,
	VIEW_GUILD_INSIGHTS = 0x0_00_08_00_00,
	CONNECT = 0x0_00_10_00_00,
	SPEAK = 0x0_00_20_00_00,
	MUTE_MEMBERS = 0x0_00_40_00_00,
	DEAFEN_MEMBERS = 0x0_00_80_00_00,
	MOVE_MEMBERS = 0x0_01_00_00_00,
	USE_VAD = 0x0_02_00_00_00,
	CHANGE_NICKNAME = 0x0_04_00_00_00,
	MANAGE_NICKNAMES = 0x0_08_00_00_00,
	MANAGE_ROLES = 0x0_10_00_00_00,
	MANAGE_WEBHOOKS = 0x0_20_00_00_00,
	MANAGE_EMOJIS = 0x0_40_00_00_00,
	USE_SLASH_COMMANDS = 0x0_80_00_00_00,
	REQUEST_TO_SPEAK = 0x1_00_00_00_00,
}

export const PermissionNames = {
	0x0_00_00_00_01: 'CREATE_INSTANT_INVITE',
	0x0_00_00_00_02: 'KICK_MEMBERS',
	0x0_00_00_00_04: 'BAN_MEMBERS',
	0x0_00_00_00_08: 'ADMINISTRATOR',
	0x0_00_00_00_10: 'MANAGE_CHANNELS',
	0x0_00_00_00_20: 'MANAGE_GUILD',
	0x0_00_00_00_40: 'ADD_REACTIONS',
	0x0_00_00_00_80: 'VIEW_AUDIT_LOG',
	0x0_00_00_01_00: 'PRIORITY_SPEAKER',
	0x0_00_00_02_00: 'STREAM',
	0x0_00_00_04_00: 'VIEW_CHANNEL',
	0x0_00_00_08_00: 'SEND_MESSAGES',
	0x0_00_00_10_00: 'SEND_TTS_MESSAGES',
	0x0_00_00_20_00: 'MANAGE_MESSAGES',
	0x0_00_00_40_00: 'EMBED_LINKS',
	0x0_00_00_80_00: 'ATTACH_FILES',
	0x0_00_01_00_00: 'READ_MESSAGE_HISTORY',
	0x0_00_02_00_00: 'MENTION_EVERYONE',
	0x0_00_04_00_00: 'USE_EXTERNAL_EMOJIS',
	0x0_00_08_00_00: 'VIEW_GUILD_INSIGHTS',
	0x0_00_10_00_00: 'CONNECT',
	0x0_00_20_00_00: 'SPEAK',
	0x0_00_40_00_00: 'MUTE_MEMBERS',
	0x0_00_80_00_00: 'DEAFEN_MEMBERS',
	0x0_01_00_00_00: 'MOVE_MEMBERS',
	0x0_02_00_00_00: 'USE_VAD',
	0x0_04_00_00_00: 'CHANGE_NICKNAME',
	0x0_08_00_00_00: 'MANAGE_NICKNAMES',
	0x0_10_00_00_00: 'MANAGE_ROLES',
	0x0_20_00_00_00: 'MANAGE_WEBHOOKS',
	0x0_40_00_00_00: 'MANAGE_EMOJIS',
	0x0_80_00_00_00: 'USE_SLASH_COMMANDS',
	0x1_00_00_00_00: 'REQUEST_TO_SPEAK',
};

export type GuildData = {
	system_channel_flags: number;
};

export class Guild {
	id!: string;
	name!: string;
	icon?: string;
	icon_hash?: string;
	splash?: string;
	discovery_splash?: string;
	owner_id!: string;
	region!: string;
	afk_channel_id?: string;
	afk_timeout!: number;
	widget_enabled?: boolean;
	widget_channel_id?: string;
	verification_level!: VerificationLevel;
	default_message_notifications!: DefaultMessageNotificationLevel;
	explicit_content_filter!: ExplicitContentFilterLevel;
	roles!: Role[];
	emojis!: EmojiInfo[];
	mfa_level!: MFALevel;
	application_id?: string;
	system_channel_id?: string;
	system_channel_flags!: Bitfield<SystemChannelFlag>;
	rules_channel_id?: string;
	member_count?: number;
	max_members?: number;
	vanity_url_code?: string;
	description?: string;
	banner?: string;
	features!: GuildFeature[];
	premium_tier!: PremiumTier;
	premium_subscriber_count?: number;
	approximate_member_count?: number;
	nsfw!: boolean;

	constructor(guild: GuildData) {
		Object.assign(this, guild);
		this.system_channel_flags = new Bitfield<SystemChannelFlag>(
			Number(guild.system_channel_flags),
		);
	}

	async createRole(
		role: {
			name?: string;
			premissions?: Permission[];
			color?: number;
			hoist?: boolean;
			mentionable?: boolean;
		},
		rest: RESTClient,
	): Promise<Role> {
		return rest.post(`/guilds/${this.id}/roles`, {
			...role,
			permissions:
				role.premissions && new Bitfield<Permission>(0).apply(role.premissions),
		});
	}
}

export async function fetchGuild(
	id: string,
	rest: RESTClient,
): Promise<Guild | undefined> {
	const guildData = await rest.get<GuildData>(`/guilds/${id}`);
	return guildData ? new Guild(guildData) : undefined;
}
