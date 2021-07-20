import { assertThat, equalTo, is } from "hamjest";

import { encoder, decoder } from "../src/urlencoded";

describe("urlencoded", function() {
	describe("encoder", function() {
		it("should create string", function() {
			const data = {
				name: "Batman",
				address: "Batcave"
			}

			const result = encoder()(data)

			assertThat(result, is("name=Batman&address=Batcave"));
		});

		it("should urlencode keys", function() {
			const data = {
				"name#": "Batman",
				address: "Batcave"
			}

			const result = encoder()(data)

			assertThat(result, is("name%23=Batman&address=Batcave"));
		});

		it("should urlencode values", function() {
			const data = {
				name: "Bruce",
				address: "Batcave?"
			}

			const result = encoder()(data)

			assertThat(result, is("name=Bruce&address=Batcave%3F"));
		});

		it("should use different separator for pairs", function() {
			const data = {
				name: "Batman",
				address: "Batcave"
			}

			const result = encoder(";")(data)

			assertThat(result, is("name=Batman;address=Batcave"));
		});
	});

	describe("decoder", function() {
		it("should parse string", function() {
			const data = "name=Batman&address=Batcave"

			const result = decoder()(data);

			assertThat(result, equalTo({
				name: "Batman",
				address: "Batcave"
			}))
		});

		it("should urldecode keys", function() {
			const data = "name%23=Batman&address=Batcave"

			const result = decoder()(data);

			assertThat(result, equalTo({
				"name#": "Batman",
				address: "Batcave"
			}))
		});

		it("should urldecode values", function() {
			const data = "name=Bruce&address=Batcave%3F"

			const result = decoder()(data);

			assertThat(result, equalTo({
				name: "Bruce",
				address: "Batcave?"
			}))
		});

		it("should convert + to space", function() {
			const data = "full+name=Bruce+Wayne&address=Gotham+Manor,+Gotham+City"

			const result = decoder()(data);

			assertThat(result, equalTo({
				"full name": "Bruce Wayne",
				address: "Gotham Manor, Gotham City"
			}))
		});

		it("should use different separator for pairs", function() {
			const data = "name=Batman;address=Batcave";

			const result = decoder(";")(data);

			assertThat(result, equalTo({
				name: "Batman",
				address: "Batcave"
			}))
		});
	})
});
