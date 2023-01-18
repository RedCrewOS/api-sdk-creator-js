"use strict";

const maybeProp = require("crocks/Maybe/getProp");

const { getProp } = require("@epistemology-factory/crocks-ext/Result");

const { missingProp } = require("../errors");

// getObjectTypeDescription :: Object -> Maybe String
const getObjectTypeDescription = maybeProp("description");

// getObjectTypeProperties :: Object -> Result Error Object
const getObjectTypeProperties = getProp(missingProp, "properties");

// getObjectTypeTitle :: Object -> Result Error String
const getObjectTypeTitle = getProp(missingProp, "title");

// getObjectTypeType :: Object -> Result Error String
const getObjectTypeType = getProp(missingProp, "type");

module.exports = {
	getObjectTypeDescription,
	getObjectTypeProperties,
	getObjectTypeTitle,
	getObjectTypeType
}
