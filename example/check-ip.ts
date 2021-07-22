/*
 * Example using api-sdk-creator to check your IP address.
 *
 * This sends a HTTP GET request for some JSON data and prints the results.
 */
const Async = require("crocks/Async");

const either = require("crocks/pointfree/either");
const isDefined = require("crocks/predicates/isDefined");
const pipe = require("crocks/helpers/pipe");
const pipeK = require("crocks/helpers/pipeK");
const safe = require("crocks/Maybe/safe");

import {
	addHeaders,
	constantHeaders,
	createHeaders,
	extractHttpBody,
	HttpApiClient,
	HttpClient,
	HttpRequestMethod,
	jsonMarshaller,
	jsonUnmarshaller
} from "@api-sdk-creator/http-api-client";

import { createAxiosHttpClient } from "@api-sdk-creator/axios-http-client";

/*
 * A factory function to define a pipeline of work for sending API requests to a server.
 *
 * This factory would use the result of any SDK configuration or any other data to create the
 * initial pipeline.
 */
const apiClient: (httpClient: HttpClient) => HttpApiClient = (client) =>
	/*
	 * Define a pipeline of work that
	 * 1. Adds the default headers to every HTTP request
	 * 2. Converts any request body to JSON using the default JSON content type
	 * 3. Sends the request to a server by using a HttpClient function which wraps an existing
	 *    HTTP client library.
	 *
	 * The library specific pieces have been abstracted away behind function types allowing for
	 * injection of any compatible function and thus any compatible library.
	 *
	 * When the pipeline is run with a request, if any of these functions return a Async.Rejected,
	 * the overall result of the pipeline will be an Error which SDK specific operations will
	 * need to pass back to client applications, or handle internally.
	 *
	 * The use of the `pipeK` function is used to pipe the result of each expression to the next
	 * expression in the sequence. We take advantage of Kleisli arrows (hence the K) to pipe
	 * (top to bottom) monad returning functions together.
	 *
	 * For an introduction to Kleisli arrows, see https://blog.ssanj.net/posts/2017-06-07-composing-monadic-functions-with-kleisli-arrows.html
	 */
	pipeK(
		/*
		 * Create the function that will add default headers to every HTTP request.
		 *
		 * If this results in an Async.Rejected, when the HTTP request is piped through the API
		 * definition the Error would be returned.
		 *
		 * Alternatively in an SDK, this type of factory would be invoked near SDK initialisation,
		 * which would give the opportunity to fail fast and not even continue the rest of the SDK
		 * instantiation.
		 */
		addHeaders(createHeaders([ constantHeaders({ "x-client-name": "api-sdk-creator-js"}) ])),
		jsonMarshaller(),
		client,
		jsonUnmarshaller(),

		/*
		 * Finally extract the response body from the HttpResult and return it to the SDK caller.
		 *
		 * If the result from the HTTP call is a Async.Rejected, then this function wont be called.
		 *
		 * This is the beauty of monads in action as we don't even have to think about error
		 * handling thanks to the polymorphic behaviour of monads.
		 *
		 * If the extraction process fails because there is no JSON data then the contract has been
		 * violated. We therefore convert the result to an Async.Rejected with an error so that
		 * callers can handle the violation appropriately. Because the function is lazy, it wont
		 * create the error until it's needed.
		 *
		 * We have stay within the context of an Async so if we get a response body we need to lift
		 * it
		 */
		pipe(
			extractHttpBody,
			safe(isDefined),
			either(() => Async.Rejected(new Error("Didn't get any JSON data")), Async.of)
		)
	)

/*
 * This mimics an SDK specific operation. Here we want to check the IP of the computer we're
 * running on.
 *
 * `checkIp` takes a HttpApiClient to send the request through.
 */
const checkIp: (client: HttpApiClient) => typeof Async = (client) =>
	/*
 	 * The operation specific components of the request.
	 */
	client({
		method: HttpRequestMethod.GET,
		url: "http://ifconfig.co/json",
		headers: {}
	})

async function main() {
	/*
	 * We can use Async's `toPromise` method to bridge the gap between the Crocks world and
	 * "normal" asynchronous Javascript
	 */
	const result = await checkIp(apiClient(createAxiosHttpClient())).toPromise()

	console.log(result);
}

main()
