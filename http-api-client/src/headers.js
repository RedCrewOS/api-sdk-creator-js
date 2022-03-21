"use strict"

const Async = require("crocks/Async");
const Endo = require("crocks/Endo");

const assign = require("crocks/helpers/assign");
const chain = require("crocks/pointfree/chain");
const compose = require("crocks/helpers/compose");
const composeB = require("crocks/combinators/composeB");
const contramap = require("crocks/pointfree/contramap");
const curry = require("crocks/core/curry");
const map = require("crocks/pointfree/map");
const mreduceMap = require("crocks/helpers/mreduceMap");
const objOf = require("crocks/helpers/objOf");
const pipe = require("crocks/helpers/pipe");
const substitution = require("crocks/combinators/substitution");

const { joinPair } = require("@epistemology-factory/crocks-ext/String");

/**
 * @typedef {object} HttpHeaders
 */

// concatHeaders :: RequestHeaderFactory -> HttpHeaders -> Async HttpHeaders
const concatHeaders = curry((factory) =>
	substitution(
		compose(map, composeB(Object.freeze), assign),
		factory
	)
)

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
		mreduceMap(Endo, pipe(concatHeaders, chain)),
		contramap(() => Async.Resolved(Object.freeze({})))
	);

/**
 * Adds a bearer token to request headers
 *
 * Takes a factory that knows to obtain a token to insert into a request.
 */
// bearerToken :: (() -> Async string) -> () -> RequestHeaderFactory
const bearerToken = curry((accessToken, _) =>
	pipe(
		accessToken,
		map(pipe(toBearerToken, toAuthorisationHeader))
	)()
);

/**
 * Adds the given header to a {@link HttpRequest}
 */
// constantHeaders :: HttpHeaders -> () -> RequestHeaderFactory
const constantHeaders = curry(
	(headers, _) => Async.of(headers)
);

module.exports = {
	createHeaders,
	bearerToken,
	constantHeaders
}
