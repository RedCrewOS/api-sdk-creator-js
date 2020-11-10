import { assertThat, containsString, instanceOf, is, throws } from "hamjest";

import { BaseHttpClient } from "../src/base-http-client";

describe("Base Http Client", function() {
	let client: BaseHttpClient;

	beforeEach(function() {
		client = new BaseHttpClient();
	})

	describe("path params", function() {
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

	describe("query params", function() {
		it("should create query string", function() {
			const queryParams = {
				a: "1",
				x: "foo"
			};

			const qs = client.createQueryString(queryParams);

			// we can't guarantee the order of the parts of the query string.
			assertThat(qs, containsString("&"));
			assertThat(qs, containsString("a=1"));
			assertThat(qs, containsString("x=foo"));
		});

		it("should urlencode query parameters", async function() {
			const queryParams = {
				callback: "http://localhost:5000"
			};

			const qs = client.createQueryString(queryParams);

			assertThat(qs, is("?callback=http%3A%2F%2Flocalhost%3A5000"));
		});

		it("should return empty string when no params", function() {
			const qs = client.createQueryString({});

			assertThat(qs, is(""));
		});
	});
});
