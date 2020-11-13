const { curry, ifElse, identity, partial, pipe } = require("crocks");

import {
	HttpRequest,
	HttpRequestMethod,
	HttpResponse,
} from "@sdk-creator/http-client";

// synchronous for now
type HttpClient = (request: HttpRequest<string>) => HttpContext<string, string>;
type Marshaller = (data: any, request: HttpRequest) => HttpRequest<string>;
type CurriedMarshaller = (data: any) => ( (request: HttpRequest) => HttpRequest<string> );
type Pipe = (...any: any[]) => any;
type PipeFactory = (...handlers: ((...args: any[]) => any)[]) => Pipe;

interface HttpContext<Request = any, Response = any> {
	request: HttpRequest<Request>;
	response: HttpResponse<Response>;
}

interface Account {
	id: number;
	name: string;
	balance: number;
}

function log(level: string, message: string): void {
	console.log(`${level.toUpperCase()}: ${message}`);
}

const trace = partial(log, "trace");

function httpClientFactory() {
	return httpClient;
}

function httpClient(request: HttpRequest<string>): HttpContext<string, string> {
	trace(JSON.stringify(request));

	if (!request.headers.authorization) {
		return {
			request,
			response: {
				statusCode: 401,
				statusMessage: "Unauthorized",
				headers: {}
			}
		}
	}

	return {
		request,
		response: {
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
		}
	};
}

const sendRequest: PipeFactory = pipe;

const through: (marshaller: Marshaller) => CurriedMarshaller = curry;

function jsonMarshaller(data: any, request: HttpRequest): HttpRequest<string> {
	request.headers["content-type"] = "application/json";
	request.body = JSON.stringify(data);

	return request;
}

function jsonUnmarshaller(response: HttpResponse): Account {
	return JSON.parse(response.body);
}

function authorisationRetry(context: HttpContext): HttpContext {
	trace("Reauthorising")

	context.request.headers.authorization = "abc123";

	return context;
}

function into(client: HttpClient, onSuccess: Pipe, onError: Pipe): Pipe {
	return pipe(
		client,
		ifElse(
			(context: HttpContext) => context.response.statusCode >= 200 && context.response.statusCode <= 300,
			onSuccess,
			onError
		)
	);
}

function retry(policies: Pipe, next: Pipe): Pipe {
	return pipe(
		policies,
		// TODO: There's probably a better way to do this
		(context: HttpContext) => context.request,
		next
	)
}

const withPolicies: PipeFactory = pipe;

const returnError = identity;

const onSuccess: PipeFactory = (...handlers: ((...args: any[]) => any)[]): Pipe => {
	return pipe(
		// TODO: There's probably a better way to do this
		(context: HttpContext) => context.response,
		...handlers
	);
}

const onError: PipeFactory = pipe;

function withdraw(account: Account, amount: number): Account {
	const client = httpClientFactory();

	const successPolicy = onSuccess(jsonUnmarshaller);

	const retryPolicy = retry(
		withPolicies(
			authorisationRetry
		),
		into(
			client,
			successPolicy,

			// do nothing, give up and return the error.
			onError(returnError)
		)
	);

	return sendRequest(
		through(jsonMarshaller)({ amount }),
		into(
			client,
			successPolicy,
			onError(retryPolicy)
		)
	)({
		method: HttpRequestMethod.POST,
		url: "http://localhost:3000/account/:id/withdraw",
		headers: {
			// authorization: "Bearer abc123"
		},
		pathParams: {
			id: account.id.toString()
		}
	});
}

const account: Account = {
	id: 1,
	name: "My Account",
	balance: 10
};

console.log(JSON.stringify(withdraw(account, 10)));
