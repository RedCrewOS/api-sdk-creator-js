"use strict"

const Async = require("crocks/Async");

const assign = require("crocks/helpers/assign");
const compose = require("crocks/helpers/compose");
const curry = require("crocks/core/curry");
const identity = require("crocks/combinators/identity");
const ifElse = require("crocks/logic/ifElse");
const flip = require("crocks/combinators/flip");
const liftA2 = require("crocks/helpers/liftA2");
const maybePropOr = require("crocks/helpers/getPropOr");
const map = require("crocks/pointfree/map");
const setProp = require("crocks/helpers/setProp");
const substitution = require("crocks/combinators/substitution");

const { getProp } = require("@epistemology-factory/crocks-ext/Async");
const { prepend } = require("@epistemology-factory/crocks-ext/helpers");

const { isRelativeUrl } = require("./predicates");
const { newError } = require("./errors");

// getPropOr :: a -> String -> b -> Async c
const getPropOr = curry((def, prop) =>
	compose(Async.Resolved, maybePropOr(def, prop))
)

// updateProp :: String -> Object -> a
const updateProp =
	compose(flip, setProp)

// missingRequestProp :: String -> Error
const missingRequestProp = (prop) =>
	newError(`'${prop}' is missing in request`)

// updateRequest :: Functor m => String -> (HttpRequest -> m Error b) -> HttpRequest -> m Error HttpResult
const updateRequest = curry((prop) =>
	substitution(compose(map, updateProp(prop)))
)

// modifyRequest :: String -> (Async Error a -> Async Error b) -> HttpRequest -> Async Error HttpRequest
const modifyRequest = curry((prop, fn) =>
	updateRequest(prop, compose(fn, getProp(missingRequestProp, prop)))
)

// modifyRequestOr :: a -> String -> (Async b -> Async c) -> HttpRequest -> Async Error HttpRequest
const modifyRequestOr = curry((def, prop, fn) =>
	updateRequest(prop, compose(fn, getPropOr(def, prop)))
)

/**
 * Defines the various HTTP request methods (verbs)
 *
 * @enum {string}
 */
const HttpRequestMethod = {
	GET: "GET",
	HEAD: "HEAD",
	POST: "POST",
	PUT: "PUT",
	DELETE: "DELETE",
	CONNECT: "CONNECT",
	OPTIONS: "OPTIONS",
	TRACE: "TRACE",
	PATCH: "PATCH"
}

/**
 * In order to be as generic as possible properties on the request try to align with the
 * underlying structure of an HTTP request.
 *
 * Adapters will have to map properties to the request object structure used by the underlying
 * HTTP client library.
 *
 * @typedef {object} HttpRequest
 * @property {HttpRequestMethod} method
 * @property {URL | string} url
 * @property {HttpHeaders} headers
 * @property {object} [pathParams] Values to substitute into path params
 * @property {object} [queryParams] Used to create a query string
 * @property {any} [body] A body for the request
 */

/**
 * Factory to create request headers.
 *
 * Returns an Async value as creating some headers (eg: Authorization) may require
 * async work to be done (ie: fetching an access token).
 *
 * @typedef {function} RequestHeaderFactory
 * @param {object} headers To be used if one header value depends on another. Should not be modified.
 * @returns {Async} A new set of headers.
 */

/**
 * Factory definition to create a set of HTTP headers.
 *
 * Returns an Async value as creating some headers (eg: Authorization) may require
 * async work to be done (ie: fetching an access token).
 *
 * @typedef {function} RequestHeadersFactory
 * @returns {Async} A new set of headers.
 */

/**
 * Creates a {@link HttpRequestPolicy} to add headers to a request
 */
// addHeaders :: RequestHeadersFactory -> HttpRequestPolicy
const addHeaders = curry((factory) =>
	modifyRequestOr({}, "headers", liftA2(assign, factory()))
)

/**
 * Resolves a relative URL in a {@link HttpRequest} to an absolute URL.
 *
 * Leaves absolute URLs unchanged.
 *
 * Takes a base URL to resolve to, followed by a request.
 */
// resolveUrl :: String -> HttpRequestPolicy
const resolveUrl = curry((base) =>
	modifyRequest("url", map(ifElse(
		isRelativeUrl,
		prepend(base),
		identity
	)))
);

module.exports = {
	HttpRequestMethod,
	addHeaders,
	resolveUrl
}
