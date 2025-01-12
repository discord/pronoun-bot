import { InteractionResponseType } from 'discord-interactions';
import type {
	Interaction,
	InteractionResponse,
} from './discord/interaction.js';
import { type Permission, PermissionNames } from './discord/models/guild.js';

export default async function permissionPrompt(
	interaction: Interaction,
	requiredPermissions: Permission[],
): Promise<undefined | InteractionResponse> {
	if (!interaction.member.permissions.hasAll(requiredPermissions)) {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: `Sorry, you're missing the required permissions to execute this command! Please make sure you have access to \`${requiredPermissions
					.map((p) => PermissionNames[p])
					.join(', ')}\`.`,
				flags: 64,
			},
		};
	}
}
