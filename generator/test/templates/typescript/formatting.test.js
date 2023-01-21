"use strict";

const { identity } = require("crocks");
const { assertThat, defined, instanceOf, is } = require("hamjest");

const { throwContents, throwResult } = require("@epistemology-factory/crocks-ext/utils");

const { formatTypescript } = require("../../../src/templates/prettier");

describe("typescript formatting", function() {
	it("should format typescript", function() {
		const result = formatTypescript("interface Foo{}").either(throwContents, identity);

		assertThat(result, is(defined()));
	});

	it("should return error when formatting invalid typescript", function() {
		const result = formatTypescript("interface Foo").either(identity, throwResult);

		assertThat(result, is(instanceOf(Error)));
	});
});
