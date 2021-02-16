import * as Async from "crocks/Async";
import * as List from "crocks/List";

import { RequestHeaderFactory, RequestHeadersFactory } from "./request";

export type HttpHeaders = Record<string, string>;

export function createHeaders(factories: RequestHeaderFactory[] | List): () => RequestHeadersFactory;

export function bearerToken(accessToken: () => typeof Async, headers: HttpHeaders): typeof Async;
export function bearerToken(accessToken: () => typeof Async): RequestHeaderFactory;

export function constantHeaders(headers: HttpHeaders, requestHeaders: HttpHeaders): typeof Async;
export function constantHeaders(headers: HttpHeaders): RequestHeaderFactory;
