"use strict";

const Result = require("crocks/Result");

const chain = require("crocks/pointfree/chain");
const compose = require("crocks/helpers/compose");
const constant = require("crocks/combinators/constant");
const converge = require("crocks/combinators/converge");
const curry = require("crocks/helpers/curry");
const identity = require("crocks/combinators/identity");
const ifElse = require("crocks/logic/ifElse");
const isSame = require("crocks/predicates/isSame");
const map = require("crocks/pointfree/map");
const maybeProp = require("crocks/Maybe/getProp");
const option = require("crocks/pointfree/option");
const substitution = require("crocks/combinators/substitution");

const { getProp } = require("@epistemology-factory/crocks-ext/Result");

const { pluckProp, putProp } = require("./props");
const { isInbuiltType } = require("./predicates");
const { missingProp } = require("./errors");

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

// ifPropPresent :: String -> (a -> Result Error Object) -> Object -> Result Error Object
const ifPropPresent = curry((prop, fn) =>
	substitution(
		compose(option, Result.Ok),
		compose(map(fn), maybeProp(prop))
	)
)

// modifyProp :: String -> (a -> Result Error b) -> Object -> Result Error Object
const modifyProp = curry((prop, fn) =>
	substitution(
		compose(map, putProp(prop)),
		compose(chain(fn), getProp(missingProp, prop))
	)
)

// modifyPropIfPresent :: String -> (a -> Result Error b) -> Object -> Result Error Object
const modifyPropIfPresent = curry((prop, fn) =>
	converge(
		ifPropPresent(prop),
		compose(constant, modifyProp(prop, fn)),
		identity
	)
)

module.exports = {
	ifArrayType,
	ifInbuiltType,
	ifObjectType,
	ifPropPresent,
	modifyProp,
	modifyPropIfPresent
}
