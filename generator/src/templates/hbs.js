"use strict";

const path = require("path");

const Async = require("crocks/Async");

const ap = require("crocks/pointfree/ap");
const applyTo = require("crocks/combinators/applyTo");
const bimap = require("crocks/pointfree/bimap");
const compose = require("crocks/helpers/compose");
const constant = require("crocks/combinators/constant");
const curry = require("crocks/helpers/curry");
const flip = require("crocks/combinators/flip");
const identity = require("crocks/combinators/identity");
const map = require("crocks/pointfree/map");
const merge = require("crocks/pointfree/merge");
const pipe = require("crocks/helpers/pipe");
const pipeK = require("crocks/helpers/pipeK");
const reduce = require("crocks/pointfree/reduce");
const substitution = require("crocks/combinators/substitution");

const hbs = require("handlebars");

const { readDirContents } = require("@epistemology-factory/crocks-ext/node/fs");
const { split } = require("@epistemology-factory/crocks-ext/String");

// first :: [ a ] -> a
const first = (arr) => arr[0]

// last :: [ a ] -> a
const last = (arr) => arr[arr.length - 1]

// withHbs :: (Handlerbars -> Unit) -> Handlebars -> Handlebars
const withHbs = substitution(constant)

// registerPartial :: String -> String -> Handlebars -> Handlebars
const registerPartial = curry((name, partial) =>
	withHbs((hbs) => hbs.registerPartial(name, partial))
)

// templatesDir :: String
const templatesDir = path.resolve(__dirname, "../../templates");

// dirPath :: String -> String -> String
const dirPath = curry((language, dir) =>
	`${templatesDir}/${language}/${dir}`
)

// toPartialName -> String -> String
const toPartialName =
	pipe(
		compose(last, split(path.sep)),
		compose(first, split("."))
	)

// reduceTemplates :: (String -> String -> Handlebars -> Handlebars) -> [ Pair String ] -> (Handlebars -> Handlebars)
const reduceTemplates = (fn) =>
	pipe(
		map(compose(merge(fn), bimap(toPartialName, identity))),

		// [ (Handlebars -> Handlebars) ]
		flip(reduce(applyTo))
	)

// readTemplatesFromDir :: (String -> String -> Handlebars) -> String -> String -> Async Error (Handlebars -> Handlebars)
const readTemplatesFromDir = curry((fn, language, dir) =>
	map(reduceTemplates(fn), readDirContents({ encoding: "utf8" }, dirPath(language, dir)))
)

// addPartials :: String -> Handlebars -> Async Error Handlebars
const addPartials = (language) =>
	compose(flip(ap, readTemplatesFromDir(registerPartial, language, "partials")), Async.of)

// newHbs :: String -> Async Error Handlebars
const newHbs = (language) =>
	pipeK(
		addPartials(language)
	)(hbs.create())

module.exports = {
	newHbs
}
