import {type ExecutionContext} from '@cloudflare/workers-types';
import {type Env} from '../env.js';
import type {Interaction, InteractionResponse} from './interaction.js';

export enum CommandOptionType {
	SubCommand = 1,
	SubCommandGroup = 2,
	String = 3,
	Integer = 4,
	Boolean = 5,
	User = 6,
	Channel = 7,
	Role = 8,
}

export type Command = {
	id?: string;
	application_id?: string;
	name: string;
	description: string;
	options?: CommandOption[];
	default_permission: boolean;
	onInteraction?: (
		interaction: Interaction,
		env: Env,
		context: ExecutionContext,
	) => Promise<InteractionResponse>;
};

export type CommandOption = {
	type: CommandOptionType;
	name: string;
	description: string;
	required?: boolean;
	choices?: CommandOptionChoice[];
	options?: CommandOption[];
};

export type CommandOptionChoice = {
	name: string;
	value: string | number;
};

export type CreateCommandProperties = {
	name: string;
	description: string;
	options?: CommandOption[];
	default_permission?: boolean;
};

export type Component = {
	key: string;
	onInteraction: (interaction: Interaction) => Promise<InteractionResponse>;
};

export type Role = {
	id: string;
	name: string;
	color: number;
	hoist: boolean;
	position: number;
	permissions: string;
	managed: boolean;
	mentionable: boolean;
	tags?: {
		bot_id?: string;
		integration_id?: string;
		premium_subscriber?: boolean;
	};
};

export type User = {
	id: string;
	avatar: string;
	discriminator: string;
	public_flags: number;
	username: string;
};
