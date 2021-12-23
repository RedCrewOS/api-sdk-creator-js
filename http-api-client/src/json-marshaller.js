"use strict";

const compose = require("crocks/helpers/compose");
const resultToAsync = require("crocks/Async/resultToAsync");

const { parse, stringify } = require("@epistemology-factory/crocks-ext/node/json");

const { marshallerFor, unmarshallerFor, unmarshaller } = require("./marshaller");

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
const jsonMarshaller = (contentType = JSON_MIME_TYPE) =>
	marshallerFor(contentType, compose(resultToAsync, stringify))

/**
 * Creates a {@link HttpResultHandler} that tries to unmarshall a string to an object.
 *
 * The returned HttpResultHandler will return an Exception if anything other than the given
 * content type is in the HttpResponse.
 *
 * @return {HttpResultHandler}
 */
// jsonUnmarshaller :: String? -> HttpResultHandler
const jsonUnmarshaller = (contentType = JSON_MIME_TYPE) =>
	unmarshaller(unmarshallerFor(contentType, compose(resultToAsync, parse)))

module.exports = {
	JSON_MIME_TYPE,
	jsonMarshaller,
	jsonUnmarshaller
}
