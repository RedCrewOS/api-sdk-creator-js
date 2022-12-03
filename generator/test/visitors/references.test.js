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

describe("References visitor", function() {
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

			describe("objects", function() {
				it("should resolve refs for properties in objects", async function() {
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

				it("should resolve refs for allOf properties in objects", async function() {
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

				it("should reduce allOf for properties in objects", async function() {
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

				it("should mark required properties in objects", async function() {
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

				it("should inline type defs in objects", async function() {
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

				it("reduce allOf type defs in objects", async function() {
					const oas = {
						schemas: {
							"resource-identifier": resourceIdentifier(),
							provider: provider(),
							account: {
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
			});

			describe("arrays", function() {
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
