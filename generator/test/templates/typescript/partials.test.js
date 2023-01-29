"use strict";

const { identity } = require("crocks");
const { assertThat, is } = require("hamjest");

const { formatTypescript } = require("../../../src/templates/prettier");
const { inBuiltTypes } = require("../../../src/types");
const { newHbs } = require("../../../src/templates/hbs");
const { compile: compileTemplate } = require("../../../src/templates/wrappers");

// compile (Handlebars, String) -> (a -> Result Error String)
const compile = (hbs, template) =>
	compileTemplate(template, hbs)

/*
 * We use a formatter to make comparisons easier as we then don't have to worry about
 * whitespace.
 */
describe("partials", function() {
	let hbs;
	let render;

	before(async function() {
		hbs = await newHbs("typescript").toPromise();
	});

	describe("imports", function() {
		before(function() {
			render = renderTemplate(compile(hbs, `
				{{> imports}}
			`));
		});

		it("should render typescript imports", async function() {
			const result = render({
				imports: [
					{
						type: "Account",
						location: "account"
					}
				]
			});

			assertThat(result, isCode(`
				import { Account } from "./account";
			`));
		});
	});

	describe("comments", function() {
		describe("comment", function() {
			before(function() {
				render = renderTemplate(compile(hbs, `
					{{> comment }}
				`));
			});

			it("should render single line comment", function() {
				const description = "This is a description";

				const result = render({
					description: [ description ]
				});

				assertThat(result, isCode(comment(description)));
			});

			it("should render multiline comment", function() {
				const line1 = "This is a description";
				const line2 = "This is more detail";

				const result = render({
					description: [ line1, line2 ]
				});

				assertThat(result, isCode(blockComment(line1, line2)));
			});
		});

		describe("blockComment", function() {
			before(function() {
				render = renderTemplate(compile(hbs, `
					{{> blockComment }}
				`));
			});

			it("should render block comment", function() {
				const description = "This is a description";

				const result = render({
					description: [ description ]
				});

				assertThat(result, isCode(blockComment(description)));
			})
		});
	});

	describe("scalars", function() {
		const title = "Prop";

		before(function() {
			render = renderTemplate(compile(hbs, `
				{{> scalar}}
			`));
		});

		it("should render scalar typedef", function() {
			inBuiltTypes.forEach((type) => {
				const result = render({
					title,
					type,
				});

				assertThat(result, isCode(`
					export type ${title} = ${type};
				`));
			});
		});

		it("should render description if present", function() {
			const description = "This is a description";
			const type = "string";

			const result = render({
				title,
				type,
				description: [ description ]
			});

			assertThat(result, isCode(`
				${blockComment(description)}
				export type ${title} = ${type};
			`));
		});
	});

	describe("objects", function() {
		const TITLE = "Account";

		let render

		before(function() {
			render = renderTemplate(compile(hbs, `
				{{> object}}
			`));
		});

		it("should render object skeleton", function() {
			const result = render(givenObject());

			assertThat(result, isCode(givenInterface()));
		});

		it("should render description if present", function() {
			const description = "This is a description";
			const obj = givenObject();
			obj.description = [ description ];

			const result = render(obj);

			assertThat(result, isCode(`
				${blockComment(description)}
				${givenInterface()}
			`));
		});

		it("should render properties with scalar types", function() {
			inBuiltTypes.forEach((type) => {
				const result = render(givenObject({
					prop: {
						type,
						required: true
					}
				}));

				assertThat(result, isCode(givenInterface([
					{
						name: "prop",
						type,
						required: true
					}
				])));
			});
		});

		it("should render properties with object ref type", function() {
			const result = render(givenObject({
				prop: {
					type: TITLE,
					required: true
				}
			}));

			assertThat(result, isCode(givenInterface([
				{
					name: "prop",
					type: TITLE,
					required: true
				}
			])));
		});

		it("should render properties that aren't required", function() {
			const result = render(givenObject({
				prop: {
					type: TITLE,
					required: false
				}
			}));

			assertThat(result, isCode(givenInterface([
				{
					name: "prop",
					type: TITLE,
					required: false
				}
			])));
		});

		it("should render properties with array ref type", function() {
			const result = render(givenObject({
				prop: {
					type: "array",
					items: {
						type: TITLE
					},
					required: true
				}
			}));

			assertThat(result, isCode(givenInterface([
				{
					name: "prop",
					type: `${TITLE}[]`,
					required: true
				}
			])));
		});

		it("should add properties description if present", function() {
			const description = "This is a description";

			const result = render(givenObject({
				prop: {
					type: TITLE,
					description: [ description ],
					required: true
				}
			}));

			assertThat(result, isCode(givenInterface([
				{
					name: "prop",
					type: TITLE,
					description,
					required: true
				}
			])));
		});

		function givenObject(
			properties = {},
			title = TITLE
		) {
			return {
				title,
				type: "object",
				properties
			}
		}

		function givenInterface(
			attrs = [],
			title = TITLE
		) {
			return `export interface ${title} {
				${printAttributes(attrs)}
			}`
		}

		function printAttributes(attrs) {
			return attrs
				.map(printAttribute)
				.join("\n")
		}

		function printAttribute(attr) {
			const lines = [];

			if (attr.description) {
				lines.push(comment(attr.description));
			}

			lines.push(`${attr.name}${!attr.required ? "?" : ""}: ${attr.type};`);

			return lines.join("\n");
		}
	});

	describe("enums", function() {
		before(function() {
			render = renderTemplate(compile(hbs, `
				{{> enum}}
			`));
		});

		it("should render description if present", function() {
			const title = "EnumExample";
			const description = "This is a description";
			const enumType = {
				title,
				description: [ description ],
				type: "string",
				enum: []
			};

			const result = render(enumType);

			assertThat(result, isCode(`
				${blockComment(description)}
				export enum ${title} {}
			`));
		});

		it("should render string enum", function() {
			const title = "EnumExample";
			const strings = [ "a", "b", "c" ];
			const enumType = {
				title,
				type: "string",
				enum: strings
			}

			const result = render(enumType);

			assertThat(result, isCode(`
				export enum ${title} {
					${strings.map((str) => `${str} = "${str}",`).join("\n")}
				}
			`));
		});
	});

	// renderTemplate :: (a -> Result Error String) -> a -> String | throws
	function renderTemplate(template) {
		return (context) => template(context)
			.either(
				(e) => { throw e },
				formatter
			)
	}

	// isCode :: String -> String | throws
	function isCode(expected) {
		return is(formatter(expected));
	}

	// formatter :: String -> String | throws
	function formatter(code) {
		return formatTypescript(code)
			.either(
				(e) => { throw e },
				identity
			)
	}

	function blockComment(...lines) {
		const comment = lines
			.map((line) => `* ${line}`)
			.join("\n");

		return `
			/** 
			 ${comment}
			 */`
	}

	function comment(comment) {
		return `/** ${comment} */`;
	}
});
