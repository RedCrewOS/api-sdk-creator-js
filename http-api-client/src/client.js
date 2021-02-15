"use strict"

/**
 * A HttpApiClient knows how to interact with an API endpoint.
 *
 * It knows how to construct a request to be suitable for interacting with the endpoint.
 *
 * It knows how to convert API data into something consumable by an application.
 *
 * It knows how to handle HTTP errors (even if that means returning them).
 *
 * @typedef {function} HttpApiClient
 * @param {HttpRequest} request
 * @returns {Async} A resolution with the {@link HttpResponse}, or a rejection with the error.
 */

/**
 * A HttpClient deals strictly with {@link UnstructuredData} types. To use a HttpClient with
 * structured data (JSON, XML, etc) consumers of the HttpClient will need to be able to marshal
 * and unmarshal structured data to/from unstructured data types.
 *
 * Making a request will return the response regardless of what the response represents (ie: success or failure).
 *
 * @typedef {function} HttpClient
 * @param {HttpRequest} request
 * @returns {Async} A resolution of {@link HttpResult}, or a rejection with the error
 *
 * Errors should only be used to indicate unrecoverable problems like a network being unavailable.
 */

/**
 * The result of sending an {@link HttpRequest} to an endpoint.
 *
 * Includes the original request sent to allow handlers to recover after a failure by modifying
 * the request and trying again.
 *
 * TODO: Consider replacing with a State monad.
 *
 * @typedef {object} HttpResult
 * @property {HttpRequest} request
 * @property {HttpResponse} response
 */

/**
 * Manipulates the HttpRequest to conform to specific requirements of the endpoint
 *
 * eg: Adding an access token
 *
 * @typedef {function} HttpRequestPolicy
 * @param {HttpRequest} request
 * @returns {Async} An updated {@link HttpRequest}
 */

/**
 * Examines and handles the result of calling an endpoint.
 *
 * @typedef {function} HttpResultHandler
 * @param {HttpResult} result
 * @returns {Async} The updated {@link HttpResult}
 */

/**
 * Handles a {@link HttpResponse}
 *
 * @typedef {function} HttpResponseHandler
 * @param {HttpResponse} response
 * @returns {Async} The updated {@link HttpResponse}
 */
