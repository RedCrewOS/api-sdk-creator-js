"use strict";

const { Async, Either, compose, identity, ifElse, isSame, pipe } = require("crocks");

const { join, split } = require("@epistemology-factory/crocks-ext/String");

const deepFreeze = require("deep-freeze");
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

const { marshallerFor, unmarshaller, unmarshallerFor } = require("../src/marshaller");

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
			const result = (await unmarshall()).either(throwUnstructuredDataException, identity);

			assertThat(result.response.body, is("Hello World"));
		});

		it("should not unmarshall response body when content type does not match", async function() {
			const body = JSON.stringify({});
			result.response.body = body;
			result.response.headers["content-type"] = "application/json";

			const outcome = (await unmarshall()).either(identity, throwUnmarshalledDataException);

			assertThat(outcome.response.body, is(body));
		});

		it("should not unmarshall response body when no response body", async function() {
			result.response.body = undefined;

			// we expect an Either.Right as the result since there is no body.
			const outcome = (await unmarshall()).either(throwUnstructuredDataException, identity);

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

		function throwUnstructuredDataException() {
			throw new Error("Expected HttpResponse to have had body unmarshalled")
		}

		function throwUnmarshalledDataException() {
			throw new Error("HttpResponse erroneously had body unmarshalled")
		}
	});

	describe("unmarshaller", function() {
		const plainTextUnmarshaller = makeUnmarshaller("text/plain", "This is some text")
		const anotherPlainTextUnmarshaller = makeUnmarshaller("text/plain", "This is other text")
		const jsonUnmarshaller = makeUnmarshaller("application/json", "{ \"a\": false }")

		const unmarshallers = unmarshaller(
			jsonUnmarshaller,
			plainTextUnmarshaller,
			anotherPlainTextUnmarshaller
		)

		const responseHeaders = {
			"content-type": "text/plain"
		}

		it("should not unmarshall anything when no response body", async function() {
			const input = {
				response: {
					headers: responseHeaders
				}
			}

			const result = await unmarshallers(input).toPromise()

			assertThat(result.response.body, is(undefined));
		});

		it("should return first unmarshalled body", async function() {
			const input = {
				response: {
					headers: responseHeaders,
					body: "Hello World"
				}
			}

			const result = await unmarshallers(input).toPromise()

			assertThat(result.response.body, is("This is some text"));
		});

		it("should return unsupported content when response body not unmarshalled", async function() {
			const input = {
				response: {
					headers: {
						"content-type": "image/png"
					},
					body: "Hello World"
				}
			}

			await promiseThat(
				unmarshallers(input).toPromise(),
				isRejectedWith(allOf(
					instanceOf(Error),
					hasProperty("message", equalTo("Unrecognised content type 'image/png'"))
				))
			);
		});

		function makeUnmarshaller(contentType, data) {
			return ifElse(
				(result) => result.response.body,
				ifElse(
					(result) => isSame(result.response.headers["content-type"], contentType),
					(result) => Async.Resolved(Either.Right(copyWithBody(result, data))),
					(result) => Async.Resolved(Either.Left(result))
				),
				compose(Async.Resolved, Either.Right)
			)
		}

		function copyWithBody(result, body) {
			return {
				request: result.request,
				response: {
					...result.response,
					body
				}
			}
		}
	});
});
