"use strict"

const Async = require("crocks/Async");
const Endo = require("crocks/Endo");

const assign = require("crocks/helpers/assign");
const concat = require("crocks/pointfree/concat");
const chain = require("crocks/pointfree/chain");
const curry = require("crocks/core/curry");
const flip = require("crocks/combinators/flip");
const map = require("crocks/pointfree/map");
const mconcatMap = require("crocks/helpers/mconcatMap");
const objOf = require("crocks/helpers/objOf");
const pipe = require("crocks/helpers/pipe");
const valueOf = require("crocks/pointfree/valueOf");

const { joinPair } = require("@epistemology-factory/crocks-ext/String");
const { prepend } = require("@epistemology-factory/crocks-ext/helpers");

/**
 * @typedef {object} HttpHeaders
 */

// concatHeaders :: RequestHeaderFactory -> HttpHeaders -> Async HttpHeaders
const concatHeaders = curry((factory, headers) =>
	pipe(
		factory,
		map(pipe(assign(headers), Object.freeze))
	)(headers)
);

// toBearerToken :: String -> String
const toBearerToken = joinPair(" ", "Bearer");

// toAuthorisationHeader :: String -> HttpHeaders
const toAuthorisationHeader = objOf("authorization");

/**
 * Creates a {@link RequestHeadersFactory} using {@link RequestHeaderFactory}s
 */
// createHeaders :: Foldable RequestHeaderFactory -> RequestHeadersFactory
const createHeaders =
	pipe(
		/*
		 * Reduces the Foldable to function composition (using the Endo Monoid) where the result
		 * of the factory call is passed to each subsequent function, and the results chained
		 * together (since each factory returns a Async)
		 */
		mconcatMap(Endo, pipe(concatHeaders, chain)),
		prepend(Endo(() => Async.of(Object.freeze({})))),
		valueOf
	);

/**
 * Adds a bearer token to request headers
 */
// bearerToken :: (() -> Async string) -> RequestHeaderFactory
const bearerToken = curry((accessToken, _) =>
	pipe(
		accessToken,
		map(pipe(toBearerToken, toAuthorisationHeader))
	)()
);

/**
 * Adds the given header to a {@link HttpRequest}
 */
// constantHeaders :: HttpHeaders -> RequestHeaderFactory
const constantHeaders = curry(
	(headers, _) => Async.of(headers)
);

module.exports = {
	createHeaders,
	bearerToken,
	constantHeaders
}
