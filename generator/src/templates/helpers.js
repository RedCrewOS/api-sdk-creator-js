"use strict";

const Async = require("crocks/Async");

const compose = require("crocks/helpers/compose");
const concat = require("crocks/pointfree/concat");
const getPathOr = require("crocks/helpers/getPathOr");
const identity = require("crocks/combinators/identity");
const ifElse = require("crocks/logic/ifElse");
const pipe = require("crocks/helpers/pipe");
const unit = require("crocks/helpers/unit");

const { applyHandlebarsTo, registerHelper } = require("./wrappers");
const { isArrayType, isEnumType, isObjectType } = require("../predicates");
const { pluckProp } = require("../props");

// toArrayRef :: Object -> String
const toArrayRef =
	compose(concat("[]"), getPathOr("undefined", [ "items", "type" ]))

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
			registerHelper("typeRef", typeRef)
		]),
		Async.Resolved
	)

module.exports = {
	addHelpers
}
