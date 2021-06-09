"use strict"

const Async = require("crocks/Async");

const assign = require("crocks/helpers/assign");
const curry = require("crocks/core/curry");
const defaultProps = require("crocks/helpers/defaultProps");
const flip = require("crocks/combinators/flip");
const getProp = require("crocks/Maybe/getProp");
const getPropOr = require("crocks/helpers/getPropOr");
const liftA2 = require("crocks/helpers/liftA2");
const maybeToAsync = require("crocks/Async/maybeToAsync");
const map = require("crocks/pointfree/map");
const objOf = require("crocks/helpers/objOf");
const pipe = require("crocks/helpers/pipe");
const setProp = require("crocks/helpers/setProp");

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
const addHeaders = curry((factory, request) => {
	const prop = "headers";

	return pipe(
		pipe(getPropOr({}, prop), Async.of),
		liftA2(assign, factory()),
		map(flip(setProp(prop))(request))
	)(request)
});

// resolveUrl :: String -> HttpRequestPolicy
const resolveUrl = curry((base, request) => {
	const prop = "url";

	return pipe(
		getProp(prop),
		map(curry((a, b) => `${a}${b}`)(base)),
		map(objOf(prop)),
		map(defaultProps(request)),
		maybeToAsync(new Error("'url' is missing in request"))
	)(request)
});

module.exports = {
	HttpRequestMethod,
	addHeaders,
	resolveUrl
}
