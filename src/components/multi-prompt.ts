import { InteractionResponseType } from 'discord-interactions';
import { getMessageData } from '../component-builders.js';
import type { Component } from '../discord/discord-types.js';
import type { Interaction } from '../discord/interaction.js';

const component: Component = {
	key: 'multi-prompt',
	async onInteraction(interaction: Interaction) {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: await getMessageData(interaction),
		};
	},
};

export default component;
