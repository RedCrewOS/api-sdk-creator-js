"use strict";

const curry = require("crocks/helpers/curry");
const flip = require("crocks/combinators/flip");
const setProp = require("crocks/helpers/setProp");

// putProp :: String -> Object -> a -> Object
const putProp = (prop) =>
	flip(setProp(prop))

// pluckProp :: a -> Object -> b
const pluckProp = curry((prop, obj) => obj[prop])

module.exports = {
	pluckProp,
	putProp
}
