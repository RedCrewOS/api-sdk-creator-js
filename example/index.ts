const {
	getProp,
	ifElse,
	maybeToAsync,
	partial,
	pipe,
	pipeK,
	Async,
} = require("crocks");

import {
	HttpClient,
	HttpRequest,
	HttpRequestMethod,
	HttpResult,
	HttpResultHandler,
	JSONObject,
	RequestHeaderFactory,
	UnstructuredData,
	addHeaders,
	bearerToken,
	createHeaders,
	getHttpResponse,
	getHttpBody,
	isSuccessfulResult,
	jsonMarshaller,
	jsonUnmarshaller
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

				if (!request.headers.authorization || request.headers.authorization === "Bearer ") {
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

const authorisationFailure: (accessToken: RequestHeaderFactory) => HttpResultHandler =
	(accessToken: RequestHeaderFactory) => {
		let count = 0;

		return (result: HttpResult): typeof Async => {
			try {
				if (count === 0) {
					return addHeaders(bearerToken(accessToken), result.request)
						.map((request: HttpRequest) => ({
							request,
							response: result.response
						}));
				}

				return Async.of(result);
			}
			finally {
				count++;
			}
		};
	};

// ---

/*
 * Policies
 */

const accessTokenPolicy: () => typeof Async = () => {
	let count = 0;

	return (): typeof Async => {
		try {
			if (count > 0) {
				trace("Reauthorising");

				return Async.of("abc123");
			}
			else {
				trace("No access token");

				return Async.of("");
			}
		}
		finally {
			count++;
		}
	};
}

// ---

/*
 * Example SDK method
 */

// TODO: Think about what's best to return: Promise | Async
const withdraw = (account: Account, amount: number): Promise<Account> => {
	const request: Partial<HttpRequest<JSONObject>> = {
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

	const defaultHeaders = createHeaders([
		() => Async.of({ "x-application-header": "abc123" }),
		bearerToken(tokenPolicy)
	]);

	const createRequest = pipeK(
		addHeaders(defaultHeaders),
		jsonMarshaller()
	);

	const returnBody = pipe(
		getHttpResponse,
		getHttpBody,
		Async.of
	);

	const retryRequest = pipeK(
		authorisationFailure(tokenPolicy),
		maybeToAsync(null, getProp("request")),
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
