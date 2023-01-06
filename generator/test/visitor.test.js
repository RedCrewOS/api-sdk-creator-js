"use strict";

const { Result, identity } = require("crocks");

const { assertThat, equalTo, hasProperty } = require("hamjest");
const { throwContents } = require("@epistemology-factory/crocks-ext/utils");

const { visitComponentObject, visitObject, visitObjectWith } = require("../src/visitors/visitor");

describe("Visitors", function() {
	const add = (a) => b => Result.Ok(a + b);
	const inc = add(1);
	const addWith = ({ a }) => add(a);

	describe("visitObject", function() {
		it("should visit object", function() {
			const result = visitObject(inc, { a: 1 }).either(throwContents, identity);

			assertThat(result, hasProperty("a", equalTo(2)));
		});
	});

	describe("visitObjectWith", function() {
		it("should visit object", function() {
			const result = visitObjectWith(addWith, { a: 1 }, { b: 2 }).either(throwContents, identity);

			assertThat(result, hasProperty("b", equalTo(3)));
		});
	});

	describe("visitComponentObject", function() {
		it("should visit object", function() {
			const result = visitComponentObject(addWith, { a: 1 }).either(throwContents, identity);

			assertThat(result, hasProperty("a", equalTo(2)));
		});
	});
});
