"use strict";

const applyTo = require("crocks/combinators/applyTo");
const binary = require("crocks/helpers/binary");
const constant = require("crocks/combinators/constant");
const curry = require("crocks/helpers/curry");
const flip = require("crocks/combinators/flip");
const reduce = require("crocks/pointfree/reduce");
const substitution = require("crocks/combinators/substitution");
const unary = require("crocks/helpers/unary");

// applyHandlebarsTo :: [ (Handlebars -> Handlebars) ] -> Handlebars -> Handlebars
const applyHandlebarsTo =
	flip(reduce(applyTo))

// compile :: String -> Handlebars -> (a -> String)
const compile = binary((template, hbs) =>
	/*
	 * `hbs.compile` will produce a binary function, however we just want a function that
	 * takes a single argument.
	 */
	unary(hbs.compile(template))
)

// withHbs :: (Handlerbars -> Unit) -> Handlebars -> Handlebars
const withHbs = substitution(constant)

// registerHelper :: String -> ((*) -> a) -> Handlebars -> Handlebars
const registerHelper = curry((name, fn) =>
	withHbs((hbs) => hbs.registerHelper(name, fn))
)

// registerPartial :: String -> String -> Handlebars -> Handlebars
const registerPartial = curry((name, partial) =>
	withHbs((hbs) => hbs.registerPartial(name, partial))
)

module.exports = {
	applyHandlebarsTo,
	compile,
	registerHelper,
	registerPartial
}
