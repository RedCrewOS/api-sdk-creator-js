"use strict";

const Async = require("crocks/Async");

const { assertThat, equalTo, hasProperty, is } = require("hamjest");

const {addHeaders, HttpRequestMethod } = require("../src");

describe("Http Request", function() {
	describe("adding headers", function() {
		let request;

		beforeEach(function() {
			request = {
				url: "http://localhost:8080",
				method: HttpRequestMethod.GET,
				headers: {
					"authorization": "foo"
				},
			};
		})

		it("should add to existing headers", async function() {
			const headers = {
				"x-app-header": "abc123"
			};

			/** @type {HttpRequest} */
			const result =
				await addHeaders(Async.of(headers), Object.freeze(request)).toPromise();

			assertThat(result.headers, hasProperty("authorization", equalTo(request.headers.authorization)));
			assertThat(result.headers, hasProperty("x-app-header", equalTo(headers["x-app-header"])));
			assertThat(result.url, is(request.url));
			assertThat(result.method, is(request.method));
		});

		it("should default headers if no headers present", async function() {
			// @ts-ignore
			delete request.headers;

			const headers = {
				"x-app-header": "abc123"
			};

			/** @type {HttpRequest} */
			const result =
				await addHeaders(Async.of(headers), Object.freeze(request)).toPromise();

			assertThat(result.headers, hasProperty("x-app-header", equalTo(headers["x-app-header"])));
		});

		it("should use function to create headers", async function() {
			const headers = {
				"x-app-header": "abc123"
			};

			const createHeaders = () => Async.of(headers);

			/** @type {HttpRequest} */
			const result =
				await addHeaders(createHeaders, Object.freeze(request)).toPromise();

			assertThat(result.headers, hasProperty("x-app-header", equalTo(headers["x-app-header"])));
		})
	});
});
