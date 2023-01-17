"use strict";

const {
	allOf,
	assertThat,
	defined,
	hasItem,
	hasProperty,
	hasSize,
	isEmpty,
	isRejectedWith,
	promiseThat
} = require("hamjest");

const { resolveImportsInComponentsObject } = require("../../src/visitors/imports");
const { missingPropError } = require("../matchers/errors");

describe("imports visitor", function() {
	describe("resolveImportsForTypes", function() {
		describe("schemas component", function() {
			it("should return error if schemas not present", function() {
				return promiseThat(
					resolveImportsInComponentsObject({}).toPromise(),
					isRejectedWith(missingPropError("schemas"))
				)
			});

			describe("scalars", function() {
				const dataTypes = [
					"integer",
					"number",
					"string",
					"boolean"
				];

				dataTypes.forEach((dataType) => {
					it(`should create empty import for ${dataType}`, async function() {
						const oas = {
							schemas: {
								prop: {
									title: "Foo",
									type: dataType
								}
							}
						};

						const result = await resolveImportsInComponentsObject(oas).toPromise();

						assertThat(result.schemas.prop, hasEmptyImports());
					});
				});
			});

			describe("objects", function() {
				const type = "ResourceIdentifier";
				const name = "resource-identifier";
				const oas = {
					schemas: {
						[name]: {
							title: type,
							type: "string",
							format: "uuid",
							description: "A unique identifier for a resource",
							example: "76cb7b70-4369-11ec-80ae-d778a22d0de3"
						}
					}
				};

				it("should resolve imports for properties in object", async function() {
					oas.schemas["account"] = {
						title: "Account",
							type: "object",
							properties: {
							id: {
								type: type
							}
						}
					};

					const result = await resolveImportsInComponentsObject(oas).toPromise();

					assertThat(result.schemas.account, hasImports(hasItem({
						type,
						location: name
					})));
				});

				it("should resolve imports for array properties in object", async function() {
					oas.schemas["account"] = {
						title: "Account",
						type: "object",
						properties: {
							ids: {
								type: "array",
								items: {
									type
								}
							}
						}
					};

					const result = await resolveImportsInComponentsObject(oas).toPromise();

					assertThat(result.schemas.account, hasImports(hasItem({
						type,
						location: name
					})));
				});

				it("should ignore builtin types for properties in object", async function() {
					const oas = {
						schemas: {
							account: {
								title: "Account",
								type: "object",
								properties: {
									id: {
										type: "integer"
									},
									name: {
										type: "string"
									},
									balance: {
										type: "number"
									},
									active: {
										type: "boolean"
									}
								}
							}
						}
					};

					const result = await resolveImportsInComponentsObject(oas).toPromise();

					assertThat(result.schemas.account, hasEmptyImports());
				});

				it("should only import type once", async function() {
					oas.schemas["account"] = {
						title: "Account",
						type: "object",
						properties: {
							id: {
								type: type
							},
							ref: {
								type: type
							}
						}
					};

					const result = await resolveImportsInComponentsObject(oas).toPromise();

					assertThat(result.schemas.account, hasImports(hasSize(1)));
				});
			});

			describe("arrays", function() {
				const type = "Account";
				const name = "account";

				const oas = {
					schemas: {
						[name]: {
							title: type,
							type: "object",
							properties: {
								id: {
									type: "string"
								}
							}
						}
					}
				};

				it("should resolve imports for items in arrays", async function() {
					oas.schemas["accounts"] = {
						title: "AccountsList",
						type: "array",
						items: {
							type
						}
					};

					const result = await resolveImportsInComponentsObject(oas).toPromise();

					assertThat(result.schemas.accounts, hasImports(hasItem({
						type,
						location: name
					})));
				});

				it("should ignore builtin types for properties in object", async function() {
					oas.schemas["names"] = {
						title: "NamesList",
						type: "array",
						items: {
							type: "string"
						}
					};

					const result = await resolveImportsInComponentsObject(oas).toPromise();

					assertThat(result.schemas.names, hasEmptyImports());
				});
			});
		});
	});
});

function hasEmptyImports() {
	return hasImports(isEmpty());
}
function hasImports(matcher) {
	return hasProperty("imports", allOf(
		defined(),
		matcher
	));
}
