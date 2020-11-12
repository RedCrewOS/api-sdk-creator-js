export function replacePathParams(path: string, params: Record<string, any>): string {
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

export function createQueryString(params: Record<string, string>): string {
	const keys = Object.keys(params);

	if (keys.length > 0) {
		return `?${keys
			.map((key) => `${key}=${encodeURIComponent(params[key])}`)
			.join("&")}`;
	}

	return "";
}
