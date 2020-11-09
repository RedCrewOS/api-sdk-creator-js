export enum HttpRequestMethod {
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

/**
 * In order to be as generic as possible properties on the request try to align with the
 * underlying structure of an HTTP request.
 *
 * Adapters will have to map properties to the request object structure used by the underlying
 * HTTP client library.
 */
export interface HttpRequest<T = any> {
	method: HttpRequestMethod;
	url: URL | string;
	headers: Record<string, string>;

	/** Used to replace path parameters/slugs in the request url */
	pathParams: Record<string, string>;

	queryParams: Record<string, string>;

	body: T;
}
