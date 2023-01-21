"use strict";

const {
	allOf,
	assertThat,
	defined,
	equalTo,
	hasProperties,
	hasProperty,
	is,
	isRejectedWith,
	not,
	promiseThat
} = require("hamjest");

const { resolveRefsInComponentsObject } = require("../../src/visitors/references");
const { missingPropError } = require("../matchers/errors");

describe("references visitor", function() {
	describe("resolveRefsInComponentsObject", function() {
		describe("schemas component", function() {
			const resourceIdentifier = (
				title = "ResourceIdentifier",
				description = "A unique identifier for a resource"
			) => ({
				title,
				type: "string",
				format: "uuid",
				description,
				example: "76cb7b70-4369-11ec-80ae-d778a22d0de3"
			});

			const provider = () => ({
				title: "Provider",
				type: "object",
				properties: {
					name: {
						type: "string",
						description: "The name of the provider",
					}
				},
				required: [
					"name"
				]
			});

			it("should return error if schemas not present", function() {
				return promiseThat(resolveRefsInComponentsObject({}).toPromise(), isRejectedWith(missingPropError("schemas")))
			});

			describe("object type", function() {
				describe("resolving refs for object type composition", function() {
					it("should inline allOf refs", async function() {
						const oas = {
							schemas: {
								provider: provider(),
								account: {
									allOf: [
										{
											$ref: "#/components/schemas/provider"
										}
									]
								}
							}
						};

						const result = await resolveRefsInComponentsObject(oas).toPromise();

						assertThat(result.schemas.account.type, equalTo(oas.schemas.provider.type));
						assertThat(result.schemas.account.properties, hasProperty("name", {
							type: "string",
							description: "The name of the provider",
							required: true
						}));
						assertThat(result.schemas.account.required, equalTo(oas.schemas.provider.required));
						assertThat(result.schemas.account.allOf, is(not(defined())))
					});

					it("reduce allOf", async function() {
						const title = "Account";
						const oas = {
							schemas: {
								"resource-identifier": resourceIdentifier(),
								provider: provider(),
								account: {
									title,
									allOf: [
										{
											$ref: "#/components/schemas/provider"
										},
										{
											type: "object",
											properties: {
												id: {
													$ref: "#/components/schemas/resource-identifier"
												}
											},
											required: [
												"id"
											]
										}
									]
								}
							}
						};

						const result = await resolveRefsInComponentsObject(oas).toPromise();

						assertThat(result.schemas.account.title, is(title));
						assertThat(result.schemas.account.properties, allOf(
							hasProperties({
								name: {
									type: "string",
									description: "The name of the provider",
									required: true
								}
							}),
							hasProperty("id", {
								type: oas.schemas["resource-identifier"].title,
								description: oas.schemas["resource-identifier"].description,
								required: true
							})
						));

						assertThat(result.schemas.account.required, equalTo([ "id", "name" ]));
					});

					it("should inline oneOf refs", async function() {
						const oas = {
							schemas: {
								provider: provider(),
								account: {
									oneOf: [
										{
											$ref: "#/components/schemas/provider"
										}
									]
								}
							}
						};

						const result = await resolveRefsInComponentsObject(oas).toPromise();
						const account = result.schemas.account;

						assertThat(account.type, equalTo(oas.schemas.provider.title));
						assertThat(account.oneOf, is(not(defined())))
					});

					it("reduce oneOf", async function() {
						const title = "Account";
						const oas = {
							schemas: {
								"resource-identifier": resourceIdentifier(),
								provider: provider(),
								account: {
									title,
									oneOf: [
										{
											$ref: "#/components/schemas/provider"
										},
										{
											$ref: "#/components/schemas/resource-identifier"
										}
									]
								}
							}
						};

						const result = await resolveRefsInComponentsObject(oas).toPromise();
						const account = result.schemas.account;
						const typeA = oas.schemas.provider.title;
						const typeB = oas.schemas["resource-identifier"].title;

						assertThat(account.title, is(title));
						assertThat(account.type, is(`${typeA} | ${typeB}`));
					});
				});

				describe("resolving refs for object type properties", function() {
					it("should resolve direct refs", async function() {
						const title = "ResourceIdentifier";
						const description = "A unique identifier for a resource";

						const result = await resolveRefsInComponentsObject({
							schemas: {
								"resource-identifier": resourceIdentifier(title, description),
								account: {
									type: "object",
									properties: {
										id: {
											$ref: "#/components/schemas/resource-identifier"
										}
									}
								}
							}
						})
						.toPromise();

						assertThat(result.schemas.account.properties.id.type, is(title));
						assertThat(result.schemas.account.properties.id.description, is(description));
					});

					it("should ignore missing description when resolving direct refs", async function() {
						const identifier = resourceIdentifier()
						delete identifier.description;

						const result = await resolveRefsInComponentsObject({
							schemas: {
								"resource-identifier": identifier,
								account: {
									type: "object",
									properties: {
										id: {
											$ref: "#/components/schemas/resource-identifier"
										}
									}
								}
							}
						})
						.toPromise();

						assertThat(result.schemas.account.properties.id.description, is(not(defined())));
					});

					it("should resolve refs for arrays", async function() {
						const title = "ResourceIdentifier";
						const description = "A unique identifier for a resource";

						const result = await resolveRefsInComponentsObject({
							schemas: {
								"resource-identifier": resourceIdentifier(title, description),
								account: {
									type: "object",
									properties: {
										ids: {
											type: "array",
											items: {
												$ref: "#/components/schemas/resource-identifier"
											}
										}
									}
								}
							}
						})
						.toPromise();

						assertThat(result.schemas.account.properties.ids.items.type, is(title));
						assertThat(result.schemas.account.properties.ids.items.description, is(description));
					});

					it("should resolve refs for allOf", async function() {
						const title = "ResourceIdentifier";
						const description = "A unique identifier for a resource";

						const result = await resolveRefsInComponentsObject({
							schemas: {
								"resource-identifier": resourceIdentifier(title, description),
								account: {
									type: "object",
									properties: {
										id: {
											allOf: [
												{
													$ref: "#/components/schemas/resource-identifier"
												}
											]
										}
									}
								}
							}
						})
						.toPromise();

						assertThat(result.schemas.account.properties.id.type, is(title));
						assertThat(result.schemas.account.properties.id.description, is(description));
					});

					it("should reduce allOf", async function() {
						const title = "ResourceIdentifier";
						const description = "A unique identifier for the account";

						const result = await resolveRefsInComponentsObject({
							schemas: {
								"resource-identifier": resourceIdentifier(title),
								account: {
									type: "object",
									properties: {
										id: {
											allOf: [
												{
													$ref: "#/components/schemas/resource-identifier"
												},
												{
													description
												}
											]
										}
									}
								}
							}
						})
						.toPromise();

						assertThat(result.schemas.account.properties.id.type, is(title));
						assertThat(result.schemas.account.properties.id.description, is(description));
					});

					it("should resolve refs for oneOf", async function() {
						const resourceId = resourceIdentifier();

						const result = await resolveRefsInComponentsObject({
							schemas: {
								"resource-identifier": resourceId,
								account: {
									type: "object",
									properties: {
										id: {
											oneOf: [
												{
													$ref: "#/components/schemas/resource-identifier"
												}
											]
										}
									}
								}
							}
						})
						.toPromise();

						assertThat(result.schemas.account.properties.id.type, is(resourceId.title));
					});

					it("should reduce oneOf", async function() {
						const title = "AccountIdentifier";
						const resourceId = resourceIdentifier();

						const result = await resolveRefsInComponentsObject({
							schemas: {
								"resource-identifier": resourceId,
								"account-identifier": {
									type: "object",
									title,
									properties: {}
								},
								account: {
									type: "object",
									properties: {
										id: {
											oneOf: [
												{
													$ref: "#/components/schemas/resource-identifier"
												},
												{
													$ref: "#/components/schemas/account-identifier"
												}
											]
										}
									}
								}
							}
						})
						.toPromise();

						assertThat(result.schemas.account.properties.id.type, is(`${title} | ${resourceId.title}`));
					});
				});

				it("should inline required properties in objects", async function() {
					const result = await resolveRefsInComponentsObject({
						schemas: {
							account: {
								type: "object",
								properties: {
									id: {
										type: "string"
									},
									nickname: {
										type: "string"
									}
								},
								required: [
									"id"
								]
							}
						}
					})
					.toPromise();

					assertThat(result.schemas.account.properties.id.required, is(true));
					assertThat(result.schemas.account.properties.nickname.required, is(false));
				});
			});

			describe("array type", function() {
				it("should resolve ref for array items", async function() {
					const oas = {
						schemas: {
							account: {
								title: "Account",
								type: "object",
								description: "An account",
								properties: {}
							},
							"accounts-list": {
								type: "array",
								items: {
									$ref: "#/components/schemas/account"
								}
							}
						}
					};

					const result = await resolveRefsInComponentsObject(oas).toPromise();

					assertThat(result.schemas["accounts-list"].items.type, is("Account"));
				});
			});
		});
	});
});
