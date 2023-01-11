"use strict";

const assign = require("crocks/helpers/assign");
const binary = require("crocks/helpers/binary");
const compose = require("crocks/helpers/compose");
const curry = require("crocks/helpers/curry");
const flip = require("crocks/combinators/flip");
const objOf = require("crocks/helpers/objOf");
const pipe = require("crocks/helpers/pipe");

const prettier = require("prettier");

// prettierFormatter :: String -> Object -> String
const prettierFormatter =
	binary(prettier.format.bind(prettier))

// prettierOpts :: Object -> Object
const prettierOpts =
	assign({})

// format :: String -> String -> String
const format = curry(pipe(
	compose(prettierOpts, objOf("parser")),
	flip(prettierFormatter)
))

const formatTypescript = format("typescript");

module.exports = {
	format,
	formatTypescript
}
