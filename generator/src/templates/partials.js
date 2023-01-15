"use strict";

const Async = require("crocks/Async");

const ap = require("crocks/pointfree/ap");
const flip = require("crocks/combinators/flip");
const pipe = require("crocks/helpers/pipe");

const { languageDir, readTemplatesFromDir } = require("./templates");
const { registerPartial } = require("./wrappers");

// addPartials :: String -> Handlebars -> Async Error Handlebars
const addPartials = (language) =>
	pipe(
		Async.of,
		flip(ap, readTemplatesFromDir(registerPartial, languageDir(language, "partials")))
	)

module.exports = {
	addPartials
}
