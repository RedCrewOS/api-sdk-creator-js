"use strict";

const Async = require("crocks/Async");
const constant = require("crocks/combinators/constant");

const {
	allOf,
	assertThat,
	equalTo,
	hasProperty,
	instanceOf,
	is,
	isRejectedWith,
	promiseThat
} = require("hamjest");

const { addHeaders, resolveUrl, HttpRequestMethod } = require("../src");

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
				await addHeaders(constant(Async.of(headers)), Object.freeze(request)).toPromise();

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
				await addHeaders(constant(Async.of(headers)), Object.freeze(request)).toPromise();

			assertThat(result.headers, hasProperty("x-app-header", equalTo(headers["x-app-header"])));
		});

		it("should return error if factory fails to create headers", async function() {
			const error = new Error("Can't create headers");

			const createHeaders = () => Async.Rejected(error);

			await promiseThat(
					addHeaders(createHeaders, Object.freeze(request)).toPromise(),
					isRejectedWith(error)
			);
		});
	});

	describe("resolving url", function() {
		const base = "http://localhost:3000";
		const path = "/v1/foo/bar";

		it("should join relative path to base", async function() {
			const result = await resolveUrl(base, {
				url: path
			}).toPromise();

			assertThat(result, hasProperty("url", equalTo(`${base}${path}`)));
		});

		it("should leave absolute url", async function() {
			const absoluteUrl = "http://foobar.com";

			const result = await resolveUrl(base, {
				url: absoluteUrl
			}).toPromise();

			assertThat(result, hasProperty("url", equalTo(absoluteUrl)));
		});

		it("should reject if url missing in request", async function() {
			await promiseThat(resolveUrl("", {}).toPromise(), isRejectedWith(allOf(
				instanceOf(Error),
				hasProperty("message", equalTo("'url' is missing in request"))
			)));
		});
	});
});
