"use strict";

const Async = require("crocks/Async");

const pipe = require("crocks/helpers/pipe");

const { join, split } = require("@epistemology-factory/crocks-ext/String");

const deepFreeze = require("deep-freeze");
const {
	assertThat,
	is,
	isRejectedWith,
	promiseThat
} = require("hamjest");

const { marshallerFor, unmarshallerFor } = require("../src/marshaller");

describe("Marshalling", function() {
	const reverse = (a) => a.reverse()

	const transformer =
		pipe(
			split(""),
			reverse,
			join(""),
			Async.of
		)

	describe("marshallerFor", function() {
		let request;

		beforeEach(function() {
			request = {
				headers: {},
				body: "Hello World"
			};
		});

		it("should set content type", async function() {
			const contentType = "text/plain;charset=utf8";

			const result = await marshall(contentType);

			assertThat(result.headers["content-type"], is(contentType));
		});

		it("should set no content type when no request body", async function() {
			request.body = undefined;

			const result = await marshall();

			assertThat(result.headers["content-type"], is(undefined));
		});

		it("should not marshall body when no request body", async function() {
			request.body = undefined;

			const result = await marshall();

			assertThat(result.body, is(undefined));
		});

		it("should marshall request body", async function() {
			const result = await marshall();

			assertThat(result.body, is("dlroW olleH"));
		});

		it("should return error when error marshalling request body", async function() {
			const err = new Error("Something went wrong");
			const transform = () => Async.Rejected(err)

			await promiseThat(marshall("text/plain", transform), isRejectedWith(err));
		});

		function marshall(contentType= "text/plain", transform = transformer) {
			// freeze the request to make sure we don't modify anything
			request = deepFreeze(request);

			return marshallerFor(contentType, transform)(Object.freeze(request)).toPromise();
		}
	});

	describe("unmarshallerFor", function() {
		let result;

		beforeEach(function() {
			result = {
				response: {
					headers: {
						"content-type": "text/plain ; charset=utf8"
					},
					body: "dlroW olleH"
				}
			};
		});

		it("should unmarshall response body", async function() {
			const result = await unmarshall();

			assertThat(result.response.body, is("Hello World"));
		});

		it("should not unmarshall response body when content type does not match", async function() {
			const body = JSON.stringify({});
			result.response.body = body;
			result.response.headers["content-type"] = "application/json";

			const outcome = await unmarshall();

			assertThat(outcome.response.body, is(body));
		});

		it("should not unmarshall response body when no response body", async function() {
			result.response.body = undefined;

			const outcome = await unmarshall();

			assertThat(outcome.response.body, is(undefined));
		});

		it("should return error when error unmarshalling response body", async function() {
			const err = new Error("Something went wrong");
			const transform = () => Async.Rejected(err)

			await promiseThat(unmarshall("text/plain", transform), isRejectedWith(err));
		});

		function unmarshall(contentType = "text/plain", transform = transformer) {
			return unmarshallerFor(contentType, transform)(result).toPromise();
		}
	});
});
