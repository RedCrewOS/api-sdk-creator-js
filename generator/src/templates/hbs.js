"use strict";

const pipeK = require("crocks/helpers/pipeK");

const hbs = require("handlebars");

const { addHelpers } = require("./helpers");
const { addPartials } = require("./partials");

// newHbs :: String -> Async Error Handlebars
const newHbs = (language) =>
	pipeK(
		addHelpers,
		addPartials(language)
	)(hbs.create())

module.exports = {
	newHbs
}
