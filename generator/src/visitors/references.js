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
const isSame = require("crocks/predicates/isSame");
const liftA2 = require("crocks/helpers/liftA2");
const map = require("crocks/pointfree/map");
const mapReduce = require("crocks/helpers/mapReduce");
const maybeProp = require("crocks/Maybe/getProp");
const merge = require("crocks/pointfree/merge");
const mreduce = require("crocks/helpers/mreduce");
const objOf = require("crocks/helpers/objOf");
const omit = require("crocks/helpers/omit");
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
const { join, split } = require("@epistemology-factory/crocks-ext/String");

const { unknownType } = require("../errors");
const { modifyProp, pluckProp } = require("../props");
const { sequenceResult } = require("../result");
const { visitComponentObject, visitObject } = require("./visitor");
const {
	getObjectTypeDescription,
	getObjectTypeProperties,
	getObjectTypeType,
	getObjectTypeTitle
} = require("../accessors/object-type");
const { ifArrayType, ifObjectType, ifPropPresent } = require("../transformers");

// last :: [ a ] -> Integer
const last = (arr) => arr[arr.length - 1]

// sort :: [ a ] -> [ a ]
const sort = (arr) => arr.sort()

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

// transformProps :: [ (Object -> Result Error (Object -> Object)) ] -> Object -> Result Error Object
const transformProps = (fns) =>
	compose(reduce(ap, Result.Ok({})), applyFunctor(fns))

// mapRequiredProperty :: Object -> (Object -> Object)
const mapRequiredProperty = (fn) =>
	compose(either(constant(identity), fn), maybeProp("required"))

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
		getObjectTypeProperties
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
		Result.Ok(emptyObjectType()),
		mergeObjectTypeProperties(a, b),
		mergeObjectTypeRequired(a, b)
	]))
)

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

// inlineRequiredPropertiesIntoObjectTypeProperties :: SchemaObject -> Result Error SchemaObject
const inlineRequiredPropertiesIntoObjectTypeProperties =
	substitution(
		flip(modifyProp("properties")),
		compose(map(Result.Ok), mapRequiredProperty(inlineRequiredPropertyIntoObjectTypeProperty))
	)

// inlineReferencedTypes :: (SchemaObject -> Result Error Object) -> [ SchemaObject ] -> Result Error [ SchemaObject ]
const inlineReferencedTypes = sequenceResult

// resolveRef :: (SchemaObject -> Result Error Object) -> SchemaObject -> SchemaObject -> Result Error Object
const resolveRef =
	binary(compose(ifPropPresent("$ref"), inlineReference))

// resolveTypeRef :: SchemaObject -> SchemaObject -> Result Error Object
const resolveTypeRef =
	resolveRef(transformProps([
		compose(map(setProp("type")), getObjectTypeTitle)
	]))

// resolveObjectTypeRef :: SchemaObject -> SchemaObject -> Result Error Object
const resolveObjectTypeRef =
	resolveRef(transformProps([
		compose(map(setProp("type")), getObjectTypeType),
		compose(map(setProp("properties")), getObjectTypeProperties),
		compose(Result.Ok, mapRequiredProperty(setProp("required")))
	]))

// reduceResolvedRefIntoParent :: String -> (a -> Result Error b) -> Object -> Result Error b
const reduceResolvedRefIntoParent = curry((prop, fn) =>
	substitution(
		compose(map, assign, omit([ prop ])),
		ifPropPresent(prop, fn)
	)
)

// reduceObjectTypePropertyAllOf :: SchemaObject -> SchemaObject -> Result Error Object
const reduceObjectTypePropertyAllOf = (schemas) =>
	ifPropPresent("allOf", pipe(
		sequenceResult(resolveObjectTypePropertyRef(schemas)),
		map(mreduce(Assign))
	))

// reduceObjectTypePropertyOneOf :: SchemaObject -> SchemaObject -> Result Error Object
const reduceObjectTypePropertyOneOf = (schemas) =>
	ifPropPresent("oneOf", pipe(
		sequenceResult(resolveObjectTypePropertyRef(schemas)),
		map(reduceToUnionType),
	))

// reduceCompositeType :: [ SchemaObject ] -> Result Error SchemaObject
const reduceCompositeType =
	mapReduce(Result.Ok, chainLiftA2(mergeObjectTypes), Result.Ok(emptyObjectType()))

// TODO: This will only work for Typescript
// reduceToUnionType :: [ Object ] -> Object
const reduceToUnionType =
	compose(objOf("type"), join(" | "), sort, map(pluckProp("type")))

// resolveObjectTypePropertyRef :: SchemaObject -> SchemaObject -> Result Error Object
const resolveObjectTypePropertyRef =
	resolveRef(transformProps([
		compose(map(setProp("type")), getObjectTypeTitle),
		compose(Result.Ok, either(constant(identity), setProp("description")), getObjectTypeDescription)
	]))

// resolveRefsInArrayTypeItems :: SchemaObject -> SchemaObject -> Result Error SchemaObject
const resolveRefsInArrayTypeItems = (schemas) =>
	modifyProp("items", pipeK(
		resolveObjectTypePropertyRef(schemas)
	))

// resolveRefsInObjectTypeProperties :: SchemaObject -> SchemaObject -> Result Error SchemaObject
const resolveRefsInObjectTypeProperties = (schemas) =>
	modifyProp("properties", visitObject(
		pipeK(
			resolveObjectTypePropertyRef(schemas),
			reduceObjectTypePropertyAllOf(schemas),
			reduceObjectTypePropertyOneOf(schemas),
			resolveRefsInArrayType(schemas)
		)
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
		inlineRequiredPropertiesIntoObjectTypeProperties
	))

// resolveRefsInCompositeType :: SchemaObject -> SchemaObject -> Result Error SchemaObject
const resolveRefsInCompositeType = (schemas) =>
	pipeK(
		reduceResolvedRefIntoParent("allOf", pipeK(
			inlineReferencedTypes(resolveObjectTypeRef(schemas)),
			reduceCompositeType
		)),
		reduceResolvedRefIntoParent("oneOf", pipe(
			inlineReferencedTypes(resolveTypeRef(schemas)),
			map(reduceToUnionType),
		))
	)

// resolveRefsInSchemaObject :: SchemaObject -> SchemaObject -> Result Error SchemaObject
const resolveRefsInSchemaObject = (schemas) =>
	pipeK(
		resolveRefsInCompositeType(schemas),
		resolveRefsInObjectType(schemas),
		resolveRefsInArrayType(schemas),
	)

// resolveRefsInSchemasObject :: SchemaObject -> Result Error SchemaObject
const resolveRefsInSchemasObject = visitComponentObject(
	resolveRefsInSchemaObject
)

// resolveRefsInComponentsObject :: ComponentsObject -> Async Error ComponentsObject
const resolveRefsInComponentsObject =
	resultToAsync(pipeK(
		modifyProp("schemas", resolveRefsInSchemasObject)
	))

module.exports = {
	resolveRefsInComponentsObject
}
