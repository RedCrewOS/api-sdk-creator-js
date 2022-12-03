"use strict";

const missingProp = (prop) =>
	new Error(`Missing mandatory prop '${prop}'`)

const unknownType = (type) =>
	new Error(`Unknown type '${type}'`)

module.exports = {
	missingProp,
	unknownType
}
