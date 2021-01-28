import { Readable } from "stream";

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

import objMerge from "./obj-merge";

/**
 * Data type that does not have a pre-defined data model/type definition.
 */
export type UnstructuredData = Buffer | NodeJS.ReadableStream | ReadableStream | string;

/**
 * Extracts a property (body) at a location, converts the data to a string, and merges the result
 * into the original input.
 */
// unstructuredDataAtPathToString :: [ String ] -> HttpResult UnstructuredData -> Async HttpResult string
export const unstructuredDataAtPathToString = curry((path: string[], data: any): typeof Async => {
	return pipe(
		resultToAsync(maybeToResult(new Error(`Missing property at ${path.join(".")}`), getPath(path))),
		chain(unstructuredDataToString),
		map(flip(setPath(path))({})),
		map(objMerge(data)),
	)(data);
});

/**
 * @return An Async with a string
 */
export function unstructuredDataToString(data: UnstructuredData): typeof Async {
	return Async((reject: (err: Error) => void, resolve: (result: string) => void) => {
		if (typeof data === "string") {
			return resolve(data);
		}

		if (Buffer.isBuffer(data)) {
			return resolve(data.toString());
		}

		if (isReadable(data)) {
			return collectReadable(data as Readable).fork(reject, resolve);
		}

		if (isReadableStream(data)) {
			return collectReadableStream(data as ReadableStream).fork(reject, resolve);
		}

		reject(new Error("Unknown data type"));
	});
}

/**
 * @return Whether the object is a Node Readable stream.
 */
export function isReadable(obj: any): boolean {
	return obj instanceof Readable && (typeof obj._read === "function")
}

/**
 * @return Whether the object is a Web API ReadableStream
 */
export function isReadableStream(obj: any): boolean {
	return (typeof obj.getReader === "function");
}

function collectReadable(stream: Readable): typeof Async {
	return Async((reject: (err: Error) => void, resolve: (result: string) => void) => {
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
}

function collectReadableStream(stream: ReadableStream): typeof Async {
	return Async((reject: (err: Error) => void, resolve: (result: string) => void) => {
		streamReduce("", stream.getReader()).then(resolve, (err) => {
			if (typeof err === "string") {
				return reject(new Error(err));
			}

			reject(err);
		})
	});
}

async function streamReduce(accumulator: string, stream: ReadableStreamDefaultReader<string>): Promise<string> {
	const { done, value } = await stream.read();

	if (value) {
		accumulator += value;
	}

	return done ? accumulator : streamReduce(accumulator, stream);
}
