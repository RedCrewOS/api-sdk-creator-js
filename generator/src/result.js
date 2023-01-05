"use strict";

const Result = require("crocks/Result");

const compose = require("crocks/helpers/compose");
const map = require("crocks/pointfree/map");
const sequence = require("crocks/pointfree/sequence");

// sequenceResult :: Functor f => (a -> Result b c) -> f a -> Result b (f c)
const sequenceResult = (fn) =>
	compose(sequence(Result), map(fn))

module.exports = {
	sequenceResult
}
