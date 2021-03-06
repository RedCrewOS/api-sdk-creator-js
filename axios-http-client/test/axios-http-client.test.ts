import { Readable } from "stream";
import {
	allOf,
	assertThat,
	equalTo, hasProperty,
	instanceOf,
	is,
	isRejectedWith,
	promiseThat
} from "hamjest";
import nock from "nock";

import {
	HttpClient,
	HttpRequest,
	HttpRequestMethod,
	HttpResult
} from "@api-sdk-creator/http-api-client";

import { createAxiosHttpClient } from "../src/axios-http-client";

const origin = "http://localhost:3000";
const pathname = "/";

describe("Axios HttpClient", function() {
	let request: HttpRequest;
	let client: HttpClient;

	beforeEach(function() {
		request = {
			method: HttpRequestMethod.GET,
			url: new URL(`${origin}${pathname}`),
			headers: {},
			pathParams: {},
			queryParams: {},
			body: ""
		};

		client = createAxiosHttpClient();
	})

	afterEach(function() {
		nock.cleanAll();
	});

	describe("request", function() {
		describe("method", function() {
			it("should default to GET if method not set", async function() {
				nock(origin)
					.get(pathname)
					.reply(200, "");

				delete (request as any).method;

				await client(request).toPromise();

				assertThat(nock.isDone(), is(true));
			});

			for (const method in HttpRequestMethod) {
				if (HttpRequestMethod.hasOwnProperty(method)) {
					it(`should use ${method} method`, async function() {
						nock(origin)
							.intercept(pathname, method)
							.reply(200, "");

						request.method = method as HttpRequestMethod;

						await client(request).toPromise();

						assertThat(nock.isDone(), is(true));
					});
				}
			}
		});

		describe("url", function() {
			beforeEach(function() {
				nock(origin)
					.get(pathname)
					.reply(200, "");
			});

			it("should use URL from URL", async function() {
				await client(request).toPromise();

				assertThat(nock.isDone(), is(true));
			});

			it("should use URL from string", async function() {
				request.url = request.url.toString();

				await client(request).toPromise();

				assertThat(nock.isDone(), is(true));
			});
		});

		describe("headers", function() {
			it("should copy headers", async function() {
				nock(origin, {
					reqheaders: {
						authorization: 'Basic Auth',
						'content-type': 'text/plain'
					},
				})
				.get(pathname)
				.reply(200, "");

				request.headers = {
					authorization: 'Basic Auth',
					'content-type': 'text/plain'
				}

				await client(request).toPromise();

				assertThat(nock.isDone(), is(true));
			});
		});

		describe("path params", function() {
			it("should replace slugs with values", async function() {
				const id = "123";

				request.url = `${origin}/:id`;
				request.pathParams = {
					id
				};

				nock(origin)
					.get(`/${id}`)
					.reply(200, "");

				await client(request).toPromise();

				assertThat(nock.isDone(), is(true));
			});
		});

		describe("query params", function() {
			it("should append query parameters", async function() {
				nock(origin)
					.get(`${pathname}?a=1&x=foo`)
					.reply(200, "");

				request.queryParams = {
					a: "1",
					x: "foo"
				};

				await client(request).toPromise();

				assertThat(nock.isDone(), is(true));
			});
		});

		describe("body", function() {
			beforeEach(function() {
				request.method = HttpRequestMethod.POST;
			});

			it("should write buffer into request", async function() {
				const bytes = [ 0xff, 0x11 ];

				nock(origin)
					.post(pathname, Buffer.from(bytes))
					.reply(200, "");

				request.body = Buffer.from(bytes);

				await client(request).toPromise();

				assertThat(nock.isDone(), is(true));
			});

			it("should write stream into request", async function() {
				const body = "This is some data";

				nock(origin)
					.post(pathname, body)
					.reply(200, "");

				request.body = Readable.from(body);

				await client(request).toPromise();

				assertThat(nock.isDone(), is(true));
			});

			it("should write string into request", async function() {
				const body = "This is some data";

				nock(origin)
					.post(pathname, body)
					.reply(200, "");

				request.body = body;

				await client(request).toPromise();

				assertThat(nock.isDone(), is(true));
			});
		});
	});

	describe("response", function() {
		describe("errors", function() {
			it("should reject when non HTTP error occurs", async function() {
				// not nocking the endpoint should result in a connection refused.
				await promiseThat(
					client(request).toPromise(), isRejectedWith(
						allOf(instanceOf(Error), hasProperty("code", equalTo("ECONNREFUSED")))
					)
				);
			});
		});

		describe("status", function() {
			it("should return success status code", async function() {
				nock(origin).get(pathname).reply(200, "");

				const result: HttpResult = await client(request).toPromise();

				assertThat(result.response.statusCode, is(200));
			});

			/*
			 * HttpClient libraries often treat errors differently from success eg: throw rather than return.
			 */
			it("should return error status code", async function() {
				nock(origin).get(pathname).reply(500);

				const result: HttpResult = await client(request).toPromise();

				assertThat(result.response.statusCode, is(500));
			});

			it("should return status message", async function() {
				nock(origin).get(pathname).reply(404, function () {
					// @ts-ignore
					this.req.response.statusMessage = "Not Found"

					return "";
				});

				const result: HttpResult = await client(request).toPromise();

				assertThat(result.response.statusMessage, is("Not Found"));
			});
		});

		describe("headers", function() {
			it("should return headers", async function() {
				const headers = {
					"x-my-header": "value",
					"x-my-other-header": "other value"
				};

				nock(origin).get(pathname).reply(200, "", headers);

				const result: HttpResult = await client(request).toPromise();

				assertThat(result.response.headers, is(equalTo(headers)));
			});

			it("should lowercase all headers", async function() {
				const headers = {
					"x-MY-Header": "value"
				};

				nock(origin).get(pathname).reply(200, "", headers);

				const result: HttpResult = await client(request).toPromise();

				assertThat(result.response.headers, is(equalTo({
					"x-my-header": "value"
				})));
			});
		});

		describe("body", function() {
			it("should return buffer", async function() {
				const bytes = [ 0xff, 0x11 ];

				nock(origin).get(pathname).reply(200, Buffer.from(bytes));

				client = createAxiosHttpClient({
					responseType: "arraybuffer"
				});

				const result: HttpResult = await client(request).toPromise();

				assertThat(result.response.body, is(equalTo(Buffer.from(bytes))));
			});

			it("should return stream", async function() {
				const body = "This is some data";

				nock(origin).get(pathname).reply(200, Readable.from(body));

				client = createAxiosHttpClient({
					responseType: "stream"
				});

				const result: HttpResult = await client(request).toPromise();
				assertThat(result.response.body, is(instanceOf(Readable)));

				const data = await waitForStream(result.response.body as Readable);
				assertThat(data, is(body));
			});

			it("should default to string response", async function() {
				const body = "This is some data";

				nock(origin).get(pathname).reply(200, body);

				client = createAxiosHttpClient();

				const result: HttpResult = await client(request).toPromise();
				assertThat(result.response.body, is(body));
			});

			it("should not automatically try to parse JSON", async function() {
				const body = "{ \"a\": 1 }";

				nock(origin).get(pathname).reply(200, body);

				client = createAxiosHttpClient({
					responseType: "text"
				});

				const result: HttpResult = await client(request).toPromise();
				assertThat(result.response.body, is(body));
			});

			it("should returned undefined when no content returned from server", async function() {
				nock(origin).get(pathname).reply(200, "", { "content-length": "0" });

				client = createAxiosHttpClient();

				const result: HttpResult = await client(request).toPromise();

				// make sure we've returned the response
				assertThat(result.response.statusCode, is(200));
				assertThat(result.response.body, is(undefined));
			});

			it("should returned undefined when 204 response from server", async function() {
				nock(origin).get(pathname).reply(204, "", { "content-type": "text/plain" });

				client = createAxiosHttpClient();

				const result: HttpResult = await client(request).toPromise();

				// make sure we've returned the response
				assertThat(result.response.statusCode, is(204));
				assertThat(result.response.body, is(undefined));
			});
		});
	});
});

function waitForStream(stream: Readable): Promise<string> {
	return new Promise((resolve) => {
		const chunks: string[] = [];

		stream.setEncoding("utf8");
		stream.on("data", chunks.push.bind(chunks));
		stream.on("end", () => resolve(chunks.join("")));
	});
}
