"use strict"

const compose = require("crocks/helpers/compose");

const { getHttpResponse } = require("./accessors");

// isSuccessfulResponse :: HttpResponse -> Boolean
const isSuccessfulResponse =
	(response) => response.statusCode >= 200 && response.statusCode < 300;

// isSuccessfulResult :: HttpResult -> Boolean
const isSuccessfulResult =
	compose(isSuccessfulResponse, getHttpResponse);

module.exports = {
	isSuccessfulResponse,
	isSuccessfulResult
}
