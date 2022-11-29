import * as Async from "crocks/Async";

import { HttpRequestPolicy, HttpResult, HttpResultHandler } from "./client";
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
): (result: HttpResult) => typeof Async

export function unmarshallerFor
	(contentType: string):
	(transformer: (data: UnstructuredData) => typeof Async) => (result: HttpResult) => typeof Async

export function unmarshaller(unmarshallers: (result: HttpResult) => typeof Async): HttpResultHandler
