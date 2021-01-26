const deepFreeze = require("deep-freeze");

import { assertThat, instanceOf, is, isRejectedWith, promiseThat } from "hamjest";

import {
	HttpRequest,
	HttpResult,
	HttpResponse,
	JSONObject,
	JSON_MIME_TYPE,
	jsonMarshaller,
	jsonUnmarshaller
} from "../src";

describe("JSON Marshalling", function() {
	const body = {
		a: 1,
		b: {
			x: "y"
		},
		c: true
	};

	describe("marshaller", function() {
		let request: HttpRequest;

		beforeEach(function() {
			request = {
				headers: {},
				body
			} as HttpRequest;
		})

		it("should set content type", async function() {
			const contentType = "application/json+vnd";
			const result: HttpRequest = await marshall(contentType);

			assertThat(result.headers["content-type"], is(contentType));
		});

		it("should default content type", async function() {
			const result: HttpRequest = await marshall();

			assertThat(result.headers["content-type"], is(JSON_MIME_TYPE));
		});

		it("should set no content type when no request body", async function() {
			request.body = undefined;

			const result: HttpRequest = await marshall();

			assertThat(result.headers["content-type"], is(undefined));
		});

		it("should not stringify body when no request body", async function() {
			request.body = undefined;

			const result: HttpRequest = await marshall();

			assertThat(result.body, is(undefined));
		});

		it("should stringify request body", async function() {
			const result: HttpRequest = await marshall();

			assertThat(result.body, is(JSON.stringify(request.body)));
		});

		it("should reject when error marshalling request body", async function() {
			request.body = {};
			request.body.a = BigInt(Number.MAX_SAFE_INTEGER + 1)

			await promiseThat(marshall(), isRejectedWith(instanceOf(Error)));
		});

		function marshall(contentType?: string): Promise<HttpRequest<string>> {
			// freeze the request to make sure we don't modify anything
			request = deepFreeze(request);

			return jsonMarshaller(contentType)(Object.freeze(request)).toPromise();
		}
	});

	describe("unmarshaller", function() {
		let result: HttpResult;

		beforeEach(function() {
			result = {
				response: {
					body: JSON.stringify(body)
				} as HttpResponse
			} as HttpResult;
		});

		it("should unmarshall response body", async function() {
			const result = await unmarshall();

			assertThat(result.response.body, is(body));
		});

		it("should reject when error unmarshalling response body", async function() {
			result.response.body = "undefined";

			await promiseThat(unmarshall(), isRejectedWith(instanceOf(Error)));
		});

		function unmarshall(): Promise<HttpResult<any, JSONObject>> {
			return jsonUnmarshaller()(result).toPromise();
		}
	});
});
