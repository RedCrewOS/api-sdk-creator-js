import { HttpRequest } from "./http-request";
import { HttpResponse } from "./http-response";

/**
 * Data type that does not have a pre-defined data model/type definition.
 */
export type UnstructuredData = Buffer | NodeJS.ReadableStream | ReadableStream | string;

/**
 * A HttpClient deals strictly with unstructured data types. To use a HttpClient with structured
 * data (JSON, XML, etc) consumers of the HttpClient will need to be able to marshal and
 * unmarshal structured data to/from unstructured data types.
 *
 * @returns A request will always return a response regardless of what the response represents (eg: success or failure).
 *
 * Errors should only be used to indicate unrecoverable problems like a network being unavailable.
 */
export type HttpClient = (request: HttpRequest<UnstructuredData>) => Promise<HttpResponse<UnstructuredData>>;
