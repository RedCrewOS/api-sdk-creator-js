import { assertThat, instanceOf, is, throws } from "hamjest";

import { BaseHttpClient } from "../src/base-http-client";

describe("Base Http Client", function() {
	let client: BaseHttpClient;

	beforeEach(function() {
		client = new BaseHttpClient();
	})

	describe("slugs", function() {
		it("should throw error if value for param not found", function() {
			assertThat(
				() => client.replacePathParams("customer/:id/account/:accountNumber", {}),
				throws(instanceOf(Error))
			);
		});

		it("should replace slugs in path", function() {
			const path = client.replacePathParams("customer/:id/account/:accountNumber", {
				id: "123",
				accountNumber: 456
			});

			assertThat(path, is("customer/123/account/456"));
		});
	});
});
