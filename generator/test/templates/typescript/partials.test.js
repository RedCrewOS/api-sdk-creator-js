"use strict";

const { assertThat, is } = require("hamjest");

const { formatTypescript } = require("../../../src/templates/prettier");
const { inBuiltTypes } = require("../../../src/types");
const { newHbs } = require("../../../src/templates/hbs");

/*
 * We use a formatter to make comparisons easier as we then don't have to worry about
 * whitespace.
 */
describe("partials", function() {
	let hbs;

	before(async function() {
		hbs = await newHbs("typescript").toPromise();
	});

	describe("imports", function() {
		let render;

		before(function() {
			render = renderTemplate(hbs.compile(`
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

	describe("objects", function() {
		const TITLE = "Account";

		let render

		before(function() {
			render = renderTemplate(hbs.compile(`
				{{> object}}
			`));
		});

		it("should render object skeleton", function() {
			const result = render(givenObject());

			assertThat(result, isCode(givenInterface()));
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
			})
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

		it("should add description if present", function() {
			const description = "This is a description";

			const result = render(givenObject({
				prop: {
					type: TITLE,
					description,
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
				lines.push(`/** ${attr.description} */`);
			}

			lines.push(`${attr.name}${!attr.required ? "?" : ""}: ${attr.type};`);

			return lines.join("\n");
		}
	});

	describe("enums", function() {
		let render;

		before(function() {
			render = renderTemplate(hbs.compile(`
				{{> enum}}
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

	function renderTemplate(template) {
		return (context) =>
			formatTypescript(template(context))
	}

	function isCode(expected) {
		return is(formatTypescript(expected));
	}
});
