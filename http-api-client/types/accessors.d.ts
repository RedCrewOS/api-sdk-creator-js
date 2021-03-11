import * as Result from "crocks/Result";

import { HttpHeaders } from "./headers";
import { HttpResponse } from "./response";
import { HttpResult } from "./client";

export function getHttpResponse(result: HttpResult): HttpResponse;

export function getHttpBody(response: HttpResponse): any;

export function extractHttpBody(result: HttpResult): any;

export function parseIntHeader(header: String, headers: HttpHeaders): typeof Result;
export function parseIntHeader(header: String): (headers: HttpHeaders) => typeof Result;
