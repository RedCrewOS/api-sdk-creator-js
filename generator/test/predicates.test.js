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
		const types = [
			Pair("array", isArrayType),
			Pair("object", isObjectType)
		];

		types.forEach((type) => {
			const name = type.fst();
			const pred = type.snd();

			it(`should match ${name} type from object def`, function() {
				assertThat(pred({ type: name }), is(true));
			});

			it(`should match ${name} type from string`, function() {
				assertThat(pred(name), is(true));
			});
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

