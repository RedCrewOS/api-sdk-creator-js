import { HttpResult } from "./http-client";
import { HttpResponse } from "./http-response";

/**
 * Helper to get the response in a {@link HttpResult}
 */
export const getHttpResponse: (result: HttpResult) => HttpResponse =
	(result: HttpResult) => result.response;

/**
 * Helper to get the body out of a {@link HttpResponse}
 */
export const getHttpBody: <T = any>(response: HttpResponse) => T =
	(response: HttpResponse) => response.body;
