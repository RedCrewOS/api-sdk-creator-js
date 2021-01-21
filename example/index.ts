const { curry, ifElse, partial, Async } = require("crocks");

import {
	HttpClient,
	HttpRequest,
	HttpRequestMethod,
	HttpResponse,
	HttpResult
} from "@sdk-creator/http-client";

interface Account {
	id: number;
	name: string;
	balance: number;
}

const log = (level: string, message: string): void => {
	console.log(`${level.toUpperCase()}: ${message}`);
};

const trace = partial(log, "trace");

// ---

/*
 * Simple functions that a SDK dev might have to write.
 */
// httpClient : (HttpRequest) -> Result HttpResponse<string>
const httpClient = (request: HttpRequest<string>): typeof Async => {
	return Async((reject: (err: Error) => void, resolve: (data: HttpResponse<string>) => void) => {
		setTimeout(() => {
			trace(JSON.stringify(request));

			// uncomment to fail on first try.
			// reject(new Error("Something went wrong"));

			if (!request.headers.authorization) {
				resolve({
					statusCode: 401,
					statusMessage: "Unauthorized",
					headers: {}
				});
			}

			// uncomment to fail on second try.
			// reject(new Error("Something went wrong"));

			resolve({
				statusCode: 200,
				statusMessage: "OK",
				headers: {
					"content-type": "application/json"
				},
				body: JSON.stringify({
					id: 1,
					name: "My Account",
					balance: 0
				})
			});
		}, 2000);
	});
};

const httpClientFactory = () => httpClient;

// jsonMarshaller : (any, HttpRequest) -> Async HttpRequest<string>
const jsonMarshaller = (data: any, request: HttpRequest): typeof Async => {
	request.headers["content-type"] = "application/json";
	request.body = JSON.stringify(data);

	return Async.of(request as HttpRequest<string>);
};

// jsonUnmarshaller : (HttpResponse) -> Result<any>
const jsonUnmarshaller = (response: HttpResponse): typeof Async => Async.of(JSON.parse(response.body));

// ---

/*
 * Helpers
 */
const retry: (result: HttpResult) => typeof Async = Async.Resolved;

const returnError = (result: HttpResult) => Async.Resolved(result);

const sendRequest: (request: HttpRequest) => typeof Async = Async.Resolved;

const through: Function = partial;

// composes the result of the HttpClient into an HttpResult
const into = curry((client: HttpClient, request: HttpRequest): typeof Async => {
	return client(request).chain((response: HttpResponse) => Async.Resolved({
		request,
		response
	}));
});

// ---

/*
 * Handlers
 */

const then = (handler: ((...args: any[]) => any)): any => ifElse(
	(context: HttpResult) => context.response.statusCode >= 200 && context.response.statusCode <= 300,
	// TODO: There's probably a much better way to do this
	(context: HttpResult) => {
		return handler(context.response)
			.chain((result: any) => {
				context.response.body = result

				return Async.Resolved(context)
			});
	},
	Async.Resolved
);

const catching = (policy: Function): any => ifElse(
	(context: HttpResult) => context.response.statusCode >= 400,
	policy,
	Async.Resolved
);

// ---

/*
 * Policies
 */

// authorisationRetry : (HttpResult) -> Result<HttpResult>
const authorisationRetry = (context: HttpResult): typeof Async => {
	trace("Reauthorising");

	context.request.headers.authorization = "abc123";

	return Async.Resolved(context);
};

// ---

/*
 * Example SDK method
 */

// TODO: Think about what's best to return: Promise | Async
const withdraw = (account: Account, amount: number): Promise<Account> => {
	const client = httpClientFactory();

	return sendRequest({
		method: HttpRequestMethod.POST,
		url: "http://localhost:3000/account/:id/withdraw",
		headers: {
			// authorization: "Bearer abc123"
		},
		pathParams: {
			id: account.id.toString()
		}
	})
	.chain(through(jsonMarshaller, { amount }))
	.chain(into(client))
	.chain(then(through(jsonUnmarshaller)))
	.chain(catching((result: HttpResult) =>
		retry(result)
			.chain(authorisationRetry)
			// FIXME: This is a hack
			.chain((context: HttpResult) => Async.Resolved(context.request))
			.chain(into(client))
			.chain(then(through(jsonUnmarshaller)))

			// do nothing, give up and return the error.
			.chain(catching(returnError))
	))
	/*.fork(
		(err: Error) => ({ message: err.message }),
		(result: HttpResult) => result.response.body ? result.response.body : result.response
	);*/
	.toPromise()
	.then((result: HttpResult) => result.response.body ? result.response.body : result.response);
};

const account: Account = {
	id: 1,
	name: "My Account",
	balance: 10
};

(async function run() {
	console.log(JSON.stringify(await withdraw(account, 10)));
}());
