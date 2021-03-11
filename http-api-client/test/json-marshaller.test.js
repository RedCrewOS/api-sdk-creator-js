"use strict";

const deepFreeze = require("deep-freeze");

const {
	allOf,
	assertThat,
	hasProperty,
	instanceOf,
	is,
	isRejectedWith,
	promiseThat
} = require("hamjest");

const {
	JSON_MIME_TYPE,
	jsonMarshaller,
	jsonUnmarshaller
} = require("../src");

describe("JSON Marshalling", function() {
	const body = {
		a: 1,
		b: {
			x: "y"
		},
		c: true
	};

	describe("marshaller", function() {
		let request;

		beforeEach(function() {
			request = {
				headers: {},
				body
			};
		})

		it("should set content type", async function() {
			const contentType = "application/json+vnd";

			const result = await marshall(contentType);

			assertThat(result.headers["content-type"], is(contentType));
		});

		it("should default content type", async function() {
			const result = await marshall();

			assertThat(result.headers["content-type"], is(JSON_MIME_TYPE));
		});

		it("should set no content type when no request body", async function() {
			request.body = undefined;

			const result = await marshall();

			assertThat(result.headers["content-type"], is(undefined));
		});

		it("should not stringify body when no request body", async function() {
			request.body = undefined;

			const result = await marshall();

			assertThat(result.body, is(undefined));
		});

		it("should stringify request body", async function() {
			const result = await marshall();

			assertThat(result.body, is(JSON.stringify(request.body)));
		});

		it("should reject when error marshalling request body", async function() {
			request.body = {};
			request.body.a = BigInt(Number.MAX_SAFE_INTEGER + 1)

			await promiseThat(marshall(), isRejectedWith(allOf(
				instanceOf(TypeError),
				hasProperty("message", "Do not know how to serialize a BigInt")
			)));
		});

		/**
		 * @param {string} [contentType]
		 * @return Promise<HttpRequest>
		 */
		function marshall(contentType) {
			// freeze the request to make sure we don't modify anything
			request = deepFreeze(request);

			return jsonMarshaller(contentType)(Object.freeze(request)).toPromise();
		}
	});

	describe("unmarshaller", function() {
		let result;

		beforeEach(function() {
			result = {
				response: {
					headers: {
						"content-type": `${JSON_MIME_TYPE} ; charset=utf8`
					},
					body: JSON.stringify(body)
				}
			};
		});

		it("should unmarshall JSON response body", async function() {
			const result = await unmarshall();

			assertThat(result.response.body, is(body));
		});

		it("should not unmarshall response body when content type is not json",
				async function() {
					const body = "This is not JSON";
					result.response.body = body;
					result.response.headers["content-type"] = "text/plain";

					const outcome = await unmarshall();

					assertThat(outcome.response.body, is(body));
				});

		it("should not unmarshall response body when no response body", async function() {
			result.response.body = undefined;

			const outcome = await unmarshall();

			assertThat(outcome.response.body, is(undefined));
		});

		it("should reject when error unmarshalling response body", async function() {
			result.response.body = "undefined";

			await promiseThat(unmarshall(), isRejectedWith(allOf(
				instanceOf(SyntaxError),
				hasProperty("message", "Unexpected token u in JSON at position 0")
			)));
		});

		/**
		 * @returns Promise<HttpResult>
		 */
		function unmarshall(contentType = JSON_MIME_TYPE) {
			return jsonUnmarshaller(contentType)(result).toPromise();
		}
	});
});
