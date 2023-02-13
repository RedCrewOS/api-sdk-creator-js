import { HttpResponse } from "./response";
import { HttpResult } from "./client";

export function hasContentType(contentType: string, headerValue: string): boolean;
export function hasContentType(contentType: string): (headerValue: string) => boolean;

export function isRelativeUrl(value: string): boolean;

export function isSuccessfulResponse(response: HttpResponse): boolean;

export function isSuccessfulResult(result: HttpResult): boolean;

export function resultHasContentType(contentType: string, result: HttpResult): boolean;
export function resultHasContentType(contentType: string): (result: HttpResult) => boolean;
