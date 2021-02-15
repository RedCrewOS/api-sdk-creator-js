import { Async } from "./crocks";
import { HttpHeaders } from "./headers";
import { HttpRequestPolicy } from "./client";

declare enum HttpRequestMethod {
	GET = "GET",
	HEAD = "HEAD",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
	CONNECT = "CONNECT",
	OPTIONS = "OPTIONS",
	TRACE = "TRACE",
	PATCH = "PATCH"
}

export interface HttpRequest<T = any> {
	method: HttpRequestMethod;
	url: URL | string;
	headers: HttpHeaders;

	/** Used to replace path parameters/slugs in the request url */
	pathParams?: Record<string, string>;

	queryParams?: Record<string, string>;

	body?: T;
}

export type RequestHeaderFactory = (headers: HttpHeaders) => Async;

export function addHeaders(
	headers: Async | (() => Async),
	request: HttpRequest
): Async;

export function addHeaders(headers: Async | (() => Async)): HttpRequestPolicy;
