"use strict";

const binary = require("crocks/helpers/binary");
const compose = require("crocks/helpers/compose");
const constant = require("crocks/combinators/constant");
const getProp = require("crocks/Maybe/getProp");
const isSame = require("crocks/predicates/isSame");
const map = require("crocks/pointfree/map");
const option = require("crocks/pointfree/option");
const or = require("crocks/logic/or");
const reduce = require("crocks/pointfree/reduce");

const { inBuiltTypes } = require("./types");

// isInBuiltTypes :: [ (String -> Boolean) ]
const isInBuiltTypes =
	map(isSame, inBuiltTypes)

// isInbuiltType :: String -> Boolean
const isInbuiltType =
	reduce(binary(or), constant(false), isInBuiltTypes)

// isCompoundType :: String -> Object -> Boolean
const isCompoundType = (type) =>
	compose(option(false), map(isSame(type)), getProp("type"))

const isArrayType = isCompoundType("array");

// isObjectType :: Object -> Boolean
const isObjectType = isCompoundType("object")

module.exports = {
	isArrayType,
	isInbuiltType,
	isObjectType
}
