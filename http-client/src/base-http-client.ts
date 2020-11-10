/**
 * Can be used to build @{link HttpClient}s.
 */
export class BaseHttpClient {
	replacePathParams(path: string, params: Record<string, any>): string {
		return path
			.split("/")
			.map((segment) => {
				if (segment[0] === ":") {
					const value = params[segment.substr(1)];

					if (!value) {
						throw new Error(`No value provided for '${segment}'`);
					}

					return value;
				}

				return segment
			})
			.join("/");
	}
}
