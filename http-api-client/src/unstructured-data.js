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
// collects a readable stream into a string
const collectReadable = (stream) => {
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
// collects a ReadableStream into a string
const collectReadableStream = (stream) => {
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
const streamReduce = async (accumulator, stream) => {
	const { done, value } = await stream.read();

	if (value) {
		accumulator += value;
	}

	return done ? accumulator : streamReduce(accumulator, stream);
};

/**
 * Extracts a property (body) at a location, converts the data to a string, and merges the result
 * into the original input.
 */
// unstructuredDataAtPathToString :: [ String ] -> HttpResult UnstructuredData -> Async HttpResult String
const unstructuredDataAtPathToString = curry((path, data) =>
	pipe(
		resultToAsync(maybeToResult(new Error(`Missing property at ${path.join(".")}`), getPath(path))),
		chain(unstructuredDataToString),
		map(flip(setPath(path))(data))
	)(data)
);

// unstructuredDataToString :: UnstructuredData -> Async String
const unstructuredDataToString = (data) => {
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
			return collectReadable(data).fork(reject, resolve);
		}

		if (isReadableStream(data)) {
			return collectReadableStream(data).fork(reject, resolve);
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

module.exports = {
	unstructuredDataAtPathToString,
	unstructuredDataToString,
	isReadable,
	isReadableStream
}
