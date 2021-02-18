import { assertThat, defined, is } from "hamjest";

describe("AxiosHttpClient Customer global", function () {
	it("should have HttpClient factory ", function() {
		assertThat(AxiosHttpClient.createAxiosHttpClient, is(defined()));
	});
});
