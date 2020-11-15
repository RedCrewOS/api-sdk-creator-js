const { curry, ifElse, partial, Result } = require("crocks");

import { HttpRequest, HttpRequestMethod, HttpResponse } from "@sdk-creator/http-client";

// synchronous for now
type HttpClient = (request: HttpRequest<string>) => typeof Result;

interface HttpResult<Request = any, Response = any> {
	request: HttpRequest<Request>;
	response: HttpResponse<Response>;
}

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
// httpClient : (HttpRequest) -> Result<HttpResponse<string>>
const httpClient = (request: HttpRequest<string>): typeof Result => {
	trace(JSON.stringify(request));

	// uncomment to fail on first try.
	// return Result.Err(new Error("Something went wrong"));

	if (!request.headers.authorization) {
		return Result.Ok({
			statusCode: 401,
			statusMessage: "Unauthorized",
			headers: {}
		})
	}

	// uncomment to fail on second try.
	// return Result.Err(new Error("Something went wrong"));

	return Result.Ok({
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
};

const httpClientFactory = () => httpClient;

// jsonMarshaller : (any, HttpRequest) -> Result<HttpRequest<string>>
const jsonMarshaller = (data: any, request: HttpRequest): typeof Result => {
	request.headers["content-type"] = "application/json";
	request.body = JSON.stringify(data);

	return Result.Ok(request as HttpRequest<string>);
};

// jsonUnmarshaller : (HttpResponse) -> Result<any>
const jsonUnmarshaller = (response: HttpResponse): typeof Result => Result.Ok(JSON.parse(response.body));

// ---

/*
 * Helpers
 */
const retry: (result: HttpResult) => typeof Result = Result.Ok;

const returnError = (result: HttpResult) => Result.Ok(result);

const sendRequest: (request: HttpRequest) => typeof Result = Result.Ok;

const through: Function = partial;

// composes the result of the HttpClient into an HttpResult
const into = curry((client: HttpClient, request: HttpRequest): typeof Result => {
	return client(request).chain((response: HttpResponse) => Result.Ok({
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

				return Result.Ok(context)
			});
	},
	Result.Ok
);

const catching = (policy: Function): any => ifElse(
	(context: HttpResult) => context.response.statusCode >= 400,
	policy,
	Result.Ok
);

// ---

/*
 * Policies
 */

// authorisationRetry : (HttpResult) -> Result<HttpResult>
const authorisationRetry = (context: HttpResult): typeof Result => {
	trace("Reauthorising");

	context.request.headers.authorization = "abc123";

	return Result.Ok(context);
};

// ---

/*
 * Example SDK method
 */

const withdraw = (account: Account, amount: number): Account => {
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
			.chain((context: HttpResult) => Result.Ok(context.request))
			.chain(into(client))
			.chain(then(through(jsonUnmarshaller)))

			// do nothing, give up and return the error.
			.chain(catching(returnError))
	))
	.either(
		(err: Error) => ({ message: err.message }),
		(result: HttpResult) => result.response.body ? result.response.body : result.response
	);
};

const account: Account = {
	id: 1,
	name: "My Account",
	balance: 10
};

console.log(JSON.stringify(withdraw(account, 10)));
