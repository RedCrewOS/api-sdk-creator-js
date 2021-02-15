import { Async } from "./crocks";
import { HttpRequest } from "./request";
import { HttpResponse } from "./response";
import { UnstructuredData } from "./unstructured-data";

export type HttpApiClient = (request: HttpRequest) => Async;

export type HttpClient = (request: HttpRequest<UnstructuredData>) => Async;

export interface HttpResult<Request = any, Response = any> {
	request: HttpRequest<Request>;
	response: HttpResponse<Response>;
}

export type HttpRequestPolicy<T = any> = (request: HttpRequest<T>) => Async;

export type HttpResultHandler<Request = any, Response = any> =
	(result: HttpResult<Request, Response>) => Async;

export type HttpResponseHandler<T = any> = (response: HttpResponse<T>) => Async;
