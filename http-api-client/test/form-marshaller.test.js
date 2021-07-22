"use strict";

const { assertThat, equalTo, is } = require("hamjest");

const {
	URL_ENCODED_MIME_TYPE,
	formMarshaller,
	formUnmarshaller
} = require("../src");

describe("Form Marshalling", function() {
	const body = {
		name: "Bruce",
		address: "Batcave"
	};

	describe("marshaller", function() {
		let request;

		beforeEach(function() {
			request = {
				headers: {},
				body
			};
		})

		it("should set given content type", async function() {
			const contentType = "application/x-www-form-urlencoded+vnd";

			const result = await marshall(contentType);

			assertThat(result.headers["content-type"], is(contentType));
		});

		it("should default content type", async function() {
			const result = await marshall();

			assertThat(result.headers["content-type"], is(URL_ENCODED_MIME_TYPE));
		});

		function marshall(contentType) {
			return formMarshaller(contentType)(request).toPromise();
		}
	});

	describe("unmarshaller", function() {
		let result;

		beforeEach(function() {
			result = {
				response: {
					headers: {
						"content-type": `${URL_ENCODED_MIME_TYPE} ; charset=utf8`
					},
					body: "name=Bruce&address=Batcave"
				}
			};
		});

		it("should unmarshall form response body", async function() {
			const result = await unmarshall();

			assertThat(result.response.body, is(equalTo({
				name: "Bruce",
				address: "Batcave"
			})));
		});

		function unmarshall(contentType = URL_ENCODED_MIME_TYPE) {
			return formUnmarshaller(contentType)(result).toPromise();
		}
	});
});
