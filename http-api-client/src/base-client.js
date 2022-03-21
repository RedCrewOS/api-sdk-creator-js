"use strict"

/**
 * Helper function to replace path parameters (slugs) in a URI
 *
 * @param {string} path A string with slugs
 * @param {object} params A map of slugs to values
 * @return {string} The path with the params replaced.
 */
exports.replacePathParams = (path, params) => {
	return path
		.split("/")
		.map((segment) => {
			if (segment[0] === ":") {
				const value = params[segment.substr(1)];

				if (value === undefined) {
					throw new Error(`No value provided for '${segment}'`);
				}

				return value;
			}

			return segment
		})
		.join("/");
}

/**
 * Creates a query string from an object.
 *
 * @param {object} params
 * @return {string} The query string.
 */
exports.createQueryString = (params) => {
	const keys = Object.keys(params);

	if (keys.length > 0) {
		return `?${keys
			.map((key) => `${key}=${encodeURIComponent(params[key])}`)
			.join("&")}`;
	}

	return "";
}
