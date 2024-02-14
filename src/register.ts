#!/usr/bin/env node
import process from 'node:process';
import dotenv from 'dotenv';
import prompt from './commands/prompt.js';
import pronounsCommand from './commands/pronouns.js';
import config from './commands/config.js';

dotenv.config({path: '.dev.vars'});

if (!process.env.DISCORD_TOKEN) {
	throw new Error('The DISCORD_TOKEN environment variable is required.');
}

if (!process.env.DISCORD_CLIENT_ID) {
	throw new Error('The DISCORD_CLIENT_ID environment variable is required.');
}

const token = process.env.DISCORD_TOKEN;
const appId = process.env.DISCORD_CLIENT_ID;
const url = `https://discord.com/api/v10/applications/${appId}/commands`;

const commands = [prompt, pronounsCommand, config];

const response = await fetch(url, {
	headers: {
		'Content-Type': 'application/json',
		authorization: `Bot ${token}`,
	},
	method: 'PUT',
	body: JSON.stringify(commands),
});
console.log('Registered all commands');

if (!response.ok) {
	let errorText = `Error fetching ${response.url}: ${response.status} ${response.statusText}`;
	try {
		const error = await response.text();
		if (error) {
			errorText = `${errorText} \n\n ${error}`;
		}
	} finally {
		console.error(errorText);
	}
}

const data = (await response.json()) as unknown;

console.log(JSON.stringify(data, null, 2));
