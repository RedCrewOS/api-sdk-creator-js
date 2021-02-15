import { Async } from "./crocks";
import { HttpResult } from "./client";

export type UnstructuredData = Buffer | NodeJS.ReadableStream | ReadableStream | string;

export function unstructuredDataAtPathToString(
	path: string[],
	data: HttpResult<UnstructuredData>
): Async;

export function unstructuredDataAtPathToString
	(path: string[]):
	(data: HttpResult<UnstructuredData>) => Async;

export function unstructuredDataToString(data: UnstructuredData): Async

export function isReadable(obj: any): boolean;

export function isReadableStream(obj: any): boolean;
