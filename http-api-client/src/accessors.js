"use strict"

const pipe = require("crocks/helpers/pipe");

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

// extractHttpBody :: HttpResult -> a
const extractHttpBody =
	pipe(getHttpResponse, getHttpBody)

module.exports = {
	extractHttpBody,
	getHttpBody,
	getHttpResponse
}
