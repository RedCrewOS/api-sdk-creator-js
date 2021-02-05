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

import { RequestHeaderFactory, RequestHeaders } from "./request";

// concatHeaders :: RequestHeaderFactory -> RequestHeaders -> RequestHeaders
const concatHeaders = curry((factory: RequestHeaderFactory, headers: RequestHeaders) =>
	pipe(
		factory,
		map(pipe(assign(headers), Object.freeze))
	)(headers)
);

// concatString :: String -> String -> String
const concatString = curry((a: string, b: string): string => `${a} ${b}`);

// toBearerToken :: String -> String
const toBearerToken = concatString("Bearer");

// toAuthorisationHeader :: String -> RequestHeaders
const toAuthorisationHeader = objOf("authorization");

/**
 * Creates a set of headers using {@link RequestHeaderFactory}s
 */
// createHeaders :: [ RequestHeaderFactory ] -> (() -> Async RequestHeaders)
export const createHeaders: (factory: RequestHeaderFactory[]) => (() => typeof Async) =
	pipe(
		mconcatMap(Endo, pipe(concatHeaders, chain)),
		flip(concat)(Endo(() => Async.of(Object.freeze({})))),
		valueOf
	);

/**
 * Adds a bearer token to request headers
 */
// bearerToken :: (() -> Async string) -> RequestHeaders -> Async RequestHeaders
export const bearerToken = curry(
	(accessToken: () => typeof Async, _: RequestHeaders): typeof Async =>
		pipe(
			accessToken,
			map(pipe(toBearerToken, toAuthorisationHeader))
		)()
);
