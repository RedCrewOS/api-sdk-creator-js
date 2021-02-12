const Async = require("crocks/Async");

const assign = require("crocks/helpers/assign");
const constant = require("crocks/combinators/constant");
const curry = require("crocks/core/curry");
const flip = require("crocks/combinators/flip");
const getPropOr = require("crocks/helpers/getPropOr");
const identity = require("crocks/combinators/identity");
const ifElse = require("crocks/logic/ifElse");
const isFunction = require("crocks/core/isFunction");
const liftA2 = require("crocks/helpers/liftA2");
const map = require("crocks/pointfree/map");
const pipe = require("crocks/helpers/pipe");
const setProp = require("crocks/helpers/setProp");

export enum HttpRequestMethod {
	GET = "GET",
	HEAD = "HEAD",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
	CONNECT = "CONNECT",
	OPTIONS = "OPTIONS",
	TRACE = "TRACE",
	PATCH = "PATCH"
}

export type RequestHeaders = Record<string, string>;

/**
 * In order to be as generic as possible properties on the request try to align with the
 * underlying structure of an HTTP request.
 *
 * Adapters will have to map properties to the request object structure used by the underlying
 * HTTP client library.
 */
export interface HttpRequest<T = any> {
	method: HttpRequestMethod;
	url: URL | string;
	headers: RequestHeaders;

	/** Used to replace path parameters/slugs in the request url */
	pathParams?: Record<string, string>;

	queryParams?: Record<string, string>;

	body?: T;
}

/**
 * Factory definition to create request headers.
 *
 * Returns an Async value as creating some headers (eg: Authorization) may require
 * async work to be done (ie: fetching an access token).
 *
 * @param To be used if one header value depends on another. Should not be modified.
 * @returns A new set of headers that will be merged with existing headers.
 */
// RequestHeaderFactory :: RequestHeaders -> Async RequestHeaders
export type RequestHeaderFactory = (headers: RequestHeaders) => typeof Async;

/**
 * Creates a {@link HttpRequestPolicy} to add headers to a request
 */
// addHeaders :: (Async Object | () -> Async Object) -> HttpRequestPolicy
export const addHeaders = curry(
	(headers: typeof Async | (() => typeof Async), request: HttpRequest): typeof Async => {
		const prop = "headers";
		const headersFactory = ifElse(isFunction, identity, constant)(headers);

		return pipe(
			pipe(getPropOr({}, prop), Async.of),
			liftA2(assign, headersFactory()),
			map(flip(setProp(prop))(request))
		)(request)
	});
