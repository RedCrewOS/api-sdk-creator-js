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

// ifType :: String -> (SchemaObject -> Result Error SchemaObject)) -> SchemaObject -> Result Error SchemaObject
const ifType = curry((type, fn) =>
	ifElse(compose(isSame(type), pluckProp("type")), fn, Result.Ok)
)

// ifArrayType :: (SchemaObject -> Result Error SchemaObject) -> SchemaObject -> Result Error SchemaObject
const ifArrayType = ifType("array")

// ifObjectType :: (SchemaObject -> Result Error SchemaObject) -> SchemaObject -> Result Error SchemaObject
const ifObjectType = ifType("object")

// ifPropPresent :: String -> (a -> Result Error b) -> Object -> Result Error b
const ifPropPresent = curry((prop, fn) =>
	substitution(
		compose(option, Result.Ok),
		compose(map(fn), maybeProp(prop))
	)
)

module.exports = {
	ifArrayType,
	ifObjectType,
	ifPropPresent
}
