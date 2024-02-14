import {InteractionResponseType} from 'discord-interactions';
import {type Component} from '../discord/discord-types.js';
import GuildConfigStore from '../guild-config-store.js';
import {setNick, setRole} from '../setters.js';

const component: Component = {
	key: 'pronouns',
	async onInteraction(interaction) {
		try {
			const isMulti = interaction.data.custom_id?.split(':')[2] === 'multi';
			const config = await GuildConfigStore.get(
				interaction.guild_id,
				interaction.env,
			);
			if (isMulti && !config.useRoles) {
				throw new Error(
					'Sorry, selecting multiple pronouns is only available when the server owner has configured me to use roles.',
				);
			}

			const response = await (config.useRoles
				? setRole(interaction, config)
				: setNick(interaction, config));
			return response;
		} catch (error: unknown) {
			console.error(error);
			return {
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content:
						'Uh oh, looks like something went wrong. Please try again later.',
					flags: 64,
				},
			};
		}
	},
};

export default component;
