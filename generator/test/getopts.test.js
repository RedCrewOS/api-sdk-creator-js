"use strict";

const { identity } = require("crocks");
const { throwContents, throwResult } = require("@epistemology-factory/crocks-ext/utils");
const {
	allOf,
	assertThat,
	equalTo,
	hasProperty,
	instanceOf,
	is
} = require("hamjest");

const { getOpts } = require("../src/getopts");

describe("getOpts", function() {
	const spec = "/tmp/spec.json";
	const specArg = `-s ${spec}`;

	describe("language", function() {
		const otherArgs = "--outdir /tmp";

		it("should return default if no language provided", function() {
			const result = getOpts(toArgs(otherArgs, specArg)).either(throwContents, identity);

			assertThat(result.language, is("typescript"));
		});

		it("should return language when language provided", function() {
			const language = `java`;
			const args = toArgs(otherArgs, `-l ${language}`, specArg);

			const result = getOpts(args).either(throwContents, identity);

			assertThat(result.language, is(language));
		});
	});

	describe("outdir", function() {
		const otherArgs = "";

		it("should return error if no outdir provided", function() {
			const result = getOpts(toArgs(otherArgs, specArg)).either(identity, throwResult);

			assertThat(result, isError("'outdir' option is missing"));
		});

		it("should return outdir provided", function() {
			const dir = "/tmp"
			const args = toArgs(otherArgs, `-o ${dir}`, specArg);
			const result = getOpts(args).either(throwContents, identity);

			assertThat(result.outdir, is(dir));
		});
	});

	describe("spec", function() {
		const otherArgs = "--outdir=/tmp";

		it("should return error if no spec provided", function() {
			const result = getOpts(toArgs(otherArgs)).either(identity, throwResult);

			assertThat(result, isError("'spec' option is missing"));
		});

		it("should return spec provided", function() {
			const result = getOpts(toArgs(otherArgs, specArg)).either(throwContents, identity);

			assertThat(result.spec, is(spec));
		});
	});

	function toArgs(...args) {
		const argv = args
			.slice()
			.map((item) => item.split(" "))
			.flat(2);

		return [ "/usr/bin/node", "script.ts" ].concat(argv)
	}

	function isError(message) {
		return allOf(
			instanceOf(Error),
			hasProperty("message", equalTo(message))
		)
	}
});
