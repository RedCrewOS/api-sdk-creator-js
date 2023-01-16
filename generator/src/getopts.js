"use strict";

const binary = require("crocks/helpers/binary");
const compose = require("crocks/helpers/compose");
const constant = require("crocks/combinators/constant");
const map = require("crocks/pointfree/map");
const substitution = require("crocks/combinators/substitution");
const tryCatch = require("crocks/Result/tryCatch");
const pipeK = require("crocks/helpers/pipeK");

const { Command } = require("commander");

const { getProp } = require("@epistemology-factory/crocks-ext/Result");

/*
 * Because the object remembers state, we need a new one each time.
 */
// newCommand :: () -> Command
const newCommand = () => {
	const program = new Command();

	return program
		.option(
			"-l, --language <language>",
			"The language to generate code for; defaults to typescript",
			"typescript"
		)
		.option(
			"-o, --outdir <outdir>",
			"The directory to place generated files"
		)
		.option(
			"-s, --spec <file>",
			"The openapi spec to process"
		)
}

// parse :: Commander -> String -> Result Error Object
const parse = binary(tryCatch(
	(program, text) => program.parse(text).opts()
))

// missingFlag :: String -> String
const missingFlag = (flag) =>
	new Error(`'${flag}' option is missing`)

// validateFlag :: String -> Object -> Result Error Object
const validateFlag = (flag) =>
	substitution(
		compose(map, constant),
		compose(getProp(missingFlag, flag))
	)

// validateOutDirOpt :: Object -> Result Error Object
const validateOutDirOpt = validateFlag("outdir")

// validateSpecOpt :: Object -> Result Error Object
const validateSpecOpt = validateFlag("spec")

// validateOpts = Object -> Result Error Object
const validateOpts =
	pipeK(
		validateOutDirOpt,
		validateSpecOpt
	)

/*
 * Can't be point free as we need a new Command created
 * each time.
 */
// getOpts :: [ String ] -> Result Error Object
const getOpts = (argv) =>
	pipeK(
		parse(newCommand()),
		validateOpts
	)(argv)

module.exports = {
	getOpts
}
