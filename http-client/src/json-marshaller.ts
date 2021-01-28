"use strict";

import { HttpRequestPolicy, HttpResult, HttpResultHandler } from "./http-client";
import { HttpRequest } from "./http-request";
import { UnstructuredData, unstructuredDataToString } from "./unstructured-data";

const Async = require("crocks/Async");

const chain = require("crocks/pointfree/chain");
const getPath = require("crocks/Maybe/getPath");
const hasPropPath = require("crocks/predicates/hasPropPath");
const ifElse = require("crocks/logic/ifElse");
const flip = require("crocks/combinators/flip");
const map = require("crocks/pointfree/map");
const mapProps = require("crocks/helpers/mapProps");
const maybeToResult = require("crocks/Result/maybeToResult");
const not = require("crocks/logic/not");
const pipe = require("crocks/helpers/pipe");
const pipeK = require("crocks/helpers/pipeK");
const resultToAsync = require("crocks/Async/resultToAsync");
const setPath = require("crocks/helpers/setPath");
const tryCatch = require("crocks/Result/tryCatch");

import objMerge from "./obj-merge";

// very loose definition what what's convertible to/from JSON
export type JSONObject = Record<string, any>;

export const JSON_MIME_TYPE = "application/json";

// unstructuredDataBodyToStringBody :: HttpResult UnstructuredData -> Async HttpResult string
const unstructuredDataBodyToStringBody = (result: HttpResult): typeof Async => {
	const path = [ "response", "body" ];

	return pipe(
		resultToAsync(maybeToResult(new Error("Missing response body"), getPath(path))),
		chain(unstructuredDataToString),
		map(flip(setPath(path))({})),
		map(objMerge(result)),
	)(result);
}

// parseResponseBodyToJson :: HttpResult string -> Async HttpResult JSONObject
const parseResponseBodyToJson: (result: HttpResult<any, string>) => typeof Async =
	resultToAsync(tryCatch(mapProps({ response: { body: JSON.parse } })))

export function jsonMarshaller(
	contentType: string = JSON_MIME_TYPE
): HttpRequestPolicy<JSONObject> {
	const path = [ "body" ];

	return ifElse(
		not(hasPropPath(path)),
		Async.of,
		pipe(
			setPath([ "headers", "content-type" ], contentType),
			resultToAsync(tryCatch((request: HttpRequest) =>
				setPath(path, JSON.stringify(request.body), request)
			))
		),
	) as HttpRequestPolicy<JSONObject>;
}

export function jsonUnmarshaller(): HttpResultHandler<UnstructuredData, JSONObject> {
	return ifElse(
		not(hasPropPath([ "response", "body" ])),
		Async.of,
		pipeK(
			unstructuredDataBodyToStringBody,
			parseResponseBodyToJson
		)
	) as HttpResultHandler<UnstructuredData, JSONObject>;
}
