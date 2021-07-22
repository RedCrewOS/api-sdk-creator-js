import { HttpRequestPolicy, HttpResultHandler } from "./client";

import { UnstructuredData } from "./unstructured-data";

export const URL_ENCODED_MIME_TYPE: string;

/**
 * @param {string} [contentType] Defaults to URL_ENCODED_MIME_TYPE
 */
export function formMarshaller(contentType?: string): HttpRequestPolicy<Record<string, string>>;

export function formUnmarshaller(contentType?: string): HttpResultHandler<UnstructuredData, UnstructuredData>;
