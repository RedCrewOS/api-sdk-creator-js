"use strict";

const Assign = require("crocks/Assign");
const Result = require("crocks/Result");

const ap = require("crocks/pointfree/ap");
const assign = require("crocks/helpers/assign");
const bimap = require("crocks/pointfree/bimap");
const binary = require("crocks/helpers/binary");
const chain = require("crocks/pointfree/chain");
const compose = require("crocks/helpers/compose");
const concat = require("crocks/pointfree/concat");
const constant = require("crocks/combinators/constant");
const curry = require("crocks/helpers/curry");
const either = require("crocks/pointfree/either");
const extend = require("crocks/pointfree/extend");
const find = require("crocks/Maybe/find");
const flip = require("crocks/combinators/flip");
const fromPairs = require("crocks/helpers/fromPairs");
const getPropOr = require("crocks/helpers/getPropOr");
const identity = require("crocks/combinators/identity");
const ifElse = require("crocks/logic/ifElse");
const liftA2 = require("crocks/helpers/liftA2");
const map = require("crocks/pointfree/map");
const mapReduce = require("crocks/helpers/mapReduce");
const maybeProp = require("crocks/Maybe/getProp");
const merge = require("crocks/pointfree/merge");
const mreduce = require("crocks/helpers/mreduce");
const objOf = require("crocks/helpers/objOf");
const option = require("crocks/pointfree/option");
const pipe = require("crocks/helpers/pipe");
const pipeK = require("crocks/helpers/pipeK");
const psi = require("crocks/combinators/psi");
const reduce = require("crocks/pointfree/reduce");
const resultToAsync = require("crocks/Async/resultToAsync");
const sequence = require("crocks/pointfree/sequence");
const setProp = require("crocks/helpers/setProp");
const substitution = require("crocks/combinators/substitution");
const toPairs = require("crocks/Pair/toPairs");

const { applyFunctor, chainLiftA2 } = require("@epistemology-factory/crocks-ext/helpers");
const { getProp } = require("@epistemology-factory/crocks-ext/Result");
const { split } = require("@epistemology-factory/crocks-ext/String");

const { missingProp, unknownType } = require("../errors");
const { modifyProp } = require("../props");
const { sequenceResult } = require("../result");

// last :: [ a ] -> Integer
const last = (arr) => arr[arr.length - 1]

// emptyObjectType :: () -> SchemaObject
const emptyObjectType = constant({
	type: "object",
	properties: {}
})

// findProp :: Foldable f => f a -> a -> Maybe a
const findProp = (f) =>
	compose(flip(find, f), isSame)

// propExists :: [ a ] -> a -> Boolean
const propExists = (lst) =>
	compose(either(constant(false), constant(true)), findProp(lst))

// transformProps :: [ Object -> Result Error Object ] -> Object -> Result Error Object
const transformProps = (fns) =>
	compose(reduce(ap, Result.Ok({})), applyFunctor(fns))

// setRequiredFlagInObject :: [ String ] -> Pair String Object -> Object
const setRequiredFlagInObject = (required) =>
	pipe(
		bimap(propExists(required), identity),
		merge(setProp("required"))
	)

// mergeObjectTypeProperties :: SchemaObject -> SchemaObject -> Result Error Object
const mergeObjectTypeProperties = binary(
	compose(map(objOf("properties")), psi(
		liftA2(flip(assign)),
		getProp(missingProp, "properties")
	))
)

// mergeObjectTypeRequired :: SchemaObject -> SchemaObject -> Result Error Object
const mergeObjectTypeRequired = binary(
	compose(Result.Ok, objOf("required"), psi(
		concat,
		getPropOr([], "required")
	))
)

// mergeObjectTypes :: SchemaObject -> SchemaObject -> Result Error SchemaObject
const mergeObjectTypes = curry((a, b) =>
	map(mreduce(Assign), sequence(Result, [
		Result.Ok({ type: "object" }),
		mergeObjectTypeProperties(a, b),
		mergeObjectTypeRequired(a, b)
	]))
)

// ifPropPresent :: String -> (a -> Result Error b) -> Object -> Result Error b
const ifPropPresent = curry((prop, fn) =>
	substitution(
		compose(option, Result.Ok),
		compose(map(fn), maybeProp(prop))
	)
)

// ifType :: String -> (SchemaObject -> Result Error SchemaObject)) -> SchemaObject -> Result Error SchemaObject
const ifType = curry((t, fn) =>
	ifElse(({ type }) => type === t, fn, Result.Ok)
)

// ifArrayType :: (SchemaObject -> Result Error SchemaObject) -> SchemaObject -> Result Error SchemaObject
const ifArrayType = ifType("array")

// ifObjectType :: (SchemaObject -> Result Error SchemaObject) -> SchemaObject -> Result Error SchemaObject
const ifObjectType = ifType("object")

// inlineReference :: (SchemaObject -> Result Error Object) -> SchemaObject -> String -> Result Error Object
const inlineReference = curry((mapping, schemas) =>
	pipe(
		compose(flip(getProp(unknownType), schemas), last, split("/")),
		chain(mapping)
	)
)

