"use strict";

const { allOf, containsString, hasProperty, instanceOf } = require("hamjest");

const missingPropError = (prop) =>
	allOf(
		instanceOf(Error),
		hasProperty("message", containsString(`Missing mandatory prop '${prop}'`))
	)

module.exports = {
	missingPropError
}
