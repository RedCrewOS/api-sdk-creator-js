"use strict";

const Async = require("crocks/Async");

const {
	assertThat,
	equalTo,
	hasProperty,
	instanceOf,
	isRejectedWith,
	promiseThat
} = require("hamjest");

const { bearerToken, constantHeaders, createHeaders }  = require("../src");

describe("Headers", function() {
	describe("header factory", function() {
		const factoryOne = () => Async.of({ "x-application-name": "project" });
		const factoryTwo = () => Async.of({ "x-api-key": "abc123" });

		it("should create request headers", async function() {
			const factory = createHeaders([ factoryOne, factoryTwo ]);
			const headers = await factory().toPromise();

			assertThat(headers, hasProperty("x-application-name", equalTo("project")));
			assertThat(headers, hasProperty("x-api-key", equalTo("abc123")));
		});

		/*
		 * Note: Object.freeze will only throw an error if the runtime is in "strict" mode.
		 * Else it will silently ignore the modification
		 *
		 * @see https://stackoverflow.com/a/9119952/586182
		 */
		it("should return error if trying to modify headers", async function() {
			const badFactory = (headers) => {
				headers.foo = "bar";

				return Async.of(headers);
			};

			await promiseThat(
				createHeaders([ badFactory ])().toPromise(),
				isRejectedWith(instanceOf(Error))
			);

			await promiseThat(
				createHeaders([ factoryOne, badFactory ])().toPromise(),
				isRejectedWith(instanceOf(Error))
			);
		});
	});

	describe("bearer token factory", function() {
		it("should create authorization header", async function() {
			const token = "abc123";

			const result = await bearerToken(() => Async.of(token), {}).toPromise();

			assertThat(result, hasProperty("authorization", equalTo(`Bearer ${token}`)));
		});
	});

	describe("constant headers factory", function() {
		it("should return provided headers", async function() {
			const headers = {
				"x-application-name": "project",
				"x-api-key": "abc123"
			}

			const result = await constantHeaders(headers, {}).toPromise();

			assertThat(result, hasProperty("x-application-name", equalTo("project")));
			assertThat(result, hasProperty("x-api-key", equalTo("abc123")));
		});
	});
});
