"use strict";

const compose = require("crocks/helpers/compose");
const flip = require("crocks/combinators/flip");
const map = require("crocks/pointfree/map");
const pipeK = require("crocks/helpers/pipeK");

const hbs = require("handlebars");

const { addHelpers } = require("./helpers");
const { addPartials } = require("./partials");
const { compile } = require("./wrappers");

// compileTemplate :: Async Error Handlebars -> String -> Async Error (a -> String)
const compileTemplate = flip(
	compose(map, compile)
)

// newHbs :: String -> Async Error Handlebars
const newHbs = (language) =>
	pipeK(
		addHelpers,
		addPartials(language)
	)(hbs.create())

module.exports = {
	compileTemplate,
	newHbs
}
