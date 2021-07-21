import * as Async from "crocks/Async";

import { HttpResult } from "./client";

export type UnstructuredData = Buffer | NodeJS.ReadableStream | ReadableStream | string;

export function unstructuredDataToString(
	path: string[],
	data: HttpResult<UnstructuredData>
): typeof Async;

export function unstructuredDataToString
	(path: string[]):
	(data: HttpResult<UnstructuredData>) => typeof Async;

export function collectUnstructuredDataToString(data: UnstructuredData): typeof Async

export function isReadable(obj: any): boolean;

export function isReadableStream(obj: any): boolean;
