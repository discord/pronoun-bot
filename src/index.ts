import {
	verifyKey,
	InteractionType,
	InteractionResponseType,
} from 'discord-interactions';
import {Router} from 'itty-router';
import {type ExecutionContext} from '@cloudflare/workers-types';
import pronouns from './components/pronouns.js';
import multiPrompt from './components/multi-prompt.js';
import {
	type Interaction,
	InteractionOptions,
	type InteractionPayload,
} from './discord/interaction.js';
import Member from './discord/models/member.js';
import {type Env} from './env.js';
import prompt from './commands/prompt.js';
import pronounsCommand from './commands/pronouns.js';
import config from './commands/config.js';
import {JsonResponse} from './common.js';
import {RESTClient} from './discord/rest.js';

const components = new Map([
	[pronouns.key, pronouns],
	[multiPrompt.key, multiPrompt],
]);

const commands = new Map(
	[prompt, pronounsCommand, config].map((command) => [command.name, command]),
);

const startedAt = Date.now();

type Ratelimit = {
	calls: number;
	timestamp: number;
};

const router = Router();
router.get('/', () => new Response('<3'));

router.post('/interaction', async (r, env: Env, context: ExecutionContext) => {
	try {
		const request = r as unknown as Request;
		const {isValid, interaction} = await verifyDiscordRequest(request, env);
		if (!isValid || !interaction) {
			return new Response('Bad request signature.', {status: 401});
		}

		const rest = new RESTClient(env);

		if (interaction.type > 1 && !interaction.guild_id) {
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					embeds: [
						{
							title: 'Sorry! I only work in guilds.',
						},
					],
					flags: 64,
				},
			});
		}

		const rateLimitResponse = await checkRateLimits(interaction, env);
		if (rateLimitResponse) {
			return rateLimitResponse;
		}

		switch (interaction.type) {
			case InteractionType.PING: {
				return new JsonResponse({type: InteractionResponseType.PONG});
			}

			case InteractionType.APPLICATION_COMMAND: {
				if (env.DISCORD_CLIENT_ID !== interaction.application_id) {
					return new JsonResponse(
						{error: 'Application not found'},
						{status: 400},
					);
				}

				const command = commands.get(interaction.data.name);
				if (command?.onInteraction !== undefined) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const parsedInteraction: Interaction = {
						client: rest,
						env,
						...(interaction as any),
					};

					parsedInteraction.member &&= new Member(
						interaction.guild_id,
						interaction.member as any, // eslint-disable-line @typescript-eslint/no-unsafe-argument
						rest,
					);

					if (interaction.data.options) {
						parsedInteraction.options = new InteractionOptions(
							interaction.data.options as any, // eslint-disable-line @typescript-eslint/no-unsafe-argument
						);
					}

					const result = await command.onInteraction(
						parsedInteraction,
						env,
						context,
					);
					return new JsonResponse(result);
				}

				console.error('No interaction handler found on the command object.');

				break;
			}

			case InteractionType.MESSAGE_COMPONENT: {
				if (env.DISCORD_CLIENT_ID !== interaction.application_id) {
					break;
				}

				const key = interaction.data.custom_id.split(':')[0];
				const component = components.get(key);
				if (component?.onInteraction !== undefined) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const parsedInteraction: Interaction = {
						client: rest,
						env,
						...(interaction as any),
					};
					parsedInteraction.member &&= new Member(
						interaction.guild_id,
						interaction.member as any, // eslint-disable-line @typescript-eslint/no-unsafe-argument
						rest,
					);

					if (interaction.data.options) {
						parsedInteraction.options = new InteractionOptions(
							interaction.data.options as any, // eslint-disable-line @typescript-eslint/no-unsafe-argument
						);
					}

					const result = await component.onInteraction(parsedInteraction);
					return new JsonResponse(result);
				}

				return new JsonResponse(
					{error: 'Interaction not found'},
					{status: 400},
				);
			}

			default: {
				return new JsonResponse(
					{error: 'Interaction not found'},
					{status: 400},
				);
			}
		}

		return new JsonResponse({error: 'Interaction not found'}, {status: 400});
	} catch (error: unknown) {
		console.error(error);
		return new Response('Error handling interaction.', {status: 500});
	}
});

async function checkRateLimits(interaction: InteractionPayload, env: Env) {
	const userId = interaction.member?.user?.id;
	if (userId) {
		const ratelimit = await env.pronoun.get<Ratelimit | undefined>(
			`ratelimits:${userId}`,
			'json',
		);
		let rl = ratelimit?.calls ?? 0;
		if (ratelimit?.timestamp && ratelimit.timestamp < Date.now() - 15_000) {
			rl = 0;
		}

		if (rl > 8) {
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					embeds: [
						{
							title: "Woah! You're going too fast, please slow down!",
							footer: {
								text: `Try again in ${(15 - (((Date.now() - startedAt) / 1000) % 15)).toFixed(0)} seconds`,
							},
						},
					],
					flags: 64,
				},
			});
		}

		await env.pronoun.put(
			`ratelimits:${userId}`,
			JSON.stringify({
				calls: rl + 1,
				timestamp: Date.now(),
			}),
		);
	}
}

router.get('*', () => {
	return new Response('Not found', {status: 404});
});

async function verifyDiscordRequest(
	request: Request,
	env: Env,
): Promise<{interaction?: InteractionPayload; isValid: boolean}> {
	const signature = request.headers.get('x-signature-ed25519');
	const timestamp = request.headers.get('x-signature-timestamp');
	const body = await request.text();
	const isValidRequest =
		signature &&
		timestamp &&
		verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
	if (!isValidRequest) {
		return {isValid: false};
	}

	return {interaction: JSON.parse(body) as InteractionPayload, isValid: true};
}

const main = {
	async fetch(
		request: Request,
		env: Env,
		context: ExecutionContext,
	): Promise<unknown> {
		return router.handle(request, env, context);
	},
};

export default main;
