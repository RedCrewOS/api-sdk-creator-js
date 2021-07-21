"use strict"

const compose = require("crocks/helpers/compose");
const getPath = require("crocks/Maybe/getPath");
const head = require("crocks/pointfree/head");
const isSame = require("crocks/predicates/isSame");
const map = require("crocks/pointfree/map");
const option = require("crocks/pointfree/option");
const pipe = require("crocks/helpers/pipe");

const { split, trim } = require("@epistemology-factory/crocks-ext/String");

const { getHttpResponse } = require("./accessors");

// isSuccessfulResponse :: HttpResponse -> Boolean
const isSuccessfulResponse =
	(response) => response.statusCode >= 200 && response.statusCode < 300;

// isSuccessfulResult :: HttpResult -> Boolean
const isSuccessfulResult =
	compose(isSuccessfulResponse, getHttpResponse);

// hasContentType :: String -> String -> Boolean
const hasContentType = (contentType) =>
	pipe(
		split(";"),
		head,
		map(compose(isSame(contentType), trim)),
		option(false)
	)

// resultHasContentType :: String -> HttpResult -> Boolean
const resultHasContentType = (contentType) =>
	pipe(
		getPath([ "response", "headers", "content-type" ]),
		map(hasContentType(contentType)),
		option(false)
	)

module.exports = {
	hasContentType,
	isSuccessfulResponse,
	isSuccessfulResult,
	resultHasContentType
}
