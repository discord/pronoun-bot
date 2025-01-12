import type { MessageComponent } from 'discord-interactions';
import type { User } from '../discord-types.js';
import type { Embed } from '../interaction.js';

export enum MessageType {
	DEFAULT = 0,
	RECIPIENT_ADD = 1,
	RECIPIENT_REMOVE = 2,
	CALL = 3,
	CHANNEL_NAME_CHANGE = 4,
	CHANNEL_ICON_CHANGE = 5,
	CHANNEL_PINNED_MESSAGE = 6,
	GUILD_MEMBER_JOIN = 7,
	USER_PREMIUM_GUILD_SUBSCRIPTION = 8,
	USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1 = 9,
	USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2 = 10,
	USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3 = 11,
	CHANNEL_FOLLOW_ADD = 12,
	GUILD_DISCOVERY_DISQUALIFIED = 14,
	GUILD_DISCOVERY_REQUALIFIED = 15,
	GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING = 16,
	GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING = 17,
	THREAD_CREATED = 18,
	REPLY = 19,
	APPLICATION_COMMAND = 20,
	THREAD_STARTER_MESSAGE = 21,
	GUILD_INVITE_REMINDER = 22,
}

export enum MessageFlag {
	CROSSPOSTED = 0,
	IS_CROSSPOST = 1,
	SUPPRESS_EMBEDS = 2,
	SOURCE_MESSAGE_DELETED = 3,
	URGENT = 4,
	HAS_THREAD = 5,
	EPHEMERAL = 6,
	LOADING = 7,
}

export type Message = {
	id: string;
	channel_id?: string;
	guild_id?: string;
	author?: User;
	content?: string;
	timestamp?: Date;
	edited_timestamp: Date | undefined;
	embeds: Embed[];
	attachments: unknown[];
	pinned: boolean;
	tts: boolean;
	mention_everyone: boolean;
	mention_roles: string[];
	mentions: string[];
	webhook_id?: string;
	type: MessageType;
	flags: number;
};

export type CreateMessageParameters = {
	content?: string; //	Message contents (up to 2000 characters)
	nonce?: string; //	Integer or string	Can be used to verify a message was sent (up to 25 characters). Value will appear in the Message Create event.
	tts?: boolean; //	True if this is a TTS message
	embeds?: Embed[]; //	Array of embed objects	Up to 10 rich embeds (up to 6000 characters)
	allowed_mentions?: boolean; //	Allowed mention object	Allowed mentions for the message
	message_reference?: undefined; //	Message reference	Include to make your message a reply
	components?: MessageComponent[]; //	Array of message component objects	Components to include with the message
	sticker_ids?: string[]; //	Array of snowflakes	IDs of up to 3 stickers in the server to send in the message
	payload_json?: string; //	JSON-encoded body of non-file params, only for multipart/form-data requests. See Uploading Files
	flags?: number; //	Integer	Message flags combined as a bitfield (only SUPPRESS_EMBEDS and SUPPRESS_NOTIFICATIONS can be set)
};

// This.flags = new Bitfield<MessageFlag>(props.flags);
