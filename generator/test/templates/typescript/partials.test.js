"use strict";

const { assertThat, is } = require("hamjest");

const { formatTypescript } = require("../../../src/templates/prettier");
const { newHbs } = require("../../../src/templates/hbs");

/*
 * We use a formatter to make comparisons easier as we then don't have to worry about
 * whitespace.
 */
describe("partials", function() {
	let hbs;

	beforeEach(async function() {
		hbs = await newHbs("typescript").toPromise();
	});

	describe("imports", function() {
		it("should render typescript imports", async function() {
			const template = hbs.compile(`
				{{> imports}}
			`);

			const result = formatTypescript(template(
				{
					imports: [
						{
							type: "Account",
							location: "account"
						}
					]
				}));

			assertThat(result, is(formatTypescript('import { Account } from "./account";')));
		});
	});
});
