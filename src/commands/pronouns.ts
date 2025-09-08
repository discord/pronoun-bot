import { type EmojiInfo, InteractionResponseType } from 'discord-interactions';
import EmojiRegex from 'emoji-regex';
import { type Command, CommandOptionType } from '../discord/discord-types.js';
import type {
	Interaction,
	InteractionOptions,
	InteractionResponse,
} from '../discord/interaction.js';
import { fetchGuild, type Guild, Permission } from '../discord/models/guild.js';
import type { Env } from '../env.js';
import GuildConfigStore, {
	defaultConfig,
	type GuildConfig,
	type GuildPronouns,
} from '../guild-config-store.js';
import PermissionPrompt from '../permission-prompt.js';
import RoleStore from '../role-store.js';
import { updatePrompts } from './config.js';

const emojiregex = EmojiRegex();

type PronounObject = {
	name: string;
	emoji?: EmojiInfo;
	role?: string;
};

function createPronounObject(
	interaction: Interaction,
	name: string,
): PronounObject {
	if (!interaction.options) {
		throw new Error('options unavailable');
	}

	const pronoun: PronounObject = { name };

	if (
		(interaction.options.has('add') &&
			interaction.options.get<InteractionOptions>('add').has('emoji')) ||
		(interaction.options.has('emoji') &&
			interaction.options.get<InteractionOptions>('emoji').has('emoji'))
	) {
		const emojiOption = (
			interaction.options.has('add')
				? interaction.options.get<InteractionOptions>('add')
				: interaction.options.get<InteractionOptions>('emoji')
		).get<string>('emoji');
		const matchedStandard = emojiOption.match(emojiregex);
		if (matchedStandard !== null && matchedStandard.length > 0) {
			// biome-ignore lint/suspicious/noExplicitAny: Discord emoji requires any type
			pronoun.emoji = { name: matchedStandard[0] } as any;
		} else {
			const matchedDiscord = /<:(?<name>.+?):(?<id>\d+)>/.exec(emojiOption);
			if (matchedDiscord?.groups?.name && matchedDiscord.groups?.id) {
				pronoun.emoji = {
					name: matchedDiscord.groups.name,
					id: matchedDiscord.groups.id,
				};
			}
		}
	}

	return pronoun;
}

export async function createPronounRole(
	interaction: Interaction,
	name: string,
	guild?: Guild,
): Promise<string> {
	const fetchedGuild =
		guild ?? (await fetchGuild(interaction.guild_id, interaction.client));
	const role = await fetchedGuild?.createRole({ name }, interaction.client);
	if (role === undefined) {
		throw new Error('Failed to create a role for the pronoun.');
	}

	return role.id;
}

async function addPronoun(
	interaction: Interaction,
	config: GuildConfig,
	name: string,
	env: Env,
): Promise<InteractionResponse> {
	const key = name.toLowerCase().replaceAll(/[^a-z]/g, '_');
	const pronoun = createPronounObject(interaction, name);
	const newConfig = JSON.parse(JSON.stringify(config)) as GuildConfig;

	// 15 buttons blurple, 2 gray (any, ask)
	if (Object.keys(newConfig.pronouns).length >= 17) {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				embeds: [
					{ title: ":x: Sorry, you can't add more than 15 pronoun options." },
				],
				flags: 64,
			},
		};
	}

	if (newConfig.pronouns[key] !== undefined) {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				embeds: [{ title: `:x: \`${name}\` already exists.` }],
				flags: 64,
			},
		};
	}

	newConfig.pronouns[key] = JSON.parse(
		JSON.stringify(pronoun),
	) as PronounObject;
	await GuildConfigStore.save(interaction.guild_id, newConfig, env);
	if (newConfig.useRoles) {
		await RoleStore.save(
			interaction.guild_id,
			key,
			await createPronounRole(interaction, name),
			env,
		);
	}

	await updatePrompts(newConfig, interaction.client);

	return {
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
			embeds: [{ title: `:white_check_mark: \`${name}\` has been added.` }],
			flags: 64,
		},
	};
}

async function emojiPronoun(
	interaction: Interaction,
	config: GuildConfig,
	name: string,
	env: Env,
): Promise<InteractionResponse> {
	const key = name.toLowerCase().replaceAll(/[^a-z]/g, '_');
	const pronoun = createPronounObject(interaction, name);

	if (config.pronouns[key] === undefined) {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				embeds: [{ title: `:x: \`${name}\` doesn't exist.` }],
				flags: 64,
			},
		};
	}

	if (
		interaction.options
			?.get<InteractionOptions>('emoji')
			.get<string>('emoji')
			.toLowerCase() === 'none'
	) {
		config.pronouns[key].emoji = undefined;
		await updatePrompts(config, interaction.client);
		await GuildConfigStore.save(interaction.guild_id, config, env);

		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				embeds: [
					{
						title: `:wastebasket: The emoji has been removed for \`${name}\`.`,
					},
				],
				flags: 64,
			},
		};
	}

	if (pronoun.emoji === undefined) {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				embeds: [{ title: ":question: That doesn't seem like a valid emoji." }],
				flags: 64,
			},
		};
	}

	if (
		JSON.stringify(config.pronouns[key].emoji) !== JSON.stringify(pronoun.emoji)
	) {
		config.pronouns[key].emoji = pronoun.emoji;
		await updatePrompts(config, interaction.client);
		await GuildConfigStore.save(interaction.guild_id, config, env);

		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				embeds: [
					{
						title: `:white_check_mark: The emoji for \`${name}\` has been changed.`,
					},
				],
				flags: 64,
			},
		};
	}

	return {
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
			embeds: [
				{
					title: `:question: There was nothing to change, \`${name}\` already has that emoji.`,
				},
			],
			flags: 64,
		},
	};
}

