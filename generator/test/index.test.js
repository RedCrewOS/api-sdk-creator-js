"use strict";

const { assertThat, is } = require("hamjest");

const { add } = require("../src/index");

describe("index", function() {
	it("should add", function() {
		assertThat(add(1, 2), is(3));
	})
});
