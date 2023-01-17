"use strict";

const Assign = require("crocks/Assign");
const Async = require("crocks/Async");

const bimap = require("crocks/pointfree/bimap");
const chain = require("crocks/pointfree/chain");
const compose = require("crocks/helpers/compose");
const concat = require("crocks/pointfree/concat");
const constant = require("crocks/combinators/constant");
const contramap = require("crocks/pointfree/contramap");
const curry = require("crocks/helpers/curry");
const mreduce = require("crocks/helpers/mreduce");
const objOf = require("crocks/helpers/objOf");
const pipe = require("crocks/helpers/pipe");
const pipeK = require("crocks/helpers/pipeK");
const map = require("crocks/pointfree/map");
const merge = require("crocks/pointfree/merge");
const resultToAsync = require("crocks/Async/resultToAsync");
const substitution = require("crocks/combinators/substitution");
const toPairs = require("crocks/Pair/toPairs");
const tryCatch = require("crocks/Result/tryCatch");

const { chainLiftA2 } = require("@epistemology-factory/crocks-ext/helpers");
const { getProp } = require("@epistemology-factory/crocks-ext/Async");
const { writeToDir } = require("@epistemology-factory/crocks-ext/node/fs");

const { missingProp } = require("../errors");
const { compileTemplate, newHbs } = require("../templates/hbs");
const { pluckProp } = require("../props");

// layouts :: Object
const layouts = {
	schemaObject: "{{> schema-object }}"
}

// toFilename :: String -> String -> String
const toFilename = (_) =>
	concat(".d.ts")

// filesWriter :: (String -> String) -> String -> String -> String -> Async Error Unit
const filesWriter = curry((fn, dir) =>
	compose(writeToDir({ encoding: "utf8" }, dir), fn)
)

// compileNamedTemplate :: Async Error Handlebars -> Pair String String -> Async Error Object
const compileNamedTemplate = (hbs) =>
	pipe(
		bimap(objOf, compileTemplate(hbs)),
		merge(map)
	)

// compileNamedTemplates :: Async Error Handlebars -> Object -> Async Error Object
const compileNamedTemplates = curry((hbs) =>
	pipe(
		toPairs,
		map(compileNamedTemplate(hbs)),
		Async.all,
		map(mreduce(Assign))
	)
)

// renderTemplate :: (a -> String) -> a -> Async Error String
const renderTemplate = curry(compose(resultToAsync, tryCatch))

// renderNamedTemplate :: Async Error Object -> String -> a -> Async Error String
const renderNamedTemplate = curry((templates, name) =>
	contramap(Async.of, chainLiftA2(renderTemplate, map(pluckProp(name), templates)))
)

// renderSchemaObject :: Async Error Object -> (String -> String -> Async Error Unit) -> Pair String SchemaObject -> Async Error Unit
const renderSchemaObject = curry((templates, writer) =>
	pipe(
		bimap(writer, renderNamedTemplate(templates, "schemaObject")),
		merge(chain)
	)
)

// renderSchemasObject :: Async Error Object -> (String -> String -> Async Error Unit) -> SchemaObject -> Async Error ComponentsObject
const renderSchemasObject = curry((templates, writer) =>
	pipe(
		toPairs,
		map(renderSchemaObject(templates, writer)),
		Async.all
	)
)

// renderComponentsObject :: String -> String -> ComponentsObject -> Async Error ComponentsObject
const renderComponentsObject = curry((outdir, language) =>
	substitution(
		compose(map, constant),
		pipeK(
			pipeK(
				getProp(missingProp, "schemas"),
				renderSchemasObject(
					compileNamedTemplates(newHbs(language), layouts),
					filesWriter(toFilename(language), outdir)
				)
			)
		)
	)
)

module.exports = {
	compileNamedTemplates,
	renderComponentsObject,
	renderNamedTemplate
}
