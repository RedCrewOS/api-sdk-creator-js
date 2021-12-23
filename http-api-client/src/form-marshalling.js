"use strict";

const compose = require("crocks/helpers/compose");
const resultToAsync = require("crocks/Async/resultToAsync");
const tryCatch = require("crocks/Result/tryCatch");

const { urlencoded } = require("@api-sdk-creator/marshallers");

const { marshallerFor, unmarshallerFor, unmarshaller } = require("./marshaller");

/**
 * @type {string} Default mime type for JSON.
 */
const URL_ENCODED_MIME_TYPE = "application/x-www-form-urlencoded";

/**
 * Creates a {@link HttpRequestPolicy} that tries to marshall the body to a string.
 *
 * @param {string} [contentType=JSON_MIME_TYPE] Optional content type. Defaults to JSON_MIME_TYPE
 * @return {HttpRequestPolicy}
 */
// formMarshaller :: String? -> HttpRequestPolicy
const formMarshaller = (contentType = URL_ENCODED_MIME_TYPE) =>
	marshallerFor(contentType, compose(resultToAsync, tryCatch(urlencoded.encoder())))

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
		unmarshallerFor(contentType, compose(resultToAsync, tryCatch(urlencoded.decoder())))
	)

module.exports = {
	URL_ENCODED_MIME_TYPE,
	formMarshaller,
	formUnmarshaller
}
