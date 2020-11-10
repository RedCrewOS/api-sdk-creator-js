import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from "axios";

import {
	BaseHttpClient,
	HttpClient,
	HttpRequest,
	HttpResponse,
	UnstructuredData
} from "@sdk-creator/http-client";

/**
 * Creates a separate Axios instance.
 */
export class AxiosHttpClient extends BaseHttpClient implements HttpClient {
	private instance: AxiosInstance;

	/**
	 * @param config Axios specific configuration.
	 */
	constructor(config?: AxiosRequestConfig) {
		super();

		this.instance = axios.create(config);
	}

	async makeRequest(
		request: HttpRequest<UnstructuredData>
	): Promise<HttpResponse<UnstructuredData>> {
		let resp: AxiosResponse;

		try {
			resp = await this.instance.request(this.toAxiosRequest(request));
		}
		catch (e) {
			if (e.isAxiosError) {
				resp = e.response;
			}
			else {
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

	private toAxiosRequest(request: HttpRequest): AxiosRequestConfig {
		const url = this.replacePathParams(request.url?.toString(), request.pathParams);
		const queryString = this.createQueryString(request.queryParams);

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
}

