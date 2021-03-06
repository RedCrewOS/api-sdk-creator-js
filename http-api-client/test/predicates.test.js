"use strict";

const { assertThat, is } = require("hamjest");

const { isSuccessfulResponse, isSuccessfulResult } = require("../src");

describe("predicates", function() {
	describe("is successful", function() {
		const data = [
			{
				code: 199,
				successful: false
			},
			{
				code: 200,
				successful: true
			},
			{
				code: 299,
				successful: true
			},
			{
				code: 300,
				successful: false
			}
		];

		describe("successful response", function() {
			data.forEach((datum) => {
				const successOrNot = datum.successful ? "successful" : "unsuccessful";

				it(`should determine that ${datum.code} is ${successOrNot}`, function() {
					const response = givenHttpResponse(datum.code);

					assertThat(isSuccessfulResponse(response), is(datum.successful));
				});
			});
		});

		describe("successful result", function() {
			data.forEach((datum) => {
				const successOrNot = datum.successful ? "successful" : "unsuccessful";

				it(`should determine that ${datum.code} is ${successOrNot}`, function() {
					const result = { response: givenHttpResponse(datum.code) };

					assertThat(isSuccessfulResult(result), is(datum.successful));
				});
			});
		});

		function givenHttpResponse(code) {
			return {
				statusCode: code
			};
		}
	});
});
