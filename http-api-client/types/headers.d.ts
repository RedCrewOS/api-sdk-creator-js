import * as Async from "crocks/Async";
import * as List from "crocks/List";

export type HttpHeaders = Record<string, string>;

export type RequestHeaderFactory = (headers: HttpHeaders) => typeof Async;

export type RequestHeadersFactory = () => typeof Async;

export function createHeaders(factories: RequestHeaderFactory[] | typeof List): () => RequestHeadersFactory;

export function bearerToken(accessToken: () => typeof Async, headers: HttpHeaders): typeof Async;
export function bearerToken(accessToken: () => typeof Async): RequestHeaderFactory;

export function constantHeaders(headers: HttpHeaders, requestHeaders: HttpHeaders): typeof Async;
export function constantHeaders(headers: HttpHeaders): RequestHeaderFactory;
