import {
	type ActionRow,
	ButtonStyleTypes,
	type Button,
	type EmojiInfo,
	MessageComponentTypes,
} from 'discord-interactions';
import type {
	Interaction,
	InteractionResponseData,
} from './discord/interaction.js';
import GuildConfigStore, {type GuildConfig} from './guild-config-store.js';
import RoleStore from './role-store.js';
import * as UserRoleCache from './user-role-cache.js';

export async function getComponents(
	interaction: Interaction,
	config: GuildConfig,
): Promise<ActionRow[]> {
	const pronounRoles = await RoleStore.getAllKeyed(
		interaction.guild_id,
		interaction.env,
	);
	const roleCache =
		(await UserRoleCache.get(
			interaction.guild_id,
			interaction.member.user.id,
			interaction.env,
		)) ?? interaction.member.roles;

	const buttons = Object.keys(config.pronouns)
		.filter((key) => !config.pronouns[key].hideButton)
		.map((key) => {
			const button: Button = {
				type: MessageComponentTypes.BUTTON,
				custom_id: `pronouns:${key}:multi`,
				label: config.pronouns[key].name,
				style: roleCache.has(pronounRoles[key])
					? ButtonStyleTypes.PRIMARY
					: ButtonStyleTypes.SECONDARY,
				emoji: config.pronouns[key].emoji,
			};
			return button;
		});

	const rows = getActionRows(buttons);
	rows.push({
		type: MessageComponentTypes.ACTION_ROW,
		components: [
			{
				type: MessageComponentTypes.BUTTON,
				custom_id: 'pronouns:$clear:multi',
				label: 'Clear',
				style: ButtonStyleTypes.DANGER,
				emoji: {name: '🗑️'} as unknown as Pick<
					EmojiInfo,
					'id' | 'name' | 'animated'
				>,
			},
		],
	});

	return rows;
}

export function getStatelessComponents(config: GuildConfig): ActionRow[] {
	const buttons = Object.keys(config.pronouns)
		.filter((key) => !config.pronouns[key].hideButton)
		.map((key) => {
			const button: Button = {
				type: MessageComponentTypes.BUTTON,
				custom_id: `pronouns:${key}`,
				label: config.pronouns[key].name,
				style: ButtonStyleTypes.PRIMARY,
				emoji: config.pronouns[key].emoji,
			};
			return button;
		});

	const components = getActionRows(buttons);

	if (config.useRoles) {
		components.push({
			type: MessageComponentTypes.ACTION_ROW,
			components: [
				{
					custom_id: 'pronouns:any',
					label: 'Any',
					style: ButtonStyleTypes.SECONDARY,
					type: MessageComponentTypes.BUTTON,
				},
				{
					custom_id: 'pronouns:ask',
					label: 'Ask Me',
					style: ButtonStyleTypes.SECONDARY,
					type: MessageComponentTypes.BUTTON,
				},
				{
					custom_id: 'multi-prompt',
					label: 'Pick Multiple',
					style: ButtonStyleTypes.SECONDARY,
					type: MessageComponentTypes.BUTTON,
				},
			],
		});
	} else {
		components.push({
			type: MessageComponentTypes.ACTION_ROW,
			components: [
				{
					custom_id: 'pronouns:any',
					label: 'Any Pronouns',
					style: ButtonStyleTypes.SECONDARY,
					type: MessageComponentTypes.BUTTON,
				},
				{
					custom_id: 'pronouns:ask',
					label: 'Ask Me',
					style: ButtonStyleTypes.SECONDARY,
					type: MessageComponentTypes.BUTTON,
				},
			],
		});
	}

	return components;
}

export async function getMessageData(
	interaction: Interaction,
): Promise<InteractionResponseData> {
	const config = await GuildConfigStore.get(
		interaction.guild_id,
		interaction.env,
	);
	const components = await getComponents(interaction, config);
	return {
		embeds: [
			{
				title: 'Select your preferred pronouns',
				color: 0x58_65_f2,
			},
		],
		components,
		flags: 64,
	};
}

function getActionRows(buttons: Button[]) {
	const numberRows = Math.ceil(buttons.length / 5);
	const rows: ActionRow[] = [];
	for (let r = 0; r < numberRows; r++) {
		const row: ActionRow = {
			type: MessageComponentTypes.ACTION_ROW,
			components: [],
		};
		for (let i = 0; i < 5; i++) {
			const button = buttons.shift();
			if (button) {
				row.components.push(button);
			}
		}

		rows.push(row);
	}

	return rows;
}
