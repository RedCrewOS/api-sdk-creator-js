"use strict";

const Result = require("crocks/Result");

const compose = require("crocks/helpers/compose");
const pipe = require("crocks/helpers/pipe");
const pipeK = require("crocks/helpers/pipeK");
const resultToAsync = require("crocks/Async/resultToAsync");

const { split, trim } = require("@epistemology-factory/crocks-ext/String");

const { ifArrayType, ifObjectType, modifyProp, modifyPropIfPresent } = require("../transformers");
const { sequenceResult } = require("../result");
const { visitObject } = require("./visitor");

// splitLines :: String -> [ String ]
const splitLines = split("\n");

// parseDescription :: String -> [ String ]
const parseDescription =
	pipe(
		trim,
		splitLines
	)

// standardiseDocumentation :: SchemaObject -> Result Error SchemaObject
const standardiseDocumentation =
	modifyPropIfPresent("description", compose(Result.Ok, parseDescription))

// standardiseDocumentationInArrayTypeItems :: SchemaObject -> Result Error SchemaObject
const standardiseDocumentationInArrayTypeItems =
	modifyProp("items", standardiseDocumentation)

// standardiseDocumentationInArrayType :: SchemaObject -> Result Error SchemaObject
const standardiseDocumentationInArrayType =
	ifArrayType(standardiseDocumentationInArrayTypeItems)

// standardiseDocumentationInCompositeType :: SchemaObject -> Result Error SchemaObject
const standardiseDocumentationInCompositeType =
	modifyPropIfPresent("allOf", sequenceResult((x) => standardiseSchemaObject(x)))

// standardiseDocumentationInObjectType :: SchemaObject -> Result Error SchemaObject
const standardiseDocumentationInObjectType =
	ifObjectType(modifyProp("properties", visitObject(pipeK(
		standardiseDocumentation,
		standardiseDocumentationInCompositeType,
		standardiseDocumentationInArrayType
	))))

// standardiseSchemaObject :: SchemaObject -> Result Error SchemaObject
const standardiseSchemaObject =
	pipeK(
		standardiseDocumentation,
		standardiseDocumentationInCompositeType,
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
