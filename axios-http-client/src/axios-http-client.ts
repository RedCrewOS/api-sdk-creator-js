import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from "axios";

import {
	createQueryString,
	replacePathParams,
	HttpClient,
	HttpRequest,
	HttpResponse,
	UnstructuredData
} from "@sdk-creator/http-client";

/**
 * Creates a separate Axios instance.
 */
export function axiosHttpClient(config?: AxiosRequestConfig): HttpClient {
	const instance: AxiosInstance = axios.create(config);

	return async function(
		request: HttpRequest<UnstructuredData>
	): Promise<HttpResponse<UnstructuredData>> {
		let resp: AxiosResponse;

		try {
			resp = await instance.request(toAxiosRequest(request));
		}
		catch (e) {
			if (e.isAxiosError) {
				resp = e.response;
			}
			else {
				// TODO: Fix me to return error.
				throw e;
			}
		}

		return {
			statusCode: resp.status,
			statusMessage: resp.statusText,
			headers: resp.headers,
			body: resp.data
		};
	}
}

function toAxiosRequest(request: HttpRequest): AxiosRequestConfig {
	const url = replacePathParams(request.url?.toString(), request.pathParams);
	const queryString = createQueryString(request.queryParams);

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

