"use strict"

const Result = require("crocks/Result");

const curry = require("crocks/core/curry");
const getProp = require("crocks/Maybe/getProp");
const isNumber = require("crocks/predicates/isNumber");
const map = require("crocks/pointfree/map");
const maybeToResult = require("crocks/Result/maybeToResult");
const pipe = require("crocks/helpers/pipe");
const safeAfter = require("crocks/Maybe/safeAfter");
const sequence = require("crocks/pointfree/sequence");

const { newError } = require("./errors");

/**
 * Helper to get the response in a {@link HttpResult}
 *
 * @param {HttpResult} result
 * @return {HttpResponse} A response
 */
// getHttpResponse :: HttpResult -> HttpResponse
const getHttpResponse = (result) => result.response;

/**
 * Helper to get the body out of a {@link HttpResponse}
 *
 * @param {HttpResponse} response
 * @return {any} The body. Maybe undefined
 */
// getHttpBody :: HttpResponse -> a
const getHttpBody = (response) => response.body;

/**
 * Extracts the response body from a {@link HttpResult}
 *
 * @param {HttpResult} result
 * @return {any} The body. Maybe null
 */
// extractHttpBody :: HttpResult -> a
const extractHttpBody =
	pipe(getHttpResponse, getHttpBody)

// parseIntValue :: a -> Result Error Integer
const parseIntValue = (a) =>
	maybeToResult(newError(`'${a}' is not a number`), safeAfter(isNumber, parseInt, a))

/**
 * Tries to take a header value and parse it to an int.
 *
 * Returns an Error if no headers are given, or if the header value is NaN.
 *
 * Will ignore a missing header as not all headers are returned under all circumstances and that
 * might be OK (eg: content-length). Use `maybeToResult` to force an error if the header is
 * missing.
 *
 * @param {string} header The header to parse eg: `content-length`
 * @param {object} headers HTTP headers.
 */
// parseIntHeader :: String -> Object -> Result Error Maybe Integer
const parseIntHeader = curry((header, headers) =>
	pipe(
		getProp(header),
		map(parseIntValue),
		sequence(Result.of),
	)(headers)
);

module.exports = {
	extractHttpBody,
	getHttpBody,
	getHttpResponse,
	parseIntHeader
}
