import { InteractionResponseType } from 'discord-interactions';
import { getComponents } from './component-builders.js';
import type {
	Interaction,
	InteractionResponse,
	InteractionResponseData,
} from './discord/interaction.js';
import type { GuildConfig } from './guild-config-store.js';
import roleStore from './role-store.js';
import * as UserRoleCache from './user-role-cache.js';

export async function clearPronounNicks(
	interaction: Interaction,
	config: GuildConfig,
): Promise<void> {
	const possiblePronouns = Object.values(config.pronouns).map(
		(pronoun) => `[${pronoun.name}]`,
	);
	const name = interaction.member?.nick ?? interaction.member?.user.username;
	if (possiblePronouns.some((pronoun) => name.startsWith(pronoun))) {
		const index = name.indexOf(']') + (name.includes('] ') ? 2 : 1);
		await interaction.member.setNickname(`${name.slice(index)}`.slice(0, 32));
	}
}

export async function setNick(
	interaction: Interaction,
	config: GuildConfig,
): Promise<InteractionResponse> {
	const selected = interaction.data.custom_id?.slice(
		interaction.data.custom_id.indexOf(':') + 1,
	);
	const possiblePronouns = Object.values(config.pronouns).map(
		(pronoun) => `[${pronoun.name}]`,
	);
	const pronoun = `[${config.pronouns[selected].name}]`;
	const name = interaction.member.nick ?? interaction.member.user.username;
	if (possiblePronouns.some((pronoun) => name.startsWith(pronoun))) {
		const index = name.indexOf(']') + (name.includes('] ') ? 2 : 1);
		await interaction.member.setNickname(
			`${pronoun} ${name.slice(index)}`.slice(0, 32),
		);
	} else {
		await interaction.member.setNickname(`${pronoun} ${name}`.slice(0, 32));
	}

	if (selected === 'ask') {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: 'People will be prompted to ask for your pronouns.',
				flags: 64,
			},
		};
	}

	return {
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
			content: `Your preferred pronoun has been set to **${config.pronouns[selected].name}**.`,
			flags: 64,
		},
	};
}

export async function clearAllRoles(interaction: Interaction): Promise<void> {
	const pronounRoles = await roleStore.getAll(
		interaction.guild_id,
		interaction.env,
	);
	const pronounRolesOnUser = pronounRoles.filter((id) =>
		interaction.member.roles.has(id),
	);
	await UserRoleCache.deleteAll(
		interaction.guild_id,
		interaction.member,
		pronounRolesOnUser,
		interaction.env,
	);
	if (pronounRolesOnUser.length > 0) {
		await interaction.member.removeRoles(pronounRolesOnUser);
	}
}

export async function setSingleRole(
	name: string,
	key: string,
	role: string,
	interaction: Interaction,
): Promise<InteractionResponse> {
	await clearAllRoles(interaction);

	await UserRoleCache.add(
		interaction.guild_id,
		interaction.member,
		role,
		interaction.env,
	);

	try {
		await interaction.member.giveRole(role);
	} catch (error: unknown) {
		console.error(error);
		await interaction.client.patch(
			`/webhooks/${interaction.env.DISCORD_CLIENT_ID}/${interaction.token}/messages/@original`,
			{
				content:
					":warning: I wasn't able to assign the role. Please make sure the bot role is positioned above the members in the role list and that the pronoun roles are positioned below the bot role.",
				flags: 64,
			},
		);
	}

	if (key === 'ask') {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: 'People will be prompted to ask for your pronouns.',
				flags: 64,
			},
		};
	}

	return {
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
			content: `Your preferred pronoun has been set to **${name}**.`,
			flags: 64,
		},
	};
}

export async function setMultiRoles(
	selected: string,
	role: string,
	interaction: Interaction,
	config: GuildConfig,
): Promise<InteractionResponseData> {
	const { env } = interaction;
	const pronounRoles = await roleStore.getAllKeyed(interaction.guild_id, env);
	if (
		await UserRoleCache.has(
			interaction.guild_id,
			interaction.member,
			pronounRoles.any,
			env,
		)
	) {
		await UserRoleCache.del(
			interaction.guild_id,
			interaction.member,
			pronounRoles.any,
			env,
		);
		await interaction.member.removeRole(pronounRoles.any);
	}

	if (
		await UserRoleCache.has(
			interaction.guild_id,
			interaction.member,
			pronounRoles.ask,
			env,
		)
	) {
		await UserRoleCache.del(
			interaction.guild_id,
			interaction.member,
			pronounRoles.ask,
			env,
		);
		await interaction.member.removeRole(pronounRoles.ask);
	}

	if (
		await UserRoleCache.has(
			interaction.guild_id,
			interaction.member,
			pronounRoles[selected],
			env,
		)
	) {
		await UserRoleCache.del(
			interaction.guild_id,
			interaction.member,
			role,
			env,
		);
		await interaction.member.removeRole(role);
	} else {
		await UserRoleCache.add(
			interaction.guild_id,
			interaction.member,
			role,
			env,
		);
		try {
			await interaction.member.giveRole(role);
		} catch {
			await interaction.client.patch(
				`/webhooks/${env.DISCORD_CLIENT_ID}/${interaction.token}/messages/@original`,
				{
					content:
						":warning: I wasn't able to assign the role. Please make sure the bot role is positioned above the members in the role list and that the pronoun roles are positioned below the bot role.",
					flags: 64,
				},
			);
		}
	}

	return { components: await getComponents(interaction, config) };
}

export async function setRole(
	interaction: Interaction,
	config: GuildConfig,
): Promise<InteractionResponse> {
	const key = interaction.data.custom_id?.split(':')[1];
	const isMulti = interaction.data.custom_id?.split(':')[2] === 'multi';

	await clearPronounNicks(interaction, config);

	if (key === '$clear') {
		await clearAllRoles(interaction);
		return {
			type: InteractionResponseType.UPDATE_MESSAGE,
			data: { components: await getComponents(interaction, config) },
		};
	}

	const selected = config.pronouns[key];
	const role = await roleStore.get(interaction.guild_id, key, interaction.env);
	if (!role) {
		throw new Error(
			`Role not found in guild ${interaction.guild_id} for key ${key}`,
		);
	}

	if (isMulti) {
		return {
			type: InteractionResponseType.UPDATE_MESSAGE,
			data: await setMultiRoles(key, role, interaction, config),
		};
	}

	return setSingleRole(selected.name, key, role, interaction);
}
