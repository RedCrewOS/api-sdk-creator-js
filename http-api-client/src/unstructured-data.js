"use strict"

const { Readable } = require("stream");

const Async = require("crocks/Async");

const chain = require("crocks/pointfree/chain");
const curry = require("crocks/core/curry");
const getPath = require("crocks/Maybe/getPath");
const flip = require("crocks/combinators/flip");
const map = require("crocks/pointfree/map");
const maybeToResult = require("crocks/Result/maybeToResult");
const pipe = require("crocks/helpers/pipe");
const resultToAsync = require("crocks/Async/resultToAsync");
const setPath = require("crocks/helpers/setPath");

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
// unstructuredDataToString :: [ String ] -> HttpResult UnstructuredData -> Async HttpResult String
const unstructuredDataToString = curry((path, data) =>
	pipe(
		resultToAsync(maybeToResult(new Error(`Missing property at ${path.join(".")}`), getPath(path))),
		chain(collectUnstructuredDataToString),
		map(flip(setPath(path))(data))
	)(data)
);

module.exports = {
	collectUnstructuredDataToString,
	isReadable,
	isReadableStream,
	unstructuredDataToString
}
