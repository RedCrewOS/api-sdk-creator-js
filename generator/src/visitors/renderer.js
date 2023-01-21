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
const flip = require("crocks/combinators/flip");
const mreduce = require("crocks/helpers/mreduce");
const objOf = require("crocks/helpers/objOf");
const pipe = require("crocks/helpers/pipe");
const pipeK = require("crocks/helpers/pipeK");
const map = require("crocks/pointfree/map");
const merge = require("crocks/pointfree/merge");
const resultToAsync = require("crocks/Async/resultToAsync");
const substitution = require("crocks/combinators/substitution");
const toPairs = require("crocks/Pair/toPairs");

const { chainLiftA2 } = require("@epistemology-factory/crocks-ext/helpers");
const { getProp } = require("@epistemology-factory/crocks-ext/Async");
const { writeToDir } = require("@epistemology-factory/crocks-ext/node/fs");

const { missingProp } = require("../errors");
const { compileTemplate, newHbs } = require("../templates/hbs");
const { format } = require("../templates/prettier");
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

// formatContent :: (String -> Result Error String) -> (a -> Result Error String) -> a -> Result Error String
const formatContent = (formatter) =>
	map(chain(formatter))

// templateCompilerFor :: String -> Async Error (a -> Result Error String)
const templateCompilerFor = (language) =>
	pipe(
		compileTemplate(newHbs(language)),
		map(formatContent(format(language)))
	)

// compileNamedTemplateWith :: (String -> Async Error (a -> Result Error String)) -> Pair String String -> Async Error Object
const compileNamedTemplateWith = curry((compiler) =>
	pipe(
		bimap(objOf, compiler),

		// Pair (a -> Object) (Async Error (b -> Result Error String))
		merge(map)
	)
)

// compileNamedTemplatesWith :: Object -> (String -> Async Error (a -> Result Error String)) -> Async Error Object
const compileNamedTemplatesWith = flip((compiler) =>
	pipe(
		toPairs,
		map(compileNamedTemplateWith(compiler)),
		Async.all,
		map(mreduce(Assign))
	)
)

// compileNamedTemplatesFor :: Object -> String -> Async Error Object
const compileNamedTemplatesFor = curry((templates) =>
	compose(compileNamedTemplatesWith(templates), templateCompilerFor)
)

// renderTemplate :: (a -> Result Error String) -> a -> Async Error String
const renderTemplate = resultToAsync

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
			getProp(missingProp, "schemas"),
			renderSchemasObject(
				compileNamedTemplatesFor(layouts, language),
				filesWriter(toFilename(language), outdir)
			)
		)
	)
)

module.exports = {
	compileNamedTemplatesFor,
	renderComponentsObject,
	renderNamedTemplate
}
