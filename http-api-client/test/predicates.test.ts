import { HttpResponse, HttpResult, isSuccessfulResponse, isSuccessfulResult } from "../src";

import { assertThat, is } from "hamjest";

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
			data.forEach((datum: any) => {
				const successOrNot = datum.successful ? "successful" : "unsuccessful";

				it(`should determine that ${datum.code} is ${successOrNot}`, function() {
					const response: HttpResponse = givenHttpResponse(datum.code);

					assertThat(isSuccessfulResponse(response), is(datum.successful));
				});
			});
		});

		describe("successful result", function() {
			data.forEach((datum: any) => {
				const successOrNot = datum.successful ? "successful" : "unsuccessful";

				it(`should determine that ${datum.code} is ${successOrNot}`, function() {
					const result: HttpResult = { response: givenHttpResponse(datum.code) } as HttpResult;

					assertThat(isSuccessfulResult(result), is(datum.successful));
				});
			});
		});

		function givenHttpResponse(code: number): HttpResponse {
			return {
				statusCode: code
			} as HttpResponse;
		}
	});
});
