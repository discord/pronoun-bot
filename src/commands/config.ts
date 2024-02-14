import {InteractionResponseType} from 'discord-interactions';
import {type Command, CommandOptionType} from '../discord/discord-types.js';
import {
	type Interaction,
	type InteractionOptions,
	type InteractionResponse,
} from '../discord/interaction.js';
import {Permission} from '../discord/models/guild.js';
import GuildConfigStore, {
	defaultConfig,
	type GuildConfigPicker,
	type GuildConfig,
} from '../guild-config-store.js';
import PermissionPrompt from '../permission-prompt.js';
import {FetchError, type RESTClient} from '../discord/rest.js';
import {getMessageData, validateRoles} from './prompt.js';

export async function updatePrompts(
	config: GuildConfig,
	rest: RESTClient,
): Promise<void> {
	const updatedMessage = getMessageData(config);
	const pickersToRemove: GuildConfigPicker[] = [];
	for (const picker of config.pickers.filter(
		(m) => m.c !== undefined && m.m !== undefined,
	)) {
		try {
			await rest.patch(
				`/channels/${picker.c}/messages/${picker.m}`,
				updatedMessage,
			);
		} catch (error_: unknown) {
			if (error_ instanceof FetchError && error_.response.status === 404) {
				// The message was deleted, so remove it from the config
				pickersToRemove.push(picker);
			} else {
				const error = error_ as Error;
				error.message = `Failed to update prompt message: ${error.message}`;
				console.error(error);
			}
		}
	}

	// Shed the pickers that were removed
	if (pickersToRemove.length > 0) {
		config.pickers = config.pickers.filter((x) => !pickersToRemove.includes(x));
	}
}

async function edit(
	interaction: Interaction,
	config: GuildConfig,
	options: InteractionOptions,
): Promise<InteractionResponse> {
	if (options.has('use-roles')) {
		config.useRoles = options.get<boolean>('use-roles');
	}

	if (options.has('prompt-message')) {
		config.promptMessage = options.get<string>('prompt-message').slice(0, 500);
		if (options.get<string>('prompt-message').length > 500)
			config.promptMessage += '...';
	}

	// Make sure any new pronouns get assigned a role
	await validateRoles(interaction);
	await updatePrompts(config, interaction.client);
	await GuildConfigStore.save(interaction.guild_id, config, interaction.env);
	return {
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
			content: ':white_check_mark: Your config has been updated.',
			flags: 64,
		},
	};
}

async function view(
	isAuthed: boolean,
	config: GuildConfig,
): Promise<InteractionResponse> {
	let description =
		'This is the current configuration of the bot in this server.';
	if (isAuthed) {
		description += ' To change any of these, use the `/config edit` command.';
	}

	description += '\n\n**Display pronouns**\n';
	description += config.useRoles ? 'Using roles' : 'Using nicknames';
	description += '\n\n**Configuration permissions**\n';
	description += config.onlyOwnerCanConfig
		? 'Only the owner can change the configuration.'
		: 'Anyone with the appropriate role permissions can change the configuration.';
	description += '\n\n**Prompt message**\n```';
	description += config.promptMessage + '```';
	return {
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
			embeds: [
				{
					title: 'Current configuration',
					description,
				},
			],
			flags: 64,
		},
	};
}

async function reset(
	interaction: Interaction,
	config: GuildConfig,
	options: InteractionOptions,
): Promise<InteractionResponse> {
	const permissionsError = await PermissionPrompt(interaction, [
		Permission.MANAGE_GUILD,
		Permission.MANAGE_MESSAGES,
		Permission.MANAGE_ROLES,
	]);
	switch (options.get('option')) {
		case 'use-roles': {
			config.useRoles = defaultConfig.useRoles;
			break;
		}

		case 'owner-only': {
			if (permissionsError) return permissionsError;
			config.onlyOwnerCanConfig = defaultConfig.onlyOwnerCanConfig;
			break;
		}

		case 'prompt-message': {
			config.promptMessage = defaultConfig.promptMessage;
			break;
		}

		case 'all': {
			if (!permissionsError)
				config.onlyOwnerCanConfig = defaultConfig.onlyOwnerCanConfig;
			config.promptMessage = defaultConfig.promptMessage;
			config.useRoles = defaultConfig.useRoles;
			break;
		}

		default: {
			throw new Error('unknown option');
		}
	}

	await validateRoles(interaction);
	await updatePrompts(config, interaction.client);
	await GuildConfigStore.save(interaction.guild_id, config, interaction.env);

	return {
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
			content: ':white_check_mark: Your config has been updated.',
			flags: 64,
		},
	};
}

const command: Command = {
	name: 'config',
	description: 'Configure pronoun picker',
	default_permission: true,
	options: [
		{
			name: 'edit',
			description: 'Edit a configuration value',
			type: CommandOptionType.SubCommand,
			options: [
				{
					name: 'use-roles',
					description:
						'Whether to use roles or nicknames to display selected pronouns (default: True)',
					type: CommandOptionType.Boolean,
				},
				{
					name: 'owner-only',
					description:
						'If false, anyone with the appropriate role permissions can use commands (default: True)',
					type: CommandOptionType.Boolean,
				},
				{
					name: 'prompt-message',
					description: 'The message to display in pronoun prompts',
					type: CommandOptionType.String,
				},
			],
		},
		{
			name: 'view',
			description: 'View the current configuration',
			type: CommandOptionType.SubCommand,
		},
		{
			name: 'reset',
			description: 'Reset a configuration option to its default setting',
			type: CommandOptionType.SubCommand,
			options: [
				{
					name: 'option',
					description: 'The option to reset',
					type: CommandOptionType.String,
					required: true,
					choices: [
						{name: 'all', value: 'all'},
						{name: 'use-roles', value: 'use-roles'},
						{name: 'owner-only', value: 'owner-only'},
						{name: 'prompt-message', value: 'prompt-message'},
					],
				},
			],
		},
	],
	async onInteraction(interaction, env) {
		if (!interaction.options) {
			throw new Error('No options available on interaction.');
		}

		const config = await GuildConfigStore.get(interaction.guild_id, env);
		const action = interaction.options.subCommandName!;

		const permissionsError = await PermissionPrompt(interaction, [
			Permission.MANAGE_GUILD,
			Permission.MANAGE_ROLES,
		]);
		if (action === 'view') return view(permissionsError === undefined, config);
		if (permissionsError) return permissionsError;

		switch (action) {
			case 'edit': {
				const response = edit(
					interaction,
					config,
					interaction.options.get(action),
				);
				return response;
			}

			case 'reset': {
				const response = await reset(
					interaction,
					config,
					interaction.options.get(action),
				);
				return response;
			}

			default: {
				throw new Error('unknown action');
			}
		}
	},
};

export default command;
