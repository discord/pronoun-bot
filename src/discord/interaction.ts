import type { ActionRow, InteractionResponseType } from 'discord-interactions';
import type { Env } from '../env.js';
import { CommandOptionType, type User } from './discord-types.js';
import type Member from './models/member.js';
import type { RESTClient } from './rest.js';

export type InteractionData = {
	id: string;
	custom_id: string;
	name?: string;
	options?: unknown[];
	user?: User;
	resolved?: {
		users?: unknown;
		members?: unknown;
		roles?: unknown;
		channel?: unknown;
	};
};

export type InteractionPayload = {
	app_permissions: string;
	application_id: string;
	channel_id: string;
	data: {
		id: string;
		name: string;
		type: number;
		component_type?: unknown;
		custom_id: string;
		values?: string[];
		components?: unknown[];
		options: Array<{
			name: string;
			type: number;
			options: Array<{
				type: number;
				name: string;
				value: string;
			}>;
		}>;
	};
	entitlement_sku_ids?: string[];
	guild_id: string;
	guild_locale: string;
	id: string;
	locale: string;
	member: {
		avatar?: string | undefined;
		communication_disabled_until?: string;
		deaf: boolean;
		flags?: number;
		is_pending: boolean;
		joined_at: string;
		mute: boolean;
		nick?: string;
		pending: boolean;
		permissions: number;
		premium_since?: string;
		roles: number[];
		user: {
			avatar: string;
			avatar_decoration?: string;
			discriminator: number;
			id: string;
			public_flags: number;
			username: string;
		};
	};
	message?: {
		application_id: string;
		attachments: string[];
		author: {
			avatar?: string;
			avatar_decoration?: string;
			bot: boolean;
			discriminator: number;
			id: string;
			public_flags: number;
			username: string;
		};
		channel_id: string;
		components: unknown[];
		content?: string;
		edited_timestamp?: string;
		embeds: Embed[];
		flags: number;
		id: string;
		interaction: {
			id: string;
			name: string;
			type: number;
			user: {
				avatar: string;
				avatar_decoration?: string;
				discriminator: number;
				id: string;
				public_flags: number;
				username: string;
			};
		};
		mention_everyone: false;
		mention_roles: string[];
		mentions: string[];
		pinned: false;
		timestamp: string;
		tts: boolean;
		type: number;
		webhook_id: string;
	};
	token: string;
	type: number;
	version: number;
};

export type Interaction = {
	application_id: string;
	channel_id: string;
	guild_id: string;
	id: string;
	data: InteractionData;
	options?: InteractionOptions;
	member: Member;
	token: string;
	type: number;
	version: number;
	env: Env;
	client: RESTClient;
};

export type EmbedImage = {
	url: string;
	proxy_url?: string;
	height?: number;
	width?: number;
};

export type EmbedAuthor = {
	name: string; // String	name of author
	url?: string; // 	String	url of author
	icon_url?: string; // String	url of author icon (only supports http(s) and attachments)
	proxy_icon_url?: string; //	String	a proxied url of author icon
};

export type EmbedField = {
	name: string; //	Name of the field
	value: string; //	Value of the field
	inline?: boolean; // Whether or not this field should display inline
};

export type Embed = {
	title?: string; // Title of embed
	type?: string; //	Type of embed (always rich for webhook embeds)
	description?: string; // Description of embed
	url?: string; // Url of embed
	timestamp?: string; // ISO8601 timestamp of embed content
	color?: number; //	Integer	color code of the embed
	footer?: {
		text?: string;
		icon_url?: string;
		proxy_icon_url?: string;
	};
	image?: EmbedImage;
	thumbnail?: EmbedImage;
	video?: EmbedImage;
	provider?: {
		name?: string;
		url?: string;
	};
	author?: EmbedAuthor; //	Embed author object	author information
	fields?: EmbedField[]; //	Array of embed field objects	fields information
};

export type InteractionResponseData = {
	tts?: boolean;
	content?: string;
	embeds?: Embed[];
	components?: ActionRow[];
	allowed_mentions?: {
		parse?: string[];
		roles?: string[];
		users?: string[];
		replied_user?: boolean;
	};
	flags?: number;
};

export type InteractionResponse = {
	type: InteractionResponseType;
	data?: InteractionResponseData;
};

export type InteractionOption = {
	name: string;
	type: CommandOptionType;
	value: unknown;
	options?: InteractionOption[];
};

export class InteractionOptions {
	subCommandName?: string;
	map: Map<string, InteractionOption | InteractionOptions>;

	constructor(options?: InteractionOption[]) {
		if (options === undefined) {
			this.map = new Map();
			return;
		}

		const options_: Array<[string, InteractionOption | InteractionOptions]> =
			options.map((option) => {
				if (
					[
						CommandOptionType.SubCommand,
						CommandOptionType.SubCommandGroup,
					].includes(option.type)
				) {
					this.subCommandName = option.name;
					return [option.name, new InteractionOptions(option.options)];
				}

				return [option.name, option];
			});
		this.map = new Map(options_);
	}

	has(key: string): boolean {
		return this.map.has(key);
	}

	get<T>(key: string): T {
		const option = this.map.get(key);
		if (option instanceof InteractionOptions) {
			return option as T;
		}

		return option?.value as T;
	}
}

export type UpdateWebhookOptions = {
	interaction: Interaction;
	message: InteractionResponseData;
};

export async function updateWebhook(options: UpdateWebhookOptions) {
	const url = `/webhooks/${options.interaction.application_id}/${options.interaction.token}`;
	await options.interaction.client.post(url, options.message);
}
