"use strict";

const { assertThat, is } = require("hamjest");

const { standardiseComponentsObject } = require("../../src/visitors/standardise");

describe("standardise visitor", function() {
	describe("standardiseComponentsObject", function() {
		describe("standardiseDocumentation", function() {
			describe("schemas component", function() {
				describe("object type", function() {
					it("should parse documentation for object types", async function() {
						const description = "An account in the system";
						const oas = {
							schemas: {
								account: {
									type: "object",
									description: `${description}\n`,
									properties: {}
								}
							}
						}

						const result = await standardiseComponentsObject(oas).toPromise();

						verifyDescription(description, result.schemas.account.description);
					});

					it("should parse documentation for object types composition", async function() {
						const description = "An account object";
						const namesDescription = "A name for the account";
						const oas = {
							schemas: {
								account: {
									allOf: [
										{
											type: "object",
											description: `${description}\n`,
											properties: {
												name: {
													type: "string",
													description: namesDescription
												}
											}
										}
									]
								}
							}
						}

						const result = await standardiseComponentsObject(oas).toPromise();
						const objectDef = result.schemas.account.allOf[0];

						verifyDescription(description, objectDef.description);
						verifyDescription(namesDescription, objectDef.properties.name.description);
					});

					it("should parse documentation for properties", async function() {
						const idDescription = "A unique id for an account";
						const namesDescription = "A list of names for the account";
						const oas = {
							schemas: {
								account: {
									type: "object",
									properties: {
										id: {
											type: "string",
											description: `${idDescription}\n`
										},
										names: {
											type: "array",
											items: {
												type: "object",
												description: namesDescription
											}
										}
									}
								}
							}
						}

						const result = await standardiseComponentsObject(oas).toPromise();

						verifyDescription(idDescription, result.schemas.account.properties.id.description);
						verifyDescription(namesDescription, result.schemas.account.properties.names.items.description);
					});

					it("should parse documentation for allOf in properties", async function() {
						const description = "A unique id for an account";
						const oas = {
							schemas: {
								account: {
									type: "object",
									properties: {
										id: {
											allOf: [
												{
													description: `${description}\n`
												}
											]
										}
									}
								}
							}
						}

						const result = await standardiseComponentsObject(oas).toPromise();

						verifyDescription(
							description,
							result.schemas.account.properties.id.allOf[0].description
						);
					});
				});

				describe("array type", function() {
					it("should parse documentation for array types", async function() {
						const description = "An account in the system";
						const oas = {
							schemas: {
								accounts: {
									type: "array",
									description: `${description}\n`,
									items: {}
								}
							}
						}

						const result = await standardiseComponentsObject(oas).toPromise();

						verifyDescription(description, result.schemas.accounts.description);
					});

					it("should parse document for array type items", async function() {
						const description = "An account in the system";
						const oas = {
							schemas: {
								accounts: {
									type: "array",
									items: {
										type: "object",
										description: `${description}\n`,
										properties: {}
									}
								}
							}
						}

						const result = await standardiseComponentsObject(oas).toPromise();

						verifyDescription(description, result.schemas.accounts.items.description);
					});
				});
			});

			function verifyDescription(expected, actual) {
				assertThat("Didn't parse to array", Array.isArray(actual), is(true));
				assertThat("Too many lines", actual.length, is(1));
				assertThat(actual[0], is(expected));
			}
		});
	});
});
