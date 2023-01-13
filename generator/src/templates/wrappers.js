"use strict";

const applyTo = require("crocks/combinators/applyTo");
const constant = require("crocks/combinators/constant");
const curry = require("crocks/helpers/curry");
const flip = require("crocks/combinators/flip");
const reduce = require("crocks/pointfree/reduce");
const substitution = require("crocks/combinators/substitution");

// applyHandlebarsTo :: [ (Handlebars -> Handlebars) ] -> Handlebars -> Handlebars
const applyHandlebarsTo =
	flip(reduce(applyTo))

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
	registerHelper,
	registerPartial
}
