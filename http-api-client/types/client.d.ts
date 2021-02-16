import * as Async from "crocks/Async";

import { HttpRequest } from "./request";
import { HttpResponse } from "./response";
import { UnstructuredData } from "./unstructured-data";

export type HttpApiClient = (request: HttpRequest) => typeof Async;

export type HttpClient = (request: HttpRequest<UnstructuredData>) => typeof Async;

export interface HttpResult<Request = any, Response = any> {
	request: HttpRequest<Request>;
	response: HttpResponse<Response>;
}

export type HttpRequestPolicy<T = any> = (request: HttpRequest<T>) => typeof Async;

export type HttpResultHandler<Request = any, Response = any> =
	(result: HttpResult<Request, Response>) => typeof Async;

export type HttpResponseHandler<T = any> = (response: HttpResponse<T>) => typeof Async;
