"use strict";

const All = require("crocks/All");

const binary = require("crocks/helpers/binary");
const compose = require("crocks/helpers/compose");
const concat = require("crocks/pointfree/concat");
const constant = require("crocks/combinators/constant");
const curry = require("crocks/helpers/curry");
const fanout = require("crocks/Pair/fanout");
const getProp = require("crocks/Maybe/getProp");
const isSame = require("crocks/predicates/isSame");
const isString = require("crocks/predicates/isString");
const map = require("crocks/pointfree/map");
const merge = require("crocks/pointfree/merge");
const mreduce = require("crocks/helpers/mreduce");
const option = require("crocks/pointfree/option");
const or = require("crocks/logic/or");
const pipe = require("crocks/helpers/pipe");
const reduce = require("crocks/pointfree/reduce");
const valueOf = require("crocks/pointfree/valueOf");

const { inBuiltTypes } = require("./types");

// testProp :: String -> (a -> Boolean) -> Object -> Boolean
const testProp = curry((prop, pred) =>
	compose(option(false), map(pred), getProp(prop))
)

// isType :: a -> Object -> Boolean
const isType =
	compose(testProp("type"), isSame)

// allStringValues = [ a ] -> Boolean
const allStringValues =
	compose(mreduce(All), map(isString))

// isInBuiltTypes :: [ (String -> Boolean) ]
const isInBuiltTypes =
	map(isSame, inBuiltTypes)

// isInbuiltType :: String -> Boolean
const isInbuiltType =
	reduce(binary(or), constant(false), isInBuiltTypes)

const isArrayType = isType("array");

// isObjectType :: Object -> Boolean
const isObjectType = isType("object")

// isEnumType :: Object -> Boolean
const isEnumType =
	pipe(
		fanout(
			compose(All, isType("string")),
			compose(All, testProp("enum", allStringValues))
		),
		merge(compose(valueOf, concat))
	)

module.exports = {
	isArrayType,
	isEnumType,
	isInbuiltType,
	isObjectType
}
