"use strict";

const pipeK = require("crocks/helpers/pipeK");

const hbs = require("handlebars");

const { addPartials } = require("./partials");

// newHbs :: String -> Async Error Handlebars
const newHbs = (language) =>
	pipeK(
		addPartials(language)
	)(hbs.create())

module.exports = {
	newHbs
}
