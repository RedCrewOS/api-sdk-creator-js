"use strict";

const Result = require("crocks/Result");

const compose = require("crocks/helpers/compose");
const curry = require("crocks/helpers/curry");
const ifElse = require("crocks/logic/ifElse");
const isSame = require("crocks/predicates/isSame");
const map = require("crocks/pointfree/map");
const maybeProp = require("crocks/Maybe/getProp");
const option = require("crocks/pointfree/option");
const substitution = require("crocks/combinators/substitution");

const { pluckProp } = require("./props");
const { isInbuiltType } = require("./predicates");

// ifType :: (String -> Boolean) -> (SchemaObject -> Result Error SchemaObject)) -> SchemaObject -> Result Error SchemaObject
const ifType = curry((pred, fn) =>
	ifElse(compose(pred, pluckProp("type")), fn, Result.Ok)
)

// ifArrayType :: (SchemaObject -> Result Error SchemaObject) -> SchemaObject -> Result Error SchemaObject
const ifArrayType = ifType(isSame("array"))

// ifInbuiltType :: (SchemaObject -> Result Error SchemaObject) -> SchemaObject -> Result Error SchemaObject
const ifInbuiltType = ifType(isInbuiltType)

// ifObjectType :: (SchemaObject -> Result Error SchemaObject) -> SchemaObject -> Result Error SchemaObject
const ifObjectType = ifType(isSame("object"))

// ifPropPresent :: String -> (a -> Result Error b) -> Object -> Result Error b
const ifPropPresent = curry((prop, fn) =>
	substitution(
		compose(option, Result.Ok),
		compose(map(fn), maybeProp(prop))
	)
)

module.exports = {
	ifArrayType,
	ifInbuiltType,
	ifObjectType,
	ifPropPresent
}
