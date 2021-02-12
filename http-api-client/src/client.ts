import { HttpRequest } from "./request";
import { HttpResponse } from "./response";
import { UnstructuredData } from "./unstructured-data";

const Async = require("crocks/Async");

/**
 * A HttpApiClient knows how to interact with an API endpoint.
 *
 * It knows how to construct a request to be suitable for interacting with the endpoint.
 *
 * It knows how to convert API data into something consumable by an application.
 *
 * It knows how to handle HTTP errors (even if that means returning them).
 *
 * @returns A resolution with the {@link HttpResponse}, or a rejection with the error.
 */
export type HttpApiClient = (request: HttpRequest) => typeof Async;

/**
 * A HttpClient deals strictly with unstructured data types. To use a HttpClient with structured
 * data (JSON, XML, etc) consumers of the HttpClient will need to be able to marshal and
 * unmarshal structured data to/from unstructured data types.
 *
 * Making a request will return the response regardless of what the response represents (ie: success or failure).
 *
 * @returns A resolution of {@link HttpResult<UnstructuredData, UnstructuredData>}, or a rejection with the error
 *
 * Errors should only be used to indicate unrecoverable problems like a network being unavailable.
 */
export type HttpClient = (request: HttpRequest<UnstructuredData>) => typeof Async;

/**
 * The result of sending an {@link HttpRequest} to an endpoint.
 *
 * Includes the original request sent to allow handlers to recover after a failure by modifying
 * the request and trying again.
 *
 * TODO: Consider replacing with a State monad.
 */
export interface HttpResult<Request = any, Response = any> {
	request: HttpRequest<Request>;
	response: HttpResponse<Response>;
}

/**
 * Manipulates the HttpRequest to conform to specific requirements of the endpoint
 *
 * eg: Adding an access token
 *
 * @returns An Async with the modified request.
 */
export type HttpRequestPolicy<T = any> = (request: HttpRequest<T>) => typeof Async;

/**
 * @returns An Async with the modified result.
 */
export type HttpResultHandler<Request = any, Response = any> =
	(result: HttpResult<Request, Response>) => typeof Async;

/**
 * @returns An Async with the modified response.
 */
export type HttpResponseHandler<T = any> = (response: HttpResponse<T>) => typeof Async;