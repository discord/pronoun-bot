import Bitfield from '../bitfield.js';
import type { User } from '../discord-types.js';
import type * as rest from '../rest.js';
import type { Permission } from './guild.js';

export type MemberProperties = {
	deaf: boolean;
	mute: boolean;
	is_pending: boolean;
	joined_at: Date;
	nick: string | undefined;
	permissions: string;
	premium_since: Date | undefined;
	roles: string[];
	user: User;
};

export default class Member {
	guild_id: string;
	deaf: boolean;
	mute: boolean;
	is_pending: boolean;
	joined_at: Date;
	nick: string | undefined;
	permissions: Bitfield<Permission>;
	permium_since: Date | undefined;
	roles: Set<string>;
	user: User;

	constructor(
		guildId: string,
		properties: MemberProperties,
		public rest: rest.RESTClient,
	) {
		this.guild_id = guildId;
		this.deaf = properties.deaf;
		this.mute = properties.mute;
		this.is_pending = properties.is_pending;
		this.joined_at = properties.joined_at;
		this.nick = properties.nick;
		this.permissions = new Bitfield<Permission>(Number(properties.permissions));
		this.permium_since = properties.premium_since;
		this.roles = new Set(properties.roles);
		this.user = properties.user;
	}

	async setNickname(newNick: string): Promise<void> {
		await this.rest.patch(`/guilds/${this.guild_id}/members/${this.user.id}`, {
			nick: newNick,
		});
	}

	async giveRole(id: string): Promise<unknown> {
		this.roles.add(id);
		return this.rest.put(
			`/guilds/${this.guild_id}/members/${this.user.id}/roles/${id}`,
		);
	}

	async removeRole(id: string): Promise<unknown> {
		this.roles.delete(id);
		return this.rest.delete(
			`/guilds/${this.guild_id}/members/${this.user.id}/roles/${id}`,
		);
	}

	async removeRoles(ids: string[]): Promise<unknown> {
		for (const id of ids) this.roles.delete(id);
		return this.rest.patch(`/guilds/${this.guild_id}/members/${this.user.id}`, {
			roles: [...this.roles].filter((id) => !ids.includes(id)),
		});
	}
}
