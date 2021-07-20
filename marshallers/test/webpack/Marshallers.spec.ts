import { assertThat, defined, is } from "hamjest";

describe("Marshallers global", function () {
	it("should have Marshallers module", function() {
		assertThat(Marshallers, is(defined()));
	});
});
