"use strict";

const Async = require("crocks/Async");

const ap = require("crocks/pointfree/ap");
const compose = require("crocks/helpers/compose");
const flip = require("crocks/combinators/flip");

const { languageDir, readTemplatesFromDir } = require("./templates");
const { registerPartial } = require("./wrappers");

// applyToHandlebars :: Async Error (Handlebars -> Handlebars) -> Handlebars -> Async Error Handlebars
const applyToHandlebars = (fn) =>
	compose(flip(ap, fn), Async.of)

// addPartials :: String -> Handlebars -> Async Error Handlebars
const addPartials = (language) =>
	applyToHandlebars(readTemplatesFromDir(registerPartial, languageDir(language)))

module.exports = {
	addPartials
}
