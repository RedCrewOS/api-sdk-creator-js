"use strict";

const path = require("path");

const bimap = require("crocks/pointfree/bimap");
const compose = require("crocks/helpers/compose");
const curry = require("crocks/helpers/curry");
const identity = require("crocks/combinators/identity");
const map = require("crocks/pointfree/map");
const merge = require("crocks/pointfree/merge");
const pipe = require("crocks/helpers/pipe");

const { readDirContents } = require("@epistemology-factory/crocks-ext/node/fs");
const { split } = require("@epistemology-factory/crocks-ext/String");
const { applyHandlebarsTo } = require("./wrappers");

// templatesDir :: String
const templatesDir = path.resolve(__dirname, "../../templates");

// languageDir :: String -> String -> String
const languageDir = curry((language, dir) =>
	`${templatesDir}/${language}/${dir}`
)

// first :: [ a ] -> a
const first = (arr) => arr[0]

// last :: [ a ] -> a
const last = (arr) => arr[arr.length - 1]

// toTemplateName -> String -> String
const toTemplateName =
	pipe(
		compose(last, split(path.sep)),
		compose(first, split("."))
	)

// reduceTemplates :: (String -> String -> Handlebars -> Handlebars) -> [ Pair String ] -> (Handlebars -> Handlebars)
const reduceTemplates = (fn) =>
	pipe(
		map(compose(merge(fn), bimap(toTemplateName, identity))),
		applyHandlebarsTo
	)

// readTemplatesFromDir :: (String -> String -> Handlebars) -> String -> Async Error (Handlebars -> Handlebars)
const readTemplatesFromDir = curry((fn) =>
	compose(map(reduceTemplates(fn)), readDirContents({ encoding: "utf8" }))
)

module.exports = {
	languageDir,
	readTemplatesFromDir
}
