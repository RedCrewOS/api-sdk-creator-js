const path = require("path");

module.exports = {
	entry: path.join(__dirname, "/src/index.ts"),
	output: {
		globalObject: "this",
		path: path.join(__dirname, "dist"),
		filename: "index.js",
		library: "Marshallers",
		libraryTarget: "umd"
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: "ts-loader",
				exclude: [/node_modules/, /test/]
			}
		]
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],

		// we don't want a polyfill for Node streams.
		fallback: { "stream": false }
	}
};
