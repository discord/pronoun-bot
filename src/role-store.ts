import {type Env} from './env.js';

export class RoleStore {
	async get(guild: string, id: string, env: Env): Promise<string | undefined> {
		return (await env.pronoun.get(`roles:${guild}:${id}`)) ?? undefined;
	}

	async getAll(guild: string, env: Env): Promise<string[]> {
		const roles: string[] = [];
		const {keys} = await env.pronoun.list({prefix: `roles:${guild}:`});
		for (const key of keys) {
			const role = await env.pronoun.get(key.name);
			if (!role) {
				throw new Error(`unable to fetch ${key.name}`);
			}

			roles.push(role);
		}

		return roles;
	}

	async getAllKeyed(guild: string, env: Env): Promise<Record<string, string>> {
		const {keys} = await env.pronoun.list({prefix: `roles:${guild}:`});
		const roles: Record<string, string> = {};
		for (const key of keys) {
			const role = await env.pronoun.get(key.name);
			if (!role) {
				throw new Error(`unable to fetch ${key.name}`);
			}

			const id = key.name.split(':')[2];
			roles[id] = role;
		}

		return roles;
	}

	async save(guild: string, id: string, role: string, env: Env): Promise<void> {
		await env.pronoun.put(`roles:${guild}:${id}`, role);
	}

	async delete(guild: string, id: string, env: Env): Promise<void> {
		await env.pronoun.delete(`roles:${guild}:${id}`);
	}
}

const store = new RoleStore();

export default store;
