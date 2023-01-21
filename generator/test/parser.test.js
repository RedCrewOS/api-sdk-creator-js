"use strict";

const { allOf, hasProperty, instanceOf, isRejectedWith, promiseThat } = require("hamjest");

const { parse } = require("../src/parser");

describe("parser", function() {
	it("should return error if components object not found", async function() {
		await promiseThat(parse({}).toPromise(), isRejectedWith(allOf(
			instanceOf(Error),
			hasProperty("message", "Missing mandatory prop 'components'")
		)));
	})
});
