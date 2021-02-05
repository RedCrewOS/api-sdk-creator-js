const Async = require("crocks/Async");

import {
	assertThat,
	equalTo,
	hasProperty,
	instanceOf,
	isRejectedWith,
	promiseThat
} from "hamjest";

import { bearerToken, createHeaders, RequestHeaders } from "../src";

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

		it("should return error if trying to modify headers", async function() {
			const badFactory = (headers: RequestHeaders) => {
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
});
