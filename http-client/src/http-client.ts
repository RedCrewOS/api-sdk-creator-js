import { HttpRequest } from "./http-request";
import { HttpResponse } from "./http-response";

const Async = require("crocks/Async");

/**
 * Data type that does not have a pre-defined data model/type definition.
 */
export type UnstructuredData = Buffer | NodeJS.ReadableStream | ReadableStream | string;

/**
 * A HttpClient deals strictly with unstructured data types. To use a HttpClient with structured
 * data (JSON, XML, etc) consumers of the HttpClient will need to be able to marshal and
 * unmarshal structured data to/from unstructured data types.
 *
 * Making a request will return the response regardless of what the response represents (ie: success or failure).
 *
 * @returns A resolution of {@link HttpResponse<UnstructuredData>}, or a rejection with the error
 *
 * Errors should only be used to indicate unrecoverable problems like a network being unavailable.
 */
export type HttpClient = (request: HttpRequest<UnstructuredData>) => typeof Async;
