import { HttpRequest } from "./http-request";
import { HttpResponse } from "./http-response";

const Async = require("crocks/Async");

/**
 * Data type that does not have a pre-defined data model/type definition.
 */
export type UnstructuredData = Buffer | NodeJS.ReadableStream | ReadableStream | string;

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
