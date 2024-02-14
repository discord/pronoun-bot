import {type Env} from '../env.js';

export class RESTClient {
	constructor(public env: Env) {}

	async get<T>(path: string): Promise<T> {
		const result = await this.fetch<T>(path);
		return result;
	}

	async patch<T = void>(path: string, body: unknown): Promise<T> {
		const result = await this.fetch<T>(path, {
			body: JSON.stringify(body),
			method: 'PATCH',
		});
		return result;
	}

	async post<T = void>(path: string, body: unknown): Promise<T> {
		const result = await this.fetch<T>(path, {
			body: JSON.stringify(body),
			method: 'POST',
		});
		return result;
	}

	async delete<T = void>(path: string): Promise<T> {
		const result = await this.fetch<T>(path, {method: 'DELETE'});
		return result;
	}

	async put<T = void>(path: string): Promise<T> {
		const result = this.fetch<T>(path, {method: 'PUT'});
		return result;
	}

	async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
		// Console.log(`${options.method ?? 'GET'} ${path}`);
		options.headers = {
			authorization: `Bot ${this.env.DISCORD_TOKEN}`,
			'content-type': 'application/json',
		};
		const result = await fetch(`https://discord.com/api/v10${path}`, options);
		if (result.ok) {
			if (result.headers.get('content-type')?.includes('application/json')) {
				const json = (await result.json()) as T;
				return json;
			}

			const text = await result.text();
			return text as T;
		}

		const error = await getFetchError(result);
		throw error;
	}
}

export async function getFetchError(response: Response): Promise<FetchError> {
	let errorText = `Error fetching ${response.url}: ${response.status} ${response.statusText}`;
	try {
		const error = await response.text();
		if (error) {
			errorText = `${errorText} \n\n ${error}`;
		}
	} catch {
		// ignore
	}

	console.error(errorText);
	return new FetchError(errorText, response);
}

export class FetchError extends Error {
	constructor(
		message: string,
		public response: Response,
	) {
		super(message);
	}
}
