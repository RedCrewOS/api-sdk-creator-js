export interface HttpResponse<T = any> {
	statusCode: number;
	statusMessage: string;

	headers: Record<string, string>;

	body: T;
}
