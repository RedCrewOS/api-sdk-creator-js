"use strict";

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

const { collectUnstructuredDataToString } = require("./unstructured-data");
const { resultHasContentType } = require("./predicates");

const requestBodyPath = [ "body" ];
const resultBodyPath = [ "response", "body" ];

// newError :: String -> Error
const newError = (message) => new Error(message)

// missingPath :: String -> Error
const missingPath = compose(newError, prepend("Missing property at "), join("."))

// @private
// transformBody :: [ String ] -> (a -> Async Error b) -> Object -> Async Error Object
const transformBody = curry((path, transform) =>
	subtitution(
		compose(map, flip(setPath(path))),
		composeK(transform, getPath(missingPath, path))
	)
)

/**
 * Most applications/SDKs accessing an API will want to use the same content type, so by having
 * a curried function an instance of the marshaller can be configured for the correct content
 * type.
 *
 * The abstraction of how to actually convert between a type and an UnstructuredData type is
 * so that users can provide the transformation function of their choice.
 *
 * If an application/SDK wishes to support multiple marshallers to take advantage of content
 * negotiation the application will need to orchestrate the selection process.
 *
 * The result is a HttpRequestPolicy that will transform the body of the request (if present)
 * and add the Content-Type request header.
 */
// marshallerFor :: String -> (a -> Async Error UnstructuredData) -> HttpRequestPolicy
const marshallerFor = curry((contentType, transformer) =>
	ifElse(
		not(hasPropPath(requestBodyPath)),
		Async.of,
		pipe(
			setPath([ "headers", "content-type" ], contentType),
			transformBody(requestBodyPath, transformer)
		)
	)
)

/**
 * Most applications/SDKs accessing an API will want to use the same content type, so by having
 * a curried function an instance of the unmarshaller can be configured for the correct content
 * type.
 *
 * The abstraction of how to actually convert between UnstructuredData and another type is so
 * that users can provide the transformation function of their choice.
 *
 * We can't guarantee the content type of a response is something an unmarshaller can handle,
 * therefore it might not be able to process the content type and therefore has to return
 * the body unchanged. This allows for content negotiation where a chain of unmarshallers can
 * be composed to handle different response content types. It also caters for the scenarios,
 * most often in corporate networks, where a misconfigured gateway/endpoint returns a different
 * content type due to it being misconfigured. Often this is HTML, where as an application/SDK
 * might be expecting JSON/XML in the response.
 */
// unmarshallerFor :: String -> (UnstructuredData -> Async Error a) -> HttpResultHandler
const unmarshallerFor = curry((contentType, transformer) =>
	ifElse(
		not(and(hasPropPath(resultBodyPath), resultHasContentType(contentType))),
		Async.of,
		transformBody(resultBodyPath, composeK(transformer, collectUnstructuredDataToString))
	)
)

module.exports = {
	marshallerFor,
	unmarshallerFor
}
