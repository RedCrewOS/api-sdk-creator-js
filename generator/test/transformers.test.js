"use strict";

const { assertThat, equalTo, is } = require("hamjest");
const { Result, identity } = require("crocks");
const { throwContents, throwResult } = require("@epistemology-factory/crocks-ext/utils");

const { missingPropError } = require("./matchers/errors");
const { modifyProp, modifyPropIfPresent } = require("../src/transformers");

describe("transformers", function() {
	const inc = (x) => Result.Ok(x + 1)
	const prop = "a"
	const obj = {
		a: 1,
		b: 2,
		c: 3
	}

	describe("modifyProp", function() {
		it("should return error if prop not found", function() {
			const prop = "foo";
			const result = modifyProp(prop, identity, {}).either(identity, throwResult);

			assertThat(result, is(missingPropError(prop)));
		});

		it("should map prop", function() {
			const result = modifyProp(prop, inc, obj).either(throwContents, identity);

			assertThat(result, is(equalTo({
				...obj,
				a: 2
			})));
		});
	});

	describe("modifyPropIfPresent", function() {
		it("should return input if prop not present", function() {
			const result = modifyPropIfPresent("z", inc, obj).either(throwContents, identity);

			assertThat(result, is(obj));
		});

		it("should map prop if present", function() {
			const result = modifyPropIfPresent(prop, inc, obj).either(throwContents, identity);

			assertThat(result, is(equalTo({
				...obj,
				a: 2
			})));
		});
	});
});
