import { assertThat, defined, is } from "hamjest";

describe("Marshallers global", function () {
	it("should have Marshallers module", function() {
		assertThat(Marshallers, is(defined()));
	});

	it("should have urlencoded submodule", function() {
		assertThat(Marshallers.urlencoded, is(defined()));
	});
});
