import type { KVNamespace } from '@cloudflare/workers-types';

export type Env = {
	DISCORD_TOKEN: string;
	DISCORD_PUBLIC_KEY: string;
	DISCORD_CLIENT_ID: string;
	pronoun: KVNamespace;
};
