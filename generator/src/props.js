"use strict";

const chain = require("crocks/pointfree/chain");
const compose = require("crocks/helpers/compose");
const curry = require("crocks/helpers/curry");
const flip = require("crocks/combinators/flip");
const map = require("crocks/pointfree/map");
const setProp = require("crocks/helpers/setProp");
const substitution = require("crocks/combinators/substitution");

const { getProp } = require("@epistemology-factory/crocks-ext/Result");

const { missingProp } = require("./errors");

// putProp :: String -> Object -> a -> Object
const putProp = (prop) =>
	flip(setProp(prop))

// modifyProp :: String -> (a -> Result Error b) -> Object -> Result Error Object
const modifyProp = curry((prop, fn) =>
	substitution(
		compose(map, putProp(prop)),
		compose(chain(fn), getProp(missingProp, prop))
	)
)

// pluckProp :: a -> Object -> b
const pluckProp = curry((prop, obj) => obj[prop])

module.exports = {
	modifyProp,
	pluckProp,
	putProp
}
