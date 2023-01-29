"use strict";

const pipeK = require("crocks/helpers/pipeK");

const { getProp } = require("@epistemology-factory/crocks-ext/Async");
const { readJSON } = require("@epistemology-factory/crocks-ext/node/fs");

const { missingProp } = require("./errors");
const { resolveRefsInComponentsObject } = require("./visitors/references");
const { resolveImportsInComponentsObject } = require("./visitors/imports");
const { standardiseComponentsObject } = require("./visitors/standardise");

// parseComponentsObject :: Object -> Async Error ComponentsObject
const parseComponentsObject =
	pipeK(getProp(missingProp, "components"), pipeK(
		standardiseComponentsObject,
		resolveRefsInComponentsObject,
		resolveImportsInComponentsObject
	))

// parse :: Object -> Async Error ComponentsObject
const parse =
	pipeK(
		parseComponentsObject
	)

// parseFile :: String -> Async Error ComponentsObject
const parseFile =
	pipeK(
		readJSON,
		parse
	)

module.exports = {
	parse,
	parseFile
}