async function removePronoun(
	interaction: Interaction,
	config: GuildConfig,
	name: string,
	env: Env,
): Promise<InteractionResponse> {
	const key = Object.keys(config.pronouns).find(
		(k) => config.pronouns[k].name.toLowerCase() === name.toLowerCase(),
	);

	if (key === undefined || config.pronouns[key] === undefined) {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				embeds: [{ title: `:x: \`${name}\` doesn't exist.` }],
				flags: 64,
			},
		};
	}

	if (defaultConfig.pronouns[key] !== undefined) {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				embeds: [
					{ title: ":x: Sorry, you can't delete a default pronoun option." },
				],
				flags: 64,
			},
		};
	}

	delete config.pronouns[key];
	await GuildConfigStore.save(interaction.guild_id, config, env);

	if (config.useRoles) {
		try {
			const roleId = await RoleStore.get(interaction.guild_id, key, env);
			if (roleId) {
				const _guild = await fetchGuild(
					interaction.guild_id,
					interaction.client,
				);
				await interaction.client.delete(
					`/guilds/${interaction.guild_id}/roles/${roleId}`,
				);
			}
		} catch (error_: unknown) {
			const error = error_ as Error;
			error.message = `Failed to delete role for \`${name}\`: ${error.message}`;
			console.error(error);
		}
	}

	await updatePrompts(config, interaction.client);

	return {
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
			embeds: [{ title: `:wastebasket: \`${name}\` has been removed.` }],
			flags: 64,
		},
	};
}

async function resetPronouns(
	interaction: Interaction,
	config: GuildConfig,
	env: Env,
): Promise<InteractionResponse> {
	if (config.useRoles) {
		const _guild = await fetchGuild(interaction.guild_id, interaction.client);
		for (const key of Object.keys(config.pronouns)) {
			if (defaultConfig.pronouns[key] !== undefined) {
				continue;
			}

			try {
				const roleId = await RoleStore.get(interaction.guild_id, key, env);
				if (roleId) {
					await interaction.client.delete(
						`/guilds/${interaction.guild_id}/roles/${roleId}`,
					);
				}
			} catch (error: unknown) {
				console.error(error);
			}
		}
	}

	// Easy way to deep copy
	config.pronouns = JSON.parse(
		JSON.stringify(defaultConfig.pronouns),
	) as GuildPronouns;
	await GuildConfigStore.save(interaction.guild_id, config, env);
	await updatePrompts(config, interaction.client);

	return {
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
			embeds: [
				{ title: ':wastebasket: All non-default pronouns have been removed.' },
			],
			flags: 64,
		},
	};
}

const command: Command = {
	name: 'pronouns',
	description: 'Add, edit or remove pronouns',
	default_permission: true,
	options: [
		{
			name: 'add',
			description: 'Add a pronoun',
			type: CommandOptionType.SubCommand,
			options: [
				{
					name: 'pronoun',
					description: 'The pronoun to add',
					type: CommandOptionType.String,
					required: true,
				},
				{
					name: 'emoji',
					description: 'An emoji to display next to the pronoun',
					type: CommandOptionType.String,
				},
			],
		},
		{
			name: 'emoji',
			description: 'Edit an emoji from a pronoun',
			type: CommandOptionType.SubCommand,
			options: [
				{
					name: 'pronoun',
					description: 'The pronoun to edit the emoji of',
					type: CommandOptionType.String,
					required: true,
				},
				{
					name: 'emoji',
					description:
						'An emoji to display next to the pronoun (use "none" to remove the emoji)',
					type: CommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: 'remove',
			description: 'Remove a pronoun',
			type: CommandOptionType.SubCommand,
			options: [
				{
					name: 'pronoun',
					description: 'The pronoun to remove',
					type: CommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: 'reset',
			description: 'Removes all non-default pronouns',
			type: CommandOptionType.SubCommand,
		},
	],
	async onInteraction(interaction, env) {
		const config = await GuildConfigStore.get(interaction.guild_id, env);

		const permissionsError = await PermissionPrompt(interaction, [
			Permission.MANAGE_ROLES,
		]);
		if (permissionsError) return permissionsError;

		if (!interaction.options) {
			throw new Error('interaction.options was undefined');
		}

		const action = interaction.options.subCommandName;
		if (action === undefined) throw new Error('action was undefined');

		if (action === 'reset') {
			return resetPronouns(interaction, config, env);
		}

		const name = interaction.options
			.get<InteractionOptions>(action)
			.get<string>('pronoun');
		name.replaceAll(/[^\w?!\-.,/\W]/g, '');

		if (name.length > 16) {
			return {
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					embeds: [
						{ title: ':x: The maximum length for `name` is 16 characters.' },
					],
					flags: 64,
				},
			};
		}

		switch (action) {
			case 'add': {
				return addPronoun(interaction, config, name, env);
			}

			case 'emoji': {
				return emojiPronoun(interaction, config, name, env);
			}

			case 'remove': {
				return removePronoun(interaction, config, name, env);
			}

			default: {
				throw new Error('unknown action');
			}
		}
	},
};

export default command;
