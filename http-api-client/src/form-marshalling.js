"use strict";

const composeK = require("crocks/helpers/composeK");
const resultToAsync = require("crocks/Async/resultToAsync");
const tryCatch = require("crocks/Result/tryCatch");

const { urlencoded } = require("@api-sdk-creator/marshallers");

const { collectUnstructuredDataToString } = require("./unstructured-data");
const { marshallerFor, unmarshallerFor, unmarshaller } = require("./marshaller");

/**
 * @type {string} Default mime type for JSON.
 */
const URL_ENCODED_MIME_TYPE = "application/x-www-form-urlencoded";

// encode :: String -> Async Error String
const encode = resultToAsync(tryCatch(urlencoded.encoder()))

// decode :: String -> Async Error String
const decode = resultToAsync(tryCatch(urlencoded.decoder()))

/**
 * Creates a {@link HttpRequestPolicy} that tries to marshall the body to a string.
 *
 * @param {string} [contentType=JSON_MIME_TYPE] Optional content type. Defaults to JSON_MIME_TYPE
 * @return {HttpRequestPolicy}
 */
// formMarshaller :: String? -> HttpRequestPolicy
const formMarshaller = (contentType = URL_ENCODED_MIME_TYPE) =>
	marshallerFor(contentType, encode)

/**
 * Creates a {@link HttpResultHandler} that tries to unmarshall a string to an object.
 *
 * The returned HttpResultHandler will return an Exception if anything other than the given
 * content type is in the HttpResponse.
 *
 * @return {HttpResultHandler}
 */
// formUnmarshaller :: String? -> HttpResultHandler
const formUnmarshaller = (contentType = URL_ENCODED_MIME_TYPE) =>
	unmarshaller(
		unmarshallerFor(contentType, composeK(decode, collectUnstructuredDataToString))
	)

module.exports = {
	URL_ENCODED_MIME_TYPE,
	formMarshaller,
	formUnmarshaller
}
