const path = require("path");

const webpack = require("webpack")

module.exports = {
	entry: path.join(__dirname, "/src/axios-http-client.ts"),
	output: {
		globalObject: "this",
		path: path.join(__dirname, "dist"),
		filename: "axios-http-client.js",
		library: "AxiosHttpClient",
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
	plugins: [
		new webpack.DefinePlugin({
			"process.env.NODE_DEBUG": JSON.stringify(process.env.NODE_DEBUG)
		})
	],
	resolve: {
		extensions: [".tsx", ".ts", ".js"],

		// we don't want a polyfill for Node streams.
		fallback: { "stream": false }
	}
};
