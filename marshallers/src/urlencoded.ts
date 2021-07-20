const Assign = require("crocks/Assign");

const bimap = require("crocks/pointfree/bimap");
const compose = require("crocks/helpers/compose");
const listToArray = require("crocks/List/listToArray");
const map = require("crocks/pointfree/map");
const merge = require("crocks/pointfree/merge");
const mreduce = require("crocks/helpers/mreduce");
const nmap = require("crocks/Tuple/nmap");
const objOf = require("crocks/helpers/objOf");
const pipe = require("crocks/helpers/pipe");
const toPairs = require("crocks/Pair/toPairs");

const { join, joinPair, replace, split } = require("@epistemology-factory/crocks-ext/String");
const { arrayToTuple } = require("@epistemology-factory/crocks-ext/Tuple");

// decode :: String -> String
const decode = compose(decodeURIComponent, replace(/\+/g, "%20"))

// encoder :: String? -> Object -> String
export const encoder: (sep?: string) => (data: Record<any, any>) => string =
	(sep = "&") =>
		pipe(
			toPairs,
			map(pipe(
				bimap(encodeURIComponent, encodeURIComponent),
				merge(joinPair("="))
			)),
			compose(join(sep), listToArray),
		)

// decoder :: String? -> String -> Object
export const decoder: (sep?: string) => (data: string) => Record<any, any> =
	(sep = "&") =>
		pipe(
			split(sep),
			map(compose(arrayToTuple, split("="))),
			map(pipe(
				nmap(2, decode, decode),
				merge(objOf)
			)),
			mreduce(Assign)
		)
