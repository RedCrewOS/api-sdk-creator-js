"use strict";

const Async = require("crocks/Async");

const ap = require("crocks/pointfree/ap");
const contramap = require("crocks/pointfree/contramap");
const flip = require("crocks/combinators/flip");

const { languageDir, readTemplatesFromDir } = require("./templates");
const { registerPartial } = require("./wrappers");

// applyToHandlebars :: Async Error (Handlebars -> Handlebars) -> Handlebars -> Async Error Handlebars
const applyToHandlebars = (fn) =>
	contramap(Async.of, flip(ap, fn))

// addPartials :: String -> Handlebars -> Async Error Handlebars
const addPartials = (language) =>
	applyToHandlebars(readTemplatesFromDir(registerPartial, languageDir(language)))

module.exports = {
	addPartials
}
