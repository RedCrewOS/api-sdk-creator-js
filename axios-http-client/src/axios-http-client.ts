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
const defaultProps = require("crocks/helpers/defaultProps");
const isDefined = require("crocks/predicates/isDefined");
const map = require("crocks/pointfree/map");
const option = require("crocks/pointfree/option");
const pipe = require("crocks/helpers/pipe");
const safe = require("crocks/Maybe/safe");

import {
	createQueryString,
	replacePathParams,
	HttpClient,
	HttpRequest,
	HttpResponse,
	HttpResult,
	UnstructuredData
} from "@api-sdk-creator/http-api-client";

/*
 * Axios embeds the actual HTTP error response in the Error.
 *
 * We need to extract the HTTP error response if present, or return the Error as the Error may be
 * for some other issue like a network failure.
 */
// extractHttpError :: AxiosError -> Async
const extractHttpError = function(e: AxiosError): typeof Async {
	return e.response ? Async.Resolved(e.response) : Async.Rejected(e);
};

const toAxiosRequest = (request: HttpRequest): AxiosRequestConfig => {
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
};

// toHttpResponse :: AxiosResponse -> HttpResponse
const toHttpResponse = (resp: AxiosResponse): HttpResponse => ({
	statusCode: resp.status,
	statusMessage: resp.statusText,
	headers: resp.headers,
	body: resp.data
})

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

// axiosHttpClient :: AxiosInstance -> HttpClient
const axiosHttpClient = curry(
	(
		instance: AxiosInstance,
		request: HttpRequest<UnstructuredData>
	): typeof Async => {
		return pipe(
			map(toAxiosRequest),
			chain(Async.fromPromise(instance.request.bind(instance))),
			bichain(extractHttpError, Async.of),
			map(toHttpResponse),
			map(toHttpResult(request))
		)(Async.of(request));
	}
);

/*
 * Due to a bug in Axios it will *always* try to parse JSON, even if we don't want it to
 * (ie: by setting the 'responseType').
 *
 * This is a workaround.
 *
 * @see https://github.com/axios/axios/issues/907
 */
// setDefaultConfig -> AxiosRequestConfig -> AxiosRequestConfig
const setDefaultConfig =
	pipe(
		pipe(safe(isDefined), option({})),
		defaultProps({
			transformResponse: [ (data: any) => data ]
		})
	)

/**
 * Creates a separate Axios instance.
 */
export const createAxiosHttpClient: (config?: AxiosRequestConfig) => HttpClient =
	pipe(
		setDefaultConfig,
		axios.create,
		axiosHttpClient
	);
