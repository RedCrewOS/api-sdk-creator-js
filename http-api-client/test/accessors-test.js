"use strict";

const Maybe = require("crocks/Maybe");
const identity = require("crocks/combinators/identity");
const isSameType = require("crocks/predicates/isSameType");

const { assertThat, is, typedError } = require("hamjest");

const { extractHttpBody, parseIntHeader } = require("../src/accessors");

describe("accessors", function() {
	it("should extract response body from result", async function() {
		const body = { a: 1, x: "foo" };

		const result = extractHttpBody(givenHttpResult(body));

		assertThat(result, is(body));
	});

	describe("header parsing", function() {
		describe("int headers", function() {
			it("should return nothing if header not present", function() {
				const result = parseIntHeader("x-header", {}).either(identity, identity);

				assertThat("Maybe.Nothing not returned", Maybe.Nothing().equals(result), is(true));
			});

			it("should return error is header value not a number", function() {
				const result = parseIntHeader("x-header", { "x-header": "abc" }).either(identity, identity);

				assertThat(result, is(typedError(Error, "'abc' is not a number")));
			});

			it("should parse int header", function() {
				const result = parseIntHeader("x-header", { "x-header": "123" }).either(identity, identity);

				assertThat("Just not returned", isSameType(Maybe, result), is(true));
				assertThat(result.either(identity, identity), is(123));
			});
		});
	});

	function givenHttpResult(body) {
		return {
			request: {},
			response: {
				body
			}
		}
	}
});
