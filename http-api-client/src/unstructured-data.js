"use strict"

const { Readable } = require("stream");

const Async = require("crocks/Async");

const and = require("crocks/logic/and");
const compose = require("crocks/helpers/compose");
const composeK = require("crocks/helpers/composeK");
const curry = require("crocks/core/curry");
const flip = require("crocks/combinators/flip");
const hasPropPath = require("crocks/predicates/hasPropPath");
const ifElse = require("crocks/logic/ifElse");
const map = require("crocks/pointfree/map");
const not = require("crocks/logic/not");
const pipe = require("crocks/helpers/pipe");
const setPath = require("crocks/helpers/setPath");
const subtitution = require("crocks/combinators/substitution");

const { getPath } = require("@epistemology-factory/crocks-ext/Async");
const { join } = require("@epistemology-factory/crocks-ext/String");
const { prepend } = require("@epistemology-factory/crocks-ext/helpers");

const { resultHasContentType } = require("./predicates");

const requestBodyPath = [ "body" ];

const resultBodyPath = [ "response", "body" ];

// newError :: String -> Error
const newError = (message) => new Error(message)

// missingPath :: String -> Error
const missingPath = compose(newError, prepend("Missing property at "), join("."))

/**
 * Data type that does not have a pre-defined data model/type definition.
 *
 * @typedef {Buffer | | NodeJS.ReadableStream | ReadableStream | string} UnstructuredData
 */

// @private
// collectReadableToString :: NodeJS.ReadableStream -> String
const collectReadableToString = (stream) => {
	/*
	 * reject: (err: Error) => void
	 * resolve: (result: string) => void
	 */
	return Async((reject, resolve) => {
		let result = "";

		stream.on("data", (data) => {
			result += data;
		});

		stream.on("error", (err) => {
			reject(err);
		});

		stream.on("end", () => {
			resolve(result);
		});
	});
};

// @private
// collectReadableStreamToString :: ReadableStream -> String
const collectReadableStreamToString = (stream) => {
	/*
	 * reject: (err: Error) => void
	 * resolve: (result: string) => void
	 */
	return Async((reject, resolve) => {
		streamReduce("", stream.getReader())
			.then(resolve, (err) => {
				if (typeof err === "string") {
					return reject(new Error(err));
				}

				reject(err);
			});
	});
}

// @private
// streamReduce :: (String, ReadableStream) -> Promise String
const streamReduce = async (accumulator, stream) => {
	const { done, value } = await stream.read();

	if (value) {
		accumulator += value;
	}

	return done ? accumulator : streamReduce(accumulator, stream);
};

// @private
// transformBody :: [ String ] -> (a -> Async Error b) -> Object -> Async Error Object
const transformBody = curry((path, transform) =>
	subtitution(
		compose(map, flip(setPath(path))),
		composeK(transform, getPath(missingPath, path))
	)
)

// collectUnstructuredDataToString :: UnstructuredData -> Async String
const collectUnstructuredDataToString = (data) => {
	/*
	 * reject: (err: Error) => void
	 * resolve: (result: string) => void
	 */
	return Async((reject, resolve) => {
		if (typeof data === "string") {
			return resolve(data);
		}

		if (Buffer.isBuffer(data)) {
			return resolve(data.toString());
		}

		if (isReadable(data)) {
			return collectReadableToString(data).fork(reject, resolve);
		}

		if (isReadableStream(data)) {
			return collectReadableStreamToString(data).fork(reject, resolve);
		}

		reject(new Error("Unknown data type"));
	});
}

/**
 * A string marshaller takes a transformation function, and a content type.
 * It creates a HttpRequestPolicy that will transform the body of the request to a string
 * and add the content-type request header.
 */
// stringMarshaller :: (a -> Async Error String) -> String -> HttpRequestPolicy
const stringMarshaller =  curry((transform, contentType) =>
	ifElse(
		not(hasPropPath(requestBodyPath)),
		Async.of,
		pipe(
			setPath([ "headers", "content-type" ], contentType),
			transformBody(requestBodyPath, transform)
		)
	)
)

/**
 * A string unmarshaller takes a transformation function, and a content type.
 * It creates a HttpResultHandler that will transform the body of the request from a
 * string to something if the content type of the response matches the desired content type.
 *
 * If the unmarshaller can't process the response body, it will just pass the result back
 * unchanged.
 */
// stringUnmarshaller :: (String -> Async Error a) -> String -> HttpResultHandler
const stringUnmarshaller = curry((transform, contentType) => {
	return ifElse(
		not(and(hasPropPath(resultBodyPath), resultHasContentType(contentType))),
		Async.of,
		transformBody(resultBodyPath, composeK(transform, collectUnstructuredDataToString))
	)
})

/**
 * @return Whether the object is a Node Readable stream.
 */
// isReadable :: a -> Boolean
const isReadable =
	(obj) => obj instanceof Readable && (typeof obj._read === "function")

/**
 * @return Whether the object is a Web API ReadableStream
 */
// isReadableStream :: a -> Boolean
const isReadableStream =
	(obj) => (typeof obj.getReader === "function")

/**
 * Extracts a property (body) at a location, converts the data to a string, and merges the result
 * into the original input.
 */
// unstructuredDataToString :: [ String ] -> HttpResult UnstructuredData -> Async Error (HttpResult String)
const unstructuredDataToString = (path) =>
	subtitution(
		compose(map, flip(setPath(path))),
		composeK(collectUnstructuredDataToString, getPath(missingPath, path)),
	)

module.exports = {
	collectUnstructuredDataToString,
	isReadable,
	isReadableStream,
	stringMarshaller,
	stringUnmarshaller,
	unstructuredDataToString
}
