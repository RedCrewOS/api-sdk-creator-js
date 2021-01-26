"use strict";

import { HttpRequestPolicy, HttpResultHandler } from "./http-client";
import { HttpRequest } from "./http-request";

const Async = require("crocks/Async");

const hasProp = require("crocks/predicates/hasProp");
const ifElse = require("crocks/logic/ifElse");
const mapProps = require("crocks/helpers/mapProps");
const not = require("crocks/logic/not");
const pipe = require("crocks/helpers/pipe");
const resultToAsync = require("crocks/Async/resultToAsync");
const setPath = require("crocks/helpers/setPath");
const tryCatch = require("crocks/Result/tryCatch");

// very loose definition what what's convertible to/from JSON
export type JSONObject = Record<string, any>;

export const JSON_MIME_TYPE = "application/json";

const responseMapping = {
	response: {
		body: (x: string) => JSON.parse(x)
	}
};

export function jsonMarshaller(
	contentType: string = JSON_MIME_TYPE
): HttpRequestPolicy<JSONObject> {
	return ifElse(
		not(hasProp("body")),
		Async.of,
		pipe(
			setPath([ "headers", "content-type" ], contentType),
			tryCatch((request: HttpRequest) =>
				setPath([ "body" ], JSON.stringify(request.body), request)
			),
			resultToAsync,
		),
	) as HttpRequestPolicy<JSONObject>;
}

export function jsonUnmarshaller(): HttpResultHandler<string, JSONObject> {
	return pipe(
		tryCatch(mapProps(responseMapping)),
		resultToAsync
	) as HttpResultHandler<string, JSONObject>;
}
