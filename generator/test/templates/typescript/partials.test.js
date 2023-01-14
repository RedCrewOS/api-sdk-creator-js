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
						type
					}
				}));

				assertThat(result, isCode(givenInterface([
					{
						name: "prop",
						type
					}
				])));
			})
		});

		it("should render properties with object ref type", function() {
			const result = render(givenObject({
				prop: {
					type: TITLE
				}
			}));

			assertThat(result, isCode(givenInterface([
				{
					name: "prop",
					type: TITLE
				}
			])));
		});

		it("should render properties with array ref type", function() {
			const result = render(givenObject({
				prop: {
					type: "array",
					items: {
						type: TITLE
					}
				}
			}));

			assertThat(result, isCode(givenInterface([
				{
					name: "prop",
					type: `${TITLE}[]`
				}
			])));
		});

		it("should add description if present", function() {
			const description = "This is a description";

			const result = render(givenObject({
				prop: {
					type: TITLE,
					description
				}
			}));

			assertThat(result, isCode(givenInterface([
				{
					name: "prop",
					type: TITLE,
					description
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

			lines.push(`${attr.name}: ${attr.type};`);

			return lines.join("\n");
		}
	});

	function renderTemplate(template) {
		return (context) =>
			formatTypescript(template(context))
	}

	function isCode(expected) {
		return is(formatTypescript(expected));
	}
});
