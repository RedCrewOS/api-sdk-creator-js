"use strict";

const All = require("crocks/All");

const binary = require("crocks/helpers/binary");
const compose = require("crocks/helpers/compose");
const concat = require("crocks/pointfree/concat");
const constant = require("crocks/combinators/constant");
const curry = require("crocks/helpers/curry");
const fanout = require("crocks/Pair/fanout");
const getProp = require("crocks/Maybe/getProp");
const ifElse = require("crocks/logic/ifElse");
const isSame = require("crocks/predicates/isSame");
const isString = require("crocks/predicates/isString");
const map = require("crocks/pointfree/map");
const mapReduce = require("crocks/helpers/mapReduce");
const merge = require("crocks/pointfree/merge");
const mreduce = require("crocks/helpers/mreduce");
const option = require("crocks/pointfree/option");
const or = require("crocks/logic/or");
const pipe = require("crocks/helpers/pipe");
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

// isInbuiltType :: String -> Boolean
const isInbuiltType =
	mapReduce(isSame, binary(or), constant(false), inBuiltTypes)

// isCompoundType :: String -> Object | String -> Boolean
const isCompoundType = (type) =>
	ifElse(
		isString,
		isSame(type),
		isType(type)
	)

// isArrayType :: Object | String -> Boolean
const isArrayType = isCompoundType("array");

// isObjectType :: Object | String -> Boolean
const isObjectType = isCompoundType("object")

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
