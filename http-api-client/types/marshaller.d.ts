import * as Async from "crocks/Async";

import { HttpRequestPolicy, HttpResultHandler } from "./client";
import { UnstructuredData } from "./unstructured-data";

export function marshallerFor(
	contentType: string,
	transformer: (a: any) => typeof Async
): HttpRequestPolicy

export function marshallerFor
	(contentType: string):
	(transformer: (a: any) => typeof Async) => HttpRequestPolicy

export function unmarshallerFor(
	contentType: string,
	transformer: (data: UnstructuredData) => typeof Async
): (HttpResult) => typeof Async

export function unmarshallerFor
	(contentType: string):
	(transformer: (data: UnstructuredData) => typeof Async) => (HttpResult) => typeof Async

export function unmarshaller(unmarshallers: (HttpResult) => typeof Async): HttpResultHandler