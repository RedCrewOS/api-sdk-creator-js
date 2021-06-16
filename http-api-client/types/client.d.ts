import * as Async from "crocks/Async";

import { HttpRequest } from "./request";
import { HttpResponse } from "./response";
import { UnstructuredData } from "./unstructured-data";

export type HttpApiClient = (request: HttpRequest) => typeof Async;

export type HttpClient = (request: HttpRequest<UnstructuredData>) => typeof Async;

export type HttpClientFactory = () => HttpClient;

export interface HttpResult<Request = any, Response = any> {
	request: HttpRequest<Request>;
	response: HttpResponse<Response>;
}

export type HttpRequestPolicy<Request = any> = (request: HttpRequest<Request>) => typeof Async;

export type HttpResultHandler<Request = any, Response = any> =
	(result: HttpResult<Request, Response>) => typeof Async;

export type HttpResponseHandler<Response = any> = (response: HttpResponse<Response>) => typeof Async;
