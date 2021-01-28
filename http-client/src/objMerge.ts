import merge from "deepmerge";

const curry = require("crocks/core/curry");

function mergeObject(target: any, source: any): any {
	return merge(target, source);
}

export default curry(mergeObject);
