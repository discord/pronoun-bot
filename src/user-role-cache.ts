import type Member from './discord/models/member.js';
import {type Env} from './env.js';

export async function get(
	guild: string,
	uid: string,
	env: Env,
): Promise<Set<string> | undefined> {
	const data = await env.pronoun.get(`user-roles:${guild}:${uid}`);
	if (data !== null && data !== '{}') {
		return new Set(JSON.parse(data)); // eslint-disable-line @typescript-eslint/no-unsafe-argument
	}

	return undefined;
}

export async function add(
	guild: string,
	member: Member,
	role: string,
	env: Env,
): Promise<void> {
	const roles = (await get(guild, member.user.id, env)) ?? member.roles;
	roles.add(role);
	await env.pronoun.put(
		`user-roles:${guild}:${member.user.id}`,
		JSON.stringify([...roles]),
		{
			expirationTtl: 60 * 5,
		},
	);
}

export async function has(
	guild: string,
	member: Member,
	role: string,
	env: Env,
): Promise<boolean> {
	const roles = (await get(guild, member.user.id, env)) ?? member.roles;
	return roles.has(role);
}

export async function del(
	guild: string,
	member: Member,
	role: string,
	env: Env,
): Promise<void> {
	const roles = (await get(guild, member.user.id, env)) ?? member.roles;
	roles.delete(role);
	await env.pronoun.put(
		`user-roles:${guild}:${member.user.id}`,
		JSON.stringify([...roles]),
		{
			expirationTtl: 60 * 5,
		},
	);
}

export async function deleteAll(
	guild: string,
	member: Member,
	roles: string[],
	env: Env,
): Promise<void> {
	const newRoles = (await get(guild, member.user.id, env)) ?? member.roles;
	for (const role of roles) newRoles.delete(role);
	await env.pronoun.put(
		`user-roles:${guild}:${member.user.id}`,
		JSON.stringify([...newRoles]),
		{
			expirationTtl: 60 * 5,
		},
	);
}
