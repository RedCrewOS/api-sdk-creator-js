import { HttpHeaders } from "./headers";

export interface HttpResponse<T = any> {
	statusCode: number;
	statusMessage: string;

	headers: HttpHeaders;

	body?: T;
}
