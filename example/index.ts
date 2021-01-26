const {
	chain,
	compose,
	defaultProps,
	ifElse,
	map,
	mapProps,
	partial,
	pipe,
	pipeK,
	Async
} = require("crocks");

import {
	HttpClient,
	HttpRequest,
	HttpRequestMethod,
	HttpRequestPolicy,
	HttpResponse,
	HttpResponseHandler,
	HttpResult,
	HttpResultHandler,
	UnstructuredData
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
const httpClient: () => HttpClient = () => {
	return (request: HttpRequest<UnstructuredData>): typeof Async => {
		return Async((
			reject: (err: Error) => void,
			resolve: (result: HttpResult<UnstructuredData>) => void
		) => {
			setTimeout(() => {
				trace(`req: ${JSON.stringify(request)}`);

				const unauthorisedResponse = {
					statusCode: 401,
					statusMessage: "Unauthorized",
					headers: {}
				};

				const successResponse = {
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
				};

				// uncomment to fail on first try.
				// reject(new Error("Something went wrong"));
				if (!request.headers.authorization) {
					resolve({ request, response: unauthorisedResponse });

				}

				// uncomment to fail on second try.
				// reject(new Error("Something went wrong"));
				resolve({ request, response: successResponse });
			}, 0);
		});
	};
};

// ---

/*
 * Handlers
 */

const authorisationFailure: (accessToken: HttpRequestPolicy) => HttpResultHandler =
	(accessToken: HttpRequestPolicy) => {
		let count = 0;

		return (result: HttpResult): typeof Async => {
			try {
				if (count === 0) {
					return accessToken(result.request)
				}

				return Async.of(result);
			}
			finally {
				count++;
			}
		};
	};

const extractHttpResponse: () => HttpResultHandler = () => compose(Async.of, getHttpResponse);

const extractBody: () => HttpResponseHandler = () => compose(Async.of, getHttpBody);

const getHttpResponse: (result: HttpResult) => HttpResponse = (result: HttpResult) => result.response;

const getHttpBody: <T = any>(response: HttpResponse) => T = (response: HttpResponse) => response.body;

// ---

/*
 * Policies
 */

const defaultHeaders: (accessTokenPolicy: HttpRequestPolicy) => HttpRequestPolicy =
	(accessTokenPolicy: HttpRequestPolicy) => {
		return (request: HttpRequest): typeof Async => {
			return pipe(
				map(defaultProps({
					headers: {
						"x-application-header": "abc123"
					}
				})),
				chain(accessTokenPolicy)
			)(Async.of(request));
		};
	};

const accessTokenPolicy: () => HttpRequestPolicy = () => {
	let count = 0;

	return (request: HttpRequest): typeof Async => {
		if (count > 0) {
			trace("Reauthorising");

			request.headers.authorization = "abc123";
		}
		else {
			trace("No access token");
		}

		count++;

		return Async.of(request);
	};
}

const jsonMarshaller: () => HttpRequestPolicy = () => {
	return (request: HttpRequest<Record<any, any>>): typeof Async => {
		const newRequest: HttpRequest<string> = { ...request as Omit<HttpRequest, "body"> };

		if (request.body) {
			newRequest.headers["content-type"] = "application/json";
			newRequest.body = JSON.stringify(request.body);
		}

		return Async.of(newRequest);
	};
};

const jsonUnmarshaller: () => HttpResultHandler = () => {
	return (result: HttpResult): typeof Async => {
		const mapping = {
			response: {
				body: (x: string) => JSON.parse(x)
			}
		};

		return Async.of(mapProps(mapping, result));
	};
}

// ---

/*
 * Predicates
 */

const isSuccessfulResponse: (response: HttpResponse) => boolean =
	(response: HttpResponse) => response.statusCode >= 200 && response.statusCode < 300;

const isSuccessfulResult: (result: HttpResult) => boolean =
	compose(isSuccessfulResponse, getHttpResponse);

// ---

/*
 * Example SDK method
 */

// TODO: Think about what's best to return: Promise | Async
const withdraw = (account: Account, amount: number): Promise<Account> => {
	const request: Partial<HttpRequest<Record<any, any>>> = {
		method: HttpRequestMethod.POST,
		url: "http://localhost:3000/account/:id/withdraw",
		pathParams: {
			id: account.id.toString()
		},
		body: { amount }
	}

	const client =
		pipeK(
			httpClient(),
			jsonUnmarshaller()
		);

	const tokenPolicy = accessTokenPolicy();

	const createRequest = pipeK(
		defaultHeaders(tokenPolicy),
		jsonMarshaller()
	);

	const returnBody = pipeK(
		extractHttpResponse(),
		extractBody()
	);

	const retryRequest = pipeK(
		authorisationFailure(tokenPolicy),
		client,
		(result: HttpResult) => resultHandler()(result)
	);

	const resultHandler = (): HttpResultHandler =>
		ifElse(isSuccessfulResult, returnBody, retryRequest)

	const result: typeof Async = pipeK(
		createRequest,
		client,
		resultHandler()
	)(request);

	return result.toPromise();
};

const account: Account = {
	id: 1,
	name: "My Account",
	balance: 10
};

(async function run() {
	console.log(JSON.stringify(await withdraw(account, 10)));
}());
