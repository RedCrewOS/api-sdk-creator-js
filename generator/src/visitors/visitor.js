"use strict";

const compose = require("crocks/helpers/compose");
const curry = require("crocks/helpers/curry");
const fromPairs = require("crocks/helpers/fromPairs");
const identity = require("crocks/combinators/identity");
const map = require("crocks/pointfree/map");
const pipe = require("crocks/helpers/pipe");
const substitution = require("crocks/combinators/substitution");
const toPairs = require("crocks/Pair/toPairs");

const { sequenceResult } = require("../result");

// visitObject :: (a -> Result Error Object) -> Object -> Result Error Object
const visitObject = curry((fn) =>
	pipe(
		toPairs,
		sequenceResult(sequenceResult(fn)),

		// (Result Error (List (Pair String SchemaObject)))
		map(fromPairs)
	)
)

// visitObjectWith :: (Object -> (a -> Result Error Object)) -> Object -> Object -> Result Error Object
const visitObjectWith = curry((fn) =>
	compose(visitObject, fn)
)

// visitComponentObject :: (Object -> Object -> Result Error Object) -> Object -> Result Error Object
const visitComponentObject = curry((fn) =>
	pipe(
		substitution(compose(visitObjectWith(fn)), identity)
	)
)

module.exports = {
	visitComponentObject,
	visitObject,
	visitObjectWith
}
