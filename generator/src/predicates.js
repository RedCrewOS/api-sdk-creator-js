"use strict";

const binary = require("crocks/helpers/binary");
const constant = require("crocks/combinators/constant");
const isSame = require("crocks/predicates/isSame");
const map = require("crocks/pointfree/map");
const or = require("crocks/logic/or");
const reduce = require("crocks/pointfree/reduce");

// [ (String -> Boolean) ]
const inbuiltTypes =
	map(isSame, [
		"integer",
		"number",
		"string",
		"boolean"
	])

// isInbuiltType :: String -> Boolean
const isInbuiltType =
	reduce(binary(or), constant(false), inbuiltTypes)

module.exports = {
	isInbuiltType
}
