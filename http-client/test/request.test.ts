const Async = require("crocks/Async");

import {
	assertThat,
	equalTo,
	hasProperty,
	instanceOf,
	is,
	isRejectedWith,
	promiseThat
} from "hamjest";

import {
	addHeaders,
	createHeaders,
	HttpRequest,
	HttpRequestMethod,
	RequestHeaders
} from "../src";

describe("Http Request", function() {
	describe("adding headers", function() {
		let request: HttpRequest;

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

			const result: HttpRequest =
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

			const result: HttpRequest =
				await addHeaders(Async.of(headers), Object.freeze(request)).toPromise();

			assertThat(result.headers, hasProperty("x-app-header", equalTo(headers["x-app-header"])));
		});

		it("should use function to create headers", async function() {
			const headers = {
				"x-app-header": "abc123"
			};

			const createHeaders = () => Async.of(headers);

			const result: HttpRequest =
				await addHeaders(createHeaders, Object.freeze(request)).toPromise();

			assertThat(result.headers, hasProperty("x-app-header", equalTo(headers["x-app-header"])));
		})
	});

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
});
