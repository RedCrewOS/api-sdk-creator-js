import { HttpResponse } from "./response";
import { HttpResult } from "./client";

export function getHttpResponse(result: HttpResult): HttpResponse;

export function getHttpBody(response: HttpResponse): any;

export function extractHttpBody(result: HttpResult): any;
