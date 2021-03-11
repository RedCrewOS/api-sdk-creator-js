import { HttpRequestPolicy, HttpResultHandler } from "./client";

import { UnstructuredData } from "./unstructured-data";

export const JSON_MIME_TYPE: string;

export type JSONObject = Record<string, any>;

/**
 * @param {string} [contentType] Defaults to JSON_MIME_TYPE
 */
export function jsonMarshaller(contentType?: string): HttpRequestPolicy<JSONObject>;

export function jsonUnmarshaller(contentType?: string): HttpResultHandler<UnstructuredData, UnstructuredData>;
