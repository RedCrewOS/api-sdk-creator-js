"use strict";

const curry = require("crocks/helpers/curry");
const pipeK = require("crocks/helpers/pipeK");
const resultToAsync = require("crocks/Async/resultToAsync");

const { getOpts } = require("./getopts");
const { parseFile } = require("./parser");
const { renderComponentsObject } = require("./visitors/renderer");

(async function main() {
	// parseOpts :: Async Error Object
	const parseOpts = resultToAsync(getOpts)

	// generator :: Object -> Async Error ComponentsObject
	const generator = curry(({ language, outdir, spec }) =>
		pipeK(
			parseFile,
			renderComponentsObject(outdir, language)
		)(spec)
	)

	// program :: [ String ] -> Async Error ComponentsObject
	const program = pipeK(
		parseOpts,
		generator
	);

	await program(process.argv).toPromise();
}());
