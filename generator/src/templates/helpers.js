"use strict";

const Async = require("crocks/Async");
const First = require("crocks/First");

const compose = require("crocks/helpers/compose");
const concat = require("crocks/pointfree/concat");
const constant = require("crocks/combinators/constant");
const getPathOr = require("crocks/helpers/getPathOr");
const identity = require("crocks/combinators/identity");
const ifElse = require("crocks/logic/ifElse");
const mreduce = require("crocks/helpers/mreduce");
const option = require("crocks/pointfree/option");
const pipe = require("crocks/helpers/pipe");
const safeLift = require("crocks/Maybe/safeLift");
const unit = require("crocks/helpers/unit");

const { applyFunctor } = require("@epistemology-factory/crocks-ext/helpers");

const { applyHandlebarsTo, registerHelper } = require("./wrappers");
const { isArrayType, isEnumType, isInbuiltType, isObjectType } = require("../predicates");
const { pluckProp } = require("../props");

// toArrayRef :: Object -> String
const toArrayRef =
	compose(concat("[]"), getPathOr("undefined", [ "items", "type" ]))

// mapTypeToPartialName :: String -> String
const mapTypeToPartialName =
	pipe(
		compose(mreduce(First), applyFunctor([
			safeLift(isInbuiltType, constant("scalar")),
			safeLift(isObjectType, identity)
		])),
		option(constant("unknown-partial"))
	)

// typeDef :: Object -> String
const typeDef =
	compose(mapTypeToPartialName, pluckProp("type"))

// typeRef :: Object -> String
const typeRef =
	ifElse(
		isArrayType,
		toArrayRef,
		pluckProp("type")
	)

// helper :: (a -> a | undefined) -> (this: a) -> a | undefined
const helper = (fn) =>
	// has to be a function to get the correct 'this'
	function() {
		return fn(this)
	}

// predicateHelper (a -> Boolean) -> (this: a) -> a | undefined
const predicateHelper = (pred) =>
	helper(ifElse(
		pred,
		identity,
		unit
	))

// addHelpers :: Handlebars -> Async Error Handlebars
const addHelpers =
	pipe(
		applyHandlebarsTo([
			registerHelper("isEnumType", predicateHelper(isEnumType)),
			registerHelper("isObjectType", predicateHelper(isObjectType)),
			registerHelper("typeDef", helper(typeDef)),
			registerHelper("typeRef", typeRef)
		]),
		Async.Resolved
	)

module.exports = {
	addHelpers
}
