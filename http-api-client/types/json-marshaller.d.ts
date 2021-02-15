import { HttpRequestPolicy, HttpResultHandler } from "./client";

import { UnstructuredData } from "./unstructured-data";

declare const JSON_MIME_TYPE: string;

export type JSONObject = Record<string, any>;

export function jsonMarshaller(contentType: string): HttpRequestPolicy<JSONObject>;

export function jsonUnmarshaller(): HttpResultHandler<UnstructuredData, UnstructuredData>;
