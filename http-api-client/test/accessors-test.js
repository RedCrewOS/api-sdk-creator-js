"use strict";

const { assertThat, is } = require("hamjest");

const { extractHttpBody } = require("../src/accessors");

describe("accessors", function() {
	it("should extract response body from result", async function() {
		const body = { a: 1, x: "foo" };

		const result = extractHttpBody(givenHttpResult(body));

		assertThat(result, is(body));
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
