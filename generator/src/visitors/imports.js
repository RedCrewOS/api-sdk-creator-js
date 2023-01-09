"use strict";

const Result = require("crocks/Result");

const assign = require("crocks/helpers/assign");
const bimap = require("crocks/pointfree/bimap");
const chain = require("crocks/pointfree/chain");
const compose = require("crocks/helpers/compose");
const composeK = require("crocks/helpers/composeK");
const contramap = require("crocks/pointfree/contramap");
const extend = require("crocks/pointfree/extend");
const fanout = require("crocks/Pair/fanout");
const filter = require("crocks/pointfree/filter");
const flip = require("crocks/combinators/flip");
const fromPairs = require("crocks/helpers/fromPairs");
const identity = require("crocks/combinators/identity");
const listToArray = require("crocks/List/listToArray");
const map = require("crocks/pointfree/map");
const merge = require("crocks/pointfree/merge");
const not = require("crocks/logic/not");
const objOf = require("crocks/helpers/objOf");
const pipe = require("crocks/helpers/pipe");
const pipeK = require("crocks/helpers/pipeK");
const resultToAsync = require("crocks/Async/resultToAsync");
const setProp = require("crocks/helpers/setProp");
const snd = require("crocks/Pair/snd");
const substitution = require("crocks/combinators/substitution");
const toPairs = require("crocks/Pair/toPairs");

const { chainLiftA2, unique } = require("@epistemology-factory/crocks-ext/helpers");
const { getProp } = require("@epistemology-factory/crocks-ext/Result");

const {
	getObjectTypeProperties,
	getObjectTypeTitle,
	getObjectTypeType
} = require("../accessors/object-type");
const { unknownType } = require("../errors");
const { modifyProp, putProp } = require("../props");
const { sequenceResult } = require("../result");
const { visitComponentObject } = require("./visitor");
const { ifArrayType, ifObjectType } = require("../transformers");
const { isInbuiltType } = require("../predicates");
const { getArrayTypeItemsType } = require("../accessors/array-type");

// filterForCustomTypes :: Filterable f => f String -> f String
const filterForCustomTypes =
	filter(not(isInbuiltType))

// filterTypes :: [ String ] -> [ String ]
const filterTypes = compose(unique, filterForCustomTypes)

// getTypesListFromObject :: Object -> Result Error [ String ]
const getTypesListFromObject =
	pipe(
		compose(listToArray, toPairs),
		sequenceResult(compose(getObjectTypeType, snd)),
		map(filterTypes)
	)

// findType :: Object -> String -> Result Error a
const findType =
	flip(getProp(unknownType))

// toImportRecord :: String -> Pair String Object
const toImportRecord =
	fanout(identity, objOf("type"))

// schemaObjectToImportRecord :: Pair String SchemaObject -> Result Error (Pair String Object)
const schemaObjectToImportRecord =
	pipe(
		bimap(
			compose(map, assign, objOf("location")),
			compose(map(toImportRecord), getObjectTypeTitle)
		),
		merge(map)
	)

// schemaObjectPairToImportRecordPair :: Pair String SchemaObject -> Result Error (Pair String Object)
const schemaObjectPairToImportRecordPair =
	compose(snd, extend(schemaObjectToImportRecord))

// indexTypes :: SchemaObject -> Result Error Object
const indexTypes =
	pipe(
		toPairs,
		sequenceResult(schemaObjectPairToImportRecordPair),
		map(fromPairs),
	)

// getImportsForTypes :: Foldable f => Object -> f String -> Result Error (f Object)
const getImportsForTypes = (imports) =>
	sequenceResult(findType(imports))

// getImportForItems :: Object -> String -> Result Error [ Object ]
const getImportForItems = (imports) =>
	compose(getImportsForTypes(imports), filterTypes, Array.of)

// getImportsForProperties :: Object -> Object -> Result Error [ Object ]
const getImportsForProperties = (imports) =>
	compose(chain(getImportsForTypes(imports)), getTypesListFromObject)

// setImportsForSchemaObject :: (SchemaObject -> Result Error [ Object ]) -> SchemaObject -> Result Error Object
const setImportsForSchemaObject = (fn) =>
	substitution(compose(map, putProp("imports")), fn)

// resolveImportsInObjectType :: Object -> SchemaObject -> Result Error Object
const resolveImportsInObjectType = (imports) =>
	ifObjectType(setImportsForSchemaObject(
		composeK(getImportsForProperties(imports), getObjectTypeProperties)
	))

// resolveImportsInArrayType :: Object -> SchemaObject -> Result Error Object
const resolveImportsInArrayType = (imports) =>
	ifArrayType(setImportsForSchemaObject(
		composeK(getImportForItems(imports), getArrayTypeItemsType)
	))

// resolveImportsForScalarTypes :: SchemaObject -> Result Object
const resolveImportsForScalarTypes =
	compose(Result.Ok, setProp("imports", []))

// resolveImportsInSchemaObject :: Object -> SchemaObject -> Result Error Object
const resolveImportsInSchemaObject = (imports) =>
	pipeK(
		resolveImportsForScalarTypes,
		resolveImportsInObjectType(imports),
		resolveImportsInArrayType(imports)
	)

// resolveImportsInSchemasObject :: SchemaObject -> Result Error SchemaObject
const resolveImportsInSchemasObject = visitComponentObject(
	compose(contramap(Result.Ok), chainLiftA2(resolveImportsInSchemaObject), indexTypes)
)

// resolveImportsInComponentsObject :: ComponentsObject -> Async Error Object
const resolveImportsInComponentsObject =
	resultToAsync(pipeK(
		modifyProp("schemas", resolveImportsInSchemasObject)
	))

module.exports = {
	resolveImportsInComponentsObject
}
