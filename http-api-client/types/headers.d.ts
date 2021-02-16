import * as Async from "crocks/Async";

import { RequestHeaderFactory, RequestHeadersFactory } from "./request";

export type HttpHeaders = Record<string, string>;

export function createHeaders(factories: RequestHeaderFactory[]): () => RequestHeadersFactory;

export function bearerToken(accessToken: () => typeof Async, headers: HttpHeaders): typeof Async;
export function bearerToken(accessToken: () => typeof Async): RequestHeaderFactory;

export function constantHeaders(headers: HttpHeaders, requestHeaders: HttpHeaders): typeof Async;
export function constantHeaders(headers: HttpHeaders): RequestHeaderFactory;
