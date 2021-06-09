import * as Async from "crocks/Async";

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

export type RequestHeaderFactory = (headers: HttpHeaders) => typeof Async;

export type RequestHeadersFactory = () => typeof Async;

export function addHeaders(
	factory: RequestHeadersFactory,
	request: HttpRequest
): typeof Async;

export function addHeaders(factory: RequestHeadersFactory): HttpRequestPolicy;

export function resolveUrl(base: string, request: HttpRequest): typeof Async;
export function resolveUrl(base: string): HttpRequestPolicy;

