"use strict";

import { HttpRequestPolicy, HttpResultHandler } from "./client";
import { UnstructuredData, unstructuredDataAtPathToString } from "./unstructured-data";

const Async = require("crocks/Async");

const hasPropPath = require("crocks/predicates/hasPropPath");
const ifElse = require("crocks/logic/ifElse");
const mapProps = require("crocks/helpers/mapProps");
const not = require("crocks/logic/not");
const pipe = require("crocks/helpers/pipe");
const pipeK = require("crocks/helpers/pipeK");
const resultToAsync = require("crocks/Async/resultToAsync");
const setPath = require("crocks/helpers/setPath");
const tryCatch = require("crocks/Result/tryCatch");

// very loose definition what what's convertible to/from JSON
export type JSONObject = Record<string, any>;

export const JSON_MIME_TYPE = "application/json";

export function jsonMarshaller(
	contentType: string = JSON_MIME_TYPE
): HttpRequestPolicy<JSONObject> {
	const path = [ "body" ];

	return ifElse(
		not(hasPropPath(path)),
		Async.of,
		pipe(
			setPath([ "headers", "content-type" ], contentType),
			resultToAsync(tryCatch(mapProps({ body: JSON.stringify })))
		),
	) as HttpRequestPolicy<JSONObject>;
}

export function jsonUnmarshaller(): HttpResultHandler<UnstructuredData, JSONObject> {
	const path = [ "response", "body" ];

	return ifElse(
		not(hasPropPath(path)),
		Async.of,
		pipeK(
			unstructuredDataAtPathToString(path),
			resultToAsync(tryCatch(mapProps({ response: { body: JSON.parse } })))
		)
	) as HttpResultHandler<UnstructuredData, JSONObject>;
}
