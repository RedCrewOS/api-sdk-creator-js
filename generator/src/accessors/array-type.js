"use strict";

const composeK = require("crocks/helpers/composeK");

const { getProp } = require("@epistemology-factory/crocks-ext/Result");

const { missingProp } = require("../errors");
const { getObjectTypeType } = require("./object-type");

// getArrayTypeItems :: Object -> Result Error Object
const getArrayTypeItems = getProp(missingProp, "items");

// getArrayTypeItemsType :: SchemaObject -> Result Error String
const getArrayTypeItemsType =
	composeK(getObjectTypeType, getArrayTypeItems)

module.exports = {
	getArrayTypeItems,
	getArrayTypeItemsType
}
