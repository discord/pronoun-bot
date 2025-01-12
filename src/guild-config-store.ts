import type { EmojiInfo } from 'discord-interactions';
import type { Env } from './env.js';

export type GuildPronouns = Record<
	string,
	{
		name: string;
		hideButton?: boolean;
		emoji?: EmojiInfo;
	}
>;

export type GuildConfig = {
	useRoles: boolean;
	onlyOwnerCanConfig: boolean;
	promptMessage: string;
	pronouns: GuildPronouns;
	pickers: GuildConfigPicker[];
};

export type GuildConfigPicker = {
	c: string;
	m: string;
};

export const defaultConfig: GuildConfig = {
	useRoles: true,
	onlyOwnerCanConfig: true,
	promptMessage:
		"Use the buttons below to select what pronouns you'd like us to display for you.",
	pronouns: {
		any: { name: 'Any', hideButton: true },
		ask: { name: 'Ask Me', hideButton: true },
		they_them: { name: 'They/Them' },
		she_her: { name: 'She/Her' },
		he_him: { name: 'He/Him' },
	},
	pickers: [],
};

Object.freeze(defaultConfig);
Object.freeze(defaultConfig.pronouns);

// This is *kind of* abusing redis a little but oh well,
// it works and it's an easy and lightweight way to set up a db :p
export class GuildConfigStore {
	async get(id: string, env: Env): Promise<GuildConfig> {
		const config = await env.pronoun.get<GuildConfig>(
			`guild-config:${id}`,
			'json',
		);
		if (config) {
			return config;
		}

		// Easy deep clone
		return JSON.parse(JSON.stringify(defaultConfig)) as GuildConfig;
	}

	async save(id: string, config: GuildConfig, env: Env): Promise<void> {
		await env.pronoun.put(`guild-config:${id}`, JSON.stringify(config));
	}
}

const store = new GuildConfigStore();

export default store;
