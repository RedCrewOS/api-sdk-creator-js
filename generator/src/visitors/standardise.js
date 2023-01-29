"use strict";

const Result = require("crocks/Result");

const compose = require("crocks/helpers/compose");
const filter = require("crocks/pointfree/filter");
const isEmpty = require("crocks/predicates/isEmpty");
const not = require("crocks/logic/not");
const pipe = require("crocks/helpers/pipe");
const pipeK = require("crocks/helpers/pipeK");
const resultToAsync = require("crocks/Async/resultToAsync");

const { split } = require("@epistemology-factory/crocks-ext/String");

const { ifArrayType, ifObjectType, modifyProp, modifyPropIfPresent } = require("../transformers");
const { visitObject } = require("./visitor");

// removeEmptyLines :: [ String ] -> [ String ]
const removeEmptyLines = filter(not(isEmpty))

// splitLines :: String -> [ String ]
const splitLines = split("\n");

// parseDescription :: String -> [ String ]
const parseDescription =
	pipe(
		splitLines,
		removeEmptyLines
	)

// standardiseDocumentation :: SchemaObject -> Result Error SchemaObject
const standardiseDocumentation =
	modifyPropIfPresent("description", compose(Result.Ok, parseDescription))

// standardiseDocumentationInArrayTypeItems :: SchemaObject -> Result Error SchemaObject
const standardiseDocumentationInArrayTypeItems =
	modifyProp("items", standardiseDocumentation)

// standardiseDocumentationInArrayType :: SchemaObject -> Result Error SchemaObject
const standardiseDocumentationInArrayType =
	ifArrayType(
		standardiseDocumentationInArrayTypeItems
	)

// standardiseDocumentationInObjectType :: SchemaObject -> Result Error SchemaObject
const standardiseDocumentationInObjectType =
	ifObjectType(modifyProp("properties", visitObject(pipeK(
		standardiseDocumentation,
		standardiseDocumentationInArrayType
	))))

// standardiseSchemaObject :: SchemaObject -> Result Error SchemaObject
const standardiseSchemaObject =
	pipeK(
		standardiseDocumentation,
		standardiseDocumentationInObjectType,
		standardiseDocumentationInArrayType,
	)

// standardiseSchemasObject :: SchemaObject -> Result Error SchemaObject
const standardiseSchemasObject = visitObject(
	standardiseSchemaObject
)

// standardiseComponentsObject :: ComponentsObject -> Async Error ComponentsObject
const standardiseComponentsObject =
	resultToAsync(pipeK(
		modifyProp("schemas", standardiseSchemasObject)
	))

module.exports = {
	standardiseComponentsObject
}
