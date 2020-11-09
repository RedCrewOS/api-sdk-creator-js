import { HttpRequest } from "./http-request";
import { HttpResponse } from "./http-response";

export interface HttpClient {
	/**
	 * A request will always return a response regardless of what the response represents (eg: success or failure).
	 *
	 * Errors should only be used to indicate unrecoverable problems like a network being unavailable.
	 */
	makeRequest(request: HttpRequest): Promise<HttpResponse>;
}
