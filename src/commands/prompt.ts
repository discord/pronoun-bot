import {InteractionResponseType} from 'discord-interactions';
import {getStatelessComponents} from '../component-builders.js';
import {type Command} from '../discord/discord-types.js';
import {type Interaction, updateWebhook} from '../discord/interaction.js';
import {Permission, fetchGuild} from '../discord/models/guild.js';
import {
	type CreateMessageParameters,
	type Message,
} from '../discord/models/message.js';
import {type Env} from '../env.js';
import GuildConfigStore, {type GuildConfig} from '../guild-config-store.js';
import PermissionPrompt from '../permission-prompt.js';
import RoleStore from '../role-store.js';
import {createPronounRole} from './pronouns.js';

export function getMessageData(config: GuildConfig): CreateMessageParameters {
	return {
		embeds: [
			{
				title: '👋 Hey there! What are your pronouns?',
				description: `${config.promptMessage}\n\n*[Add this bot to your own server](https://discord.com/oauth2/authorize?client_id=832258414603534380&permissions=8&scope=bot%20applications.commands)*`,
				color: 0x58_65_f2,
			},
		],
		components: getStatelessComponents(config),
	};
}

export async function validateRoles(interaction: Interaction): Promise<void> {
	const config = await GuildConfigStore.get(
		interaction.guild_id,
		interaction.env,
	);
	const roles = await RoleStore.getAllKeyed(
		interaction.guild_id,
		interaction.env,
	);
	const guild = await fetchGuild(interaction.guild_id, interaction.client);
	for (const key of Object.keys(config.pronouns)) {
		if (
			roles[key] === undefined ||
			guild?.roles.find((r) => r.id === roles[key]) === undefined
		) {
			let displayName = config.pronouns[key].name;
			if (key === 'any') {
				displayName = 'Any Pronouns';
			} else if (key === 'ask') {
				displayName = 'Pronouns: Ask Me';
			}

			const role = await createPronounRole(interaction, displayName, guild);
			await RoleStore.save(interaction.guild_id, key, role, interaction.env);
		}
	}
}

const command: Command = {
	name: 'prompt',
	description: 'Create a pronoun selection prompt',
	default_permission: true,
	async onInteraction(interaction, env, context) {
		context.waitUntil(execAsync(interaction, env));
		return {
			type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				flags: 1 << 6, // EPHEMERAL
			},
		};
	},
};

async function execAsync(interaction: Interaction, env: Env) {
	const rest = interaction.client;
	const config = await GuildConfigStore.get(interaction.guild_id, env);
	const permissionsError = await PermissionPrompt(interaction, [
		Permission.MANAGE_MESSAGES,
	]);
	if (permissionsError?.data) {
		await updateWebhook({
			interaction,
			message: permissionsError.data,
		});
	}

	try {
		await validateRoles(interaction);
	} catch (error: unknown) {
		console.error(error);
		await updateWebhook({
			interaction,
			message: {
				embeds: [
					{
						title: ':warning: Missing permissions',
						description:
							"Hmm, it looks like i don't have permission to create roles.\n*[Click here to read about permissions](https://support.discord.com/hc/en-us/articles/206029707-How-do-I-set-up-Permissions-)*",
					},
				],
				flags: 64,
			},
		});
	}

	const message = await rest.post<Message>(
		`/channels/${interaction.channel_id}/messages`,
		getMessageData(config),
	);
	config.pickers = [
		...config.pickers.slice(0, 5),
		{c: interaction.channel_id, m: message.id},
	];
	await GuildConfigStore.save(interaction.guild_id, config, env);
	await updateWebhook({
		interaction,
		message: {
			content: ':tada: The prompt has been created',
			flags: 64,
		},
	});
}

export default command;