// inlineRequiredPropertyIntoObjectTypeProperty :: [ String ] -> Object -> Object
const inlineRequiredPropertyIntoObjectTypeProperty = curry((required) =>
	pipe(
		toPairs,
		map(extend(setRequiredFlagInObject(required))),
		fromPairs
	)
)

// inlineRequiredPropertyIntoObjectTypeProperties :: Object -> (Object -> Object)
const inlineRequiredPropertyIntoObjectTypeProperties =
	pipe(
		maybeProp("required"),
		either(constant(identity), inlineRequiredPropertyIntoObjectTypeProperty)
	)

// inlineRequiredPropertiesForObjectTypeProperties :: SchemaObject -> Result Error SchemaObject
const inlineRequiredPropertiesForObjectTypeProperties =
	substitution(
		flip(modifyProp("properties")),
		compose(map(Result.Ok), inlineRequiredPropertyIntoObjectTypeProperties)
	)

// inlineReferencedTypes :: SchemaObject -> [ SchemaObject ] -> Result Error [ SchemaObject ]
const inlineReferencedTypes = (schemas) =>
	sequenceResult(resolveTypeRef(schemas))

// resolveRef :: (SchemaObject -> Result Error Object) -> SchemaObject -> SchemaObject -> Result Error Object
const resolveRef =
	binary(compose(ifPropPresent("$ref"), inlineReference))

// resolveTypeRef :: SchemaObject -> SchemaObject -> Result Error Object
const resolveTypeRef =
	resolveRef(transformProps([
		compose(map(setProp("type")), getProp(missingProp, "type")),
		compose(map(setProp("properties")), getProp(missingProp, "properties")),
		compose(Result.Ok, either(constant(identity), setProp("required")), maybeProp("required"))
	]))

// reduceObjectTypePropertyAllOf :: SchemaObject -> SchemaObject -> Result Error Object
const reduceObjectTypePropertyAllOf = (schemas) =>
	ifPropPresent("allOf", pipe(
		sequenceResult(resolveObjectTypePropertyRef(schemas)),
		map(mreduce(Assign))
	))

// reduceCompositeType :: [ SchemaObject ] -> Result Error SchemaObject
const reduceCompositeType =
	mapReduce(Result.Ok, chainLiftA2(mergeObjectTypes), Result.Ok(emptyObjectType()))

// resolveObjectTypePropertyRef :: SchemaObject -> SchemaObject -> Result Error Object
const resolveObjectTypePropertyRef =
	resolveRef(transformProps([
		compose(map(setProp("type")), getProp(missingProp, "title")),
		compose(map(setProp("description")), getProp(missingProp, "description"))
	]))

// resolveRefsInArrayTypeItems :: SchemaObject -> SchemaObject -> Result Error SchemaObject
const resolveRefsInArrayTypeItems = (schemas) =>
	modifyProp("items", pipeK(
		resolveObjectTypePropertyRef(schemas)
	))

// resolveRefsInObjectTypeProperties :: SchemaObject -> SchemaObject -> Result Error SchemaObject
const resolveRefsInObjectTypeProperties = (schemas) =>
	modifyProp("properties", pipe(
		toPairs,

		// List (Pair String SchemaObject)
		sequenceResult(sequenceResult(pipeK(
			resolveObjectTypePropertyRef(schemas),
			reduceObjectTypePropertyAllOf(schemas)
		))),

		// Result Error (List (Pair String SchemaObject))
		map(fromPairs)
	))

// resolveRefsInArrayType :: SchemaObject -> SchemaObject -> Result Error SchemaObject
const resolveRefsInArrayType = (schemas) =>
	ifArrayType(pipeK(
		resolveRefsInArrayTypeItems(schemas)
	))

// resolveRefsInObjectType :: SchemaObject -> SchemaObject -> Result Error SchemaObject
const resolveRefsInObjectType = (schemas) =>
	ifObjectType(pipeK(
		resolveRefsInObjectTypeProperties(schemas),
		inlineRequiredPropertiesForObjectTypeProperties
	))

// resolveRefsInCompositeType :: SchemaObject -> SchemaObject -> Result Error SchemaObject
const resolveRefsInCompositeType = (schemas) =>
	ifPropPresent("allOf", pipeK(
		inlineReferencedTypes(schemas),
		reduceCompositeType
	))

// resolveRefsInSchemaObject :: SchemaObject -> SchemaObject -> Result Error SchemaObject
const resolveRefsInSchemaObject = (schemas) =>
	pipeK(
		resolveRefsInCompositeType(schemas),
		resolveRefsInObjectType(schemas),
		resolveRefsInArrayType(schemas),
	)

// resolveRefsInSchemasObject :: SchemaObject -> Result Error SchemaObject
const resolveRefsInSchemasObject =
	pipe(
		substitution(compose(sequenceResult, sequenceResult, resolveRefsInSchemaObject), toPairs),

		// (Result Error (List (Pair String SchemaObject)))
		map(fromPairs)
	)

// resolveRefsInComponentsObject :: ComponentsObject -> Async Error ComponentsObject
const resolveRefsInComponentsObject =
	resultToAsync(pipeK(
		modifyProp("schemas", resolveRefsInSchemasObject)
	))

module.exports = {
	resolveRefsInComponentsObject
}
