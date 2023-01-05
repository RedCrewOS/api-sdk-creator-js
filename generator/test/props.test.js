"use strict";

const { assertThat, equalTo, is } = require("hamjest");
const { Result, identity } = require("crocks");
const { throwContents, throwResult } = require("@epistemology-factory/crocks-ext/utils");

const { missingPropError } = require("./matchers/errors");
const { modifyProp } = require("../src/props");

describe("props", function() {
	describe("modifyProp", function() {
		it("should return error if prop not found", function() {
			const prop = "foo";
			const result = modifyProp(prop, identity, {}).either(identity, throwResult);

			assertThat(result, is(missingPropError(prop)));
		});

		it("should map prop", function() {
			const inc = (x) => Result.Ok(x + 1)
			const prop = "a"
			const obj = {
				a: 1,
				b: 2,
				c: 3
			}

			const result = modifyProp(prop, inc, obj).either(throwContents, identity);

			assertThat(result, is(equalTo({
				...obj,
				a: 2
			})));
		});
	});
});
