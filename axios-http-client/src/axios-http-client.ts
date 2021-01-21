import axios, {
	AxiosError,
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
	Method
} from "axios";

const Async = require("crocks/Async");

const bichain = require("crocks/pointfree/bichain");
const chain = require("crocks/pointfree/chain");
const curry = require("crocks/helpers/curry");
const map = require("crocks/pointfree/map");
const pipe = require("crocks/helpers/pipe");

import {
	createQueryString,
	replacePathParams,
	HttpClient,
	HttpRequest,
	HttpResponse,
	HttpResult,
	UnstructuredData
} from "@sdk-creator/http-client";

/*
 * Axios embeds the actual HTTP error response in the Error.
 *
 * We need to extract the HTTP error response if present, or return the Error as the Error may be
 * for some other issue like a network failure.
 */
// extractHttpError :: AxiosError -> Async
const extractHttpError = function(e: AxiosError) {
	return e.response ? Async.Resolved(e.response) : Async.Rejected(e);
};

// toHttpResponse :: AxiosResponse -> HttpResponse
const toHttpResponse = function(resp: AxiosResponse): HttpResponse {
	return {
		statusCode: resp.status,
		statusMessage: resp.statusText,
		headers: resp.headers,
		body: resp.data
	};
}

// toHttpResult :: HttpRequest -> HttpResponse -> HttpResult
const toHttpResult = curry(
	(
		request: HttpRequest<UnstructuredData>,
		response: HttpResponse<UnstructuredData>
	): HttpResult<UnstructuredData, UnstructuredData> => ({
		request,
		response
	})
);

/**
 * Creates a separate Axios instance.
 */
export function axiosHttpClient(config?: AxiosRequestConfig): HttpClient {
	const axiosClient = function(
		instance: AxiosInstance,
		request: HttpRequest<UnstructuredData>
	): typeof Async {
		return pipe(
			map(toAxiosRequest),
			chain(Async.fromPromise(instance.request.bind(instance))),
			bichain(extractHttpError, Async.of),
			map(toHttpResponse),
			map(toHttpResult(request))
		)(Async.of(request));
	};

	return curry(axiosClient)(axios.create(config));
}

function toAxiosRequest(request: HttpRequest): AxiosRequestConfig {
	const url = request.pathParams
		? replacePathParams(request.url.toString(), request.pathParams)
		: request.url.toString();

	const queryString = request.queryParams
		? createQueryString(request.queryParams)
		: "";

	const axiosRequest: AxiosRequestConfig = {
		method: request.method?.toString() as Method,
		url: `${url}${queryString}`,
		headers: request.headers
	};

	if (request.body) {
		axiosRequest.data = request.body;
	}

	return axiosRequest;
}

