const Async = require("crocks/Async");
const pipe = require("crocks/helpers/pipe");

const { join, split } = require("@epistemology-factory/crocks-ext/String");

const { PassThrough, Readable, Transform } = require("stream");
const { ReadableStream, TransformStream } = require("web-streams-polyfill/ponyfill/es2018");

const deepFreeze = require("deep-freeze");
const {
	allOf,
	assertThat, equalTo,
	hasProperty,
	instanceOf,
	is,
	isRejectedWith,
	promiseThat
} = require("hamjest");

const {
	collectUnstructuredDataToString,
	isReadable,
	isReadableStream,
	stringMarshaller,
	stringUnmarshaller,
	unstructuredDataToString,
} = require("../src");

class ErrorTransform extends Transform {
	_transform(chunk, encoding, callback) {
		callback(new Error("Fake stream error"));
	}
}

describe("Unstructured Data", function() {
	describe("unstructured data to string", function() {
		it("should return input string", async function() {
			const data = "Hello World";

			const result = await convertDataToString(data);

			assertThat(result, is(data));
		});

		it("should convert buffer to utf8 string", async function() {
			const message = "Hello World";
			const data = Buffer.from(message);

			const result = await convertDataToString(data);

			assertThat(result, is(message));
		});

		it("should collect nodejs stream", async function() {
			const data = "Hello World";
			const stream = new PassThrough({ encoding: "utf8" });

			process.nextTick(() => stream.end(Buffer.from(data)));

			const result = await convertDataToString(stream);

			assertThat(result, is(data));
		});

		it("should throw error if nodejs stream has error", async function() {
			const stream = new ErrorTransform({ objectMode: true, encoding: "utf8" });

			process.nextTick(() => stream.end("Hello World"));

			await promiseThat(convertDataToString(stream), isRejectedWith(instanceOf(Error)));
		});

		it("should collect web stream", async function() {
			const data = "Hello World";
			const stream = new TransformStream();

			process.nextTick(() => {
				const writer = stream.writable.getWriter();
				writer.write(data);
				writer.close();
			});

			const result = await convertDataToString(stream.readable);

			assertThat(result, is(data));
		});

		it("should throw error if web stream has error", async function() {
			const stream = new TransformStream({
				transform: (chunk, controller) => {
					controller.error("Fake web steams error");
				}
			});

			process.nextTick(() => {
				const writer = stream.writable.getWriter();
				writer.write("Hello World");
				writer.close();
			});

			await promiseThat(convertDataToString(stream.readable), isRejectedWith(instanceOf(Error)));
		});

		it("should throw error if data type not known", async function() {
			await promiseThat(convertDataToString({}), isRejectedWith(instanceOf(Error)));
		});

		function convertDataToString(data) {
			return collectUnstructuredDataToString(data).toPromise();
		}
	});

	describe("unstructured data body to string body", function() {
		const data = "Hello World";
		const body = Buffer.from(data);

		const obj = {
			a: {
				b: body
			},
			c: 1,
			d: false
		};

		it("should convert data to string", async function() {
			const result = await unstructuredDataToString([ "a", "b" ])(obj).toPromise();

			assertThat(result.a.b, is(data));
		});

		it("should merge result into object", async function() {
			const result = await unstructuredDataToString([ "a", "b" ])(obj).toPromise();

			assertThat(result.c, is(obj.c));
			assertThat(result.d, is(obj.d));
		});

		it("should throw error if no property at path", async function() {
			await promiseThat(
				unstructuredDataToString([ "x", "y" ])(obj).toPromise(),
				isRejectedWith(allOf(
					instanceOf(Error),
					hasProperty("message", equalTo("Missing property at x.y"))
				))
			);
		});
	});

	describe("streams", function() {
		it("should recognise node stream", function() {
			const stream = new Readable();

			assertThat(isReadable(stream), is(true));
		});

		it("should recognise web stream", function() {
			const stream = new ReadableStream();

			assertThat(isReadableStream(stream), is(true));
		});

		it("should not confuse node stream for web stream", function() {
			const stream = new Readable();

			assertThat(isReadableStream(stream), is(false));
		});

		it("should not confuse web stream for node stream", function() {
			const stream = new ReadableStream();

			assertThat(isReadable(stream), is(false));
		});
	});

	describe("string marshalling", function() {
		const reverse = (a) => a.reverse()

		const transformer =
			pipe(
				split(""),
				reverse,
				join(""),
				Async.of
			)

		describe("marshaller", function() {
			let request;

			beforeEach(function() {
				request = {
					headers: {},
					body: "Hello World"
				};
			})

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

			it("should not set body when no request body", async function() {
				request.body = undefined;

				const result = await marshall();

				assertThat(result.body, is(undefined));
			});

			it("should set request body", async function() {
				const result = await marshall();

				assertThat(result.body, is("dlroW olleH"));
			});

			it("should reject when error marshalling request body", async function() {
				const err = new Error("Something went wrong");
				const transform = () => Async.Rejected(err)

				await promiseThat(marshall("text/plain", transform), isRejectedWith(err));
			});

			function marshall(contentType= "text/plain", transform = transformer) {
				// freeze the request to make sure we don't modify anything
				request = deepFreeze(request);

				return stringMarshaller(transform)(contentType)(Object.freeze(request)).toPromise();
			}
		});

		describe("unmarshaller", function() {
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

			it("should not unmarshall response body when content type does not match",
				async function() {
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

			it("should reject when error unmarshalling response body", async function() {
				const err = new Error("Something went wrong");
				const transform = () => Async.Rejected(err)

				await promiseThat(unmarshall("text/plain", transform), isRejectedWith(err));
			});

			function unmarshall(contentType = "text/plain", transform = transformer) {
				return stringUnmarshaller(transform)(contentType)(result).toPromise();
			}
		});
	});
});
