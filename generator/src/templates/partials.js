"use strict";

const Async = require("crocks/Async");

const ap = require("crocks/pointfree/ap");
const compose = require("crocks/helpers/compose");
const flip = require("crocks/combinators/flip");

const { readTemplatesFromDir } = require("./templates");
const { registerPartial } = require("./wrappers");

// addPartials :: String -> Handlebars -> Async Error Handlebars
const addPartials = (language) =>
	compose(flip(ap, readTemplatesFromDir(registerPartial, language, "partials")), Async.of)

module.exports = {
	addPartials
}
