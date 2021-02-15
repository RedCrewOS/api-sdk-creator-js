import { Async } from "./crocks";
import { RequestHeaderFactory } from "./request";

export type HttpHeaders = Record<string, string>;

export function createHeaders(factories: RequestHeaderFactory[]): () => Async;

export function bearerToken(accessToken: () => Async, headers: HttpHeaders): Async;
export function bearerToken(accessToken: () => Async): RequestHeaderFactory;

export function constantHeaders(headers: HttpHeaders, requestHeaders: HttpHeaders): Async;
export function constantHeaders(headers: HttpHeaders): RequestHeaderFactory;
