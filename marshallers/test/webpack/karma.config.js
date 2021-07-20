const path = require("path");

const rootDir = path.resolve(__dirname, "../..");

module.exports = function (config) {
	config.set({
		basePath: "./",
		plugins: [
			// need to manually require plugins due to Rush and symlinks
			"karma-jsdom-launcher",
			"karma-mocha",
			"karma-typescript"
		],
		frameworks: [ "mocha", "karma-typescript" ],
		preprocessors: {
			"**/*.ts": "karma-typescript"
		},
		reporters: [ "progress", "karma-typescript" ],
		browsers: [ "jsdom" ],

		files: [
			path.join(rootDir, "dist", "index.js"),

			"Marshallers.spec.ts",
		]
	});
};
