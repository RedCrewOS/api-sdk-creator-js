"use strict";

const { Pair, isDefined, map } = require("crocks");

const { assertThat, is } = require("hamjest");

const {
	isArrayType,
	isEnumType,
	isInbuiltType,
	isObjectType
} = require("../src/predicates");

describe("predicates", function() {
	describe("inbuilt types", function() {
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

	describe("compound types", function() {
		it("should match object type", function() {
			assertThat(isObjectType({ type: "object" }), is(true));
		});

		it("should match array type", function() {
			assertThat(isArrayType({ type: "array" }), is(true));
		})
	});

	describe("enum types", function() {
		it("should match string enum", function() {
			const enumType = {
				type: "string",
				enum: [ "a", "b", "c" ]
			}

			assertThat(isEnumType(enumType), is(true));
		});
	});
});

