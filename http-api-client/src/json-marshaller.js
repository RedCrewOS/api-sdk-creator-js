"use strict";

const Async = require("crocks/Async");

const and = require("crocks/logic/and");
const hasPropPath = require("crocks/predicates/hasPropPath");
const ifElse = require("crocks/logic/ifElse");
const mapProps = require("crocks/helpers/mapProps");
const not = require("crocks/logic/not");
const pipe = require("crocks/helpers/pipe");
const pipeK = require("crocks/helpers/pipeK");
const resultToAsync = require("crocks/Async/resultToAsync");
const setPath = require("crocks/helpers/setPath");
const tryCatch = require("crocks/Result/tryCatch");

const { resultHasContentType } = require("./predicates");
const { unstructuredDataAtPathToString } = require("./unstructured-data");

/**
 * @type {string} Default mime type for JSON.
 */
const JSON_MIME_TYPE = "application/json";

/**
 * Creates a {@link HttpRequestPolicy} that tries to marshall the body to a string.
 *
 * @param {string} [contentType=JSON_MIME_TYPE] Optional content type. Defaults to JSON_MIME_TYPE
 * @return {HttpRequestPolicy}
 */
// jsonMarshaller :: String? -> HttpRequestPolicy
const jsonMarshaller = (contentType = JSON_MIME_TYPE) => {
	const path = [ "body" ];

	return ifElse(
		not(hasPropPath(path)),
		Async.of,
		pipe(
			setPath([ "headers", "content-type" ], contentType),
			resultToAsync(tryCatch(mapProps({ body: JSON.stringify })))
		),
	)
};

/**
 * Creates a {@link HttpResultHandler} that tries to unmarshall a string to an object.
 *
 * @return {HttpResultHandler}
 */
// jsonUnmarshaller :: String? -> HttpResultHandler
const jsonUnmarshaller = (contentType = JSON_MIME_TYPE) => {
	const path = [ "response", "body" ];

	return ifElse(
		not(and(hasPropPath(path), resultHasContentType(contentType))),
		Async.of,
		pipeK(
			unstructuredDataAtPathToString(path),
			resultToAsync(tryCatch(mapProps({ response: { body: JSON.parse } })))
		)
	)
}

module.exports = {
	JSON_MIME_TYPE,
	jsonMarshaller,
	jsonUnmarshaller
}
