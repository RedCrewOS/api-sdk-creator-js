import { assertThat, is } from "hamjest";

import { add } from "../src";

describe("maths", function() {
	it("should add", function() {
		assertThat(add(2, 2), is(4));
	});
});
