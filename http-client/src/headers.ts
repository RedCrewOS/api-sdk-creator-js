const Async = require("crocks/Async");
const Endo = require("crocks/Endo");

const assign = require("crocks/helpers/assign");
const concat = require("crocks/pointfree/concat");
const chain = require("crocks/pointfree/chain");
const curry = require("crocks/core/curry");
const flip = require("crocks/combinators/flip");
const map = require("crocks/pointfree/map");
const mconcatMap = require("crocks/helpers/mconcatMap");
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
