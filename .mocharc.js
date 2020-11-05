"use strict";

process.env.NODE_ENV = "test";

module.exports = {
	require: [
		"ts-node/register",
		"tsconfig-paths/register"
	]
};
