import { Readable } from "stream";
import { assertThat, equalTo, instanceOf, is } from "hamjest";
import nock from "nock";

import { HttpClient, HttpRequest, HttpRequestMethod } from "@sdk-creator/http-client";

import { axiosHttpClient } from "../src/axios-http-client";

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

		client = axiosHttpClient();
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

				await client(request);

				assertThat(nock.isDone(), is(true));
			});

			for (const method in HttpRequestMethod) {
				if (HttpRequestMethod.hasOwnProperty(method)) {
					it(`should use ${method} method`, async function() {
						nock(origin)
							.intercept(pathname, method)
							.reply(200, "");

						request.method = method as HttpRequestMethod;

						await client(request);

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
				await client(request);

				assertThat(nock.isDone(), is(true));
			});

			it("should use URL from string", async function() {
				request.url = request.url.toString();

				await client(request);

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

				await client(request);

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

				await client(request);

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

				await client(request);

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

				await client(request);

				assertThat(nock.isDone(), is(true));
			});

			it("should write stream into request", async function() {
				const body = "This is some data";

				nock(origin)
					.post(pathname, body)
					.reply(200, "");

				request.body = Readable.from(body);

				await client(request);

				assertThat(nock.isDone(), is(true));
			});

			it("should write string into request", async function() {
				const body = "This is some data";

				nock(origin)
					.post(pathname, body)
					.reply(200, "");

				request.body = body;

				await client(request);

				assertThat(nock.isDone(), is(true));
			});
		});
	});

	describe("response", function() {
		describe("status", function() {
			it("should return success status code", async function() {
				nock(origin).get(pathname).reply(200, "");

				const response = await client(request);

				assertThat(response.statusCode, is(200));
			});

			/*
			 * HttpClient libraries often treat errors differently from success eg: throw rather than return.
			 */
			it("should return error status code", async function() {
				nock(origin).get(pathname).reply(500);

				const response = await client(request);

				assertThat(response.statusCode, is(500));
			});

			it("should return status message", async function() {
				nock(origin).get(pathname).reply(404, function () {
					// @ts-ignore
					this.req.response.statusMessage = "Not Found"

					return "";
				});

				const response = await client(request);

				assertThat(response.statusMessage, is("Not Found"));
			});
		});

		describe("headers", function() {
			it("should return headers", async function() {
				const headers = {
					"x-my-header": "value",
					"x-my-other-header": "other value"
				};

				nock(origin).get(pathname).reply(200, "", headers);

				const response = await client(request);

				assertThat(response.headers, is(equalTo(headers)));
			});

			it("should lowercase all headers", async function() {
				const headers = {
					"x-MY-Header": "value"
				};

				nock(origin).get(pathname).reply(200, "", headers);

				const response = await client(request);

				assertThat(response.headers, is(equalTo({
					"x-my-header": "value"
				})));
			});
		});

		describe("body", function() {
			it("should return buffer", async function() {
				const bytes = [ 0xff, 0x11 ];

				nock(origin).get(pathname).reply(200, Buffer.from(bytes));

				client = axiosHttpClient({
					responseType: "arraybuffer"
				});

				const response = await client(request);

				assertThat(response.body, is(equalTo(Buffer.from(bytes))));
			});

			it("should return stream", async function() {
				const body = "This is some data";

				nock(origin).get(pathname).reply(200, Readable.from(body));

				client = axiosHttpClient({
					responseType: "stream"
				});

				const response = await client(request);
				assertThat(response.body, is(instanceOf(Readable)));

				const data = await waitForStream(response.body as Readable);
				assertThat(data, is(body));
			});

			it("should return string", async function() {
				const body = "This is some data";

				nock(origin).get(pathname).reply(200, body);

				client = axiosHttpClient({
					responseType: "text"
				});

				const response = await client(request);
				assertThat(response.body, is(body));
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
