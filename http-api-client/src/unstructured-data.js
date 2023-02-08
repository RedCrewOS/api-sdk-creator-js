"use strict"

const { Readable } = require("stream");

const Async = require("crocks/Async");

const compose = require("crocks/helpers/compose");
const composeK = require("crocks/helpers/composeK");
const flip = require("crocks/combinators/flip");
const map = require("crocks/pointfree/map");
const setPath = require("crocks/helpers/setPath");
const subtitution = require("crocks/combinators/substitution");

const { getPath } = require("@epistemology-factory/crocks-ext/Async");
const { newError } = require("./errors");
const { join } = require("@epistemology-factory/crocks-ext/String");
const { prepend } = require("@epistemology-factory/crocks-ext/helpers");

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
					return reject(newError(err));
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

		reject(newError("Unknown data type"));
	});
}

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
	unstructuredDataToString
}
