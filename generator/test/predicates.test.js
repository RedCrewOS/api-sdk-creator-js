"use strict";

const { Pair, isDefined, map } = require("crocks");

const { assertThat, is } = require("hamjest");

const { isInbuiltType } = require("../src/predicates");

describe("predicates", function() {
	describe("isInbuiltType", function() {
		const newPair = (key) => Pair(key, true)
		const dataTypes = map(newPair, [
			"integer",
			"number",
			"string",
			"boolean"
		]);

		dataTypes.push(Pair("Foo", false));

		dataTypes.forEach((dataType) => {
			it(toTestName(dataType), function() {
				assertThat(isInbuiltType(dataType.fst()), is(dataType.snd()));
			});
		});

		function toTestName(dataType) {
			return [
				"should determine if",
				dataType.fst(),
				"is",
				dataType.snd() ? undefined : "not",
				"inbuilt type"
			]
			.filter(isDefined)
			.join(" ")
		}
	});
});

