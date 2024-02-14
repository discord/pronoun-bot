export class JsonResponse<T = unknown> extends Response {
	constructor(body: T, init?: ResponseInit) {
		const jsonBody = JSON.stringify(body);
		init ??= {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		};
		super(jsonBody, init);
	}
}
