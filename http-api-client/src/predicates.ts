const compose = require("crocks/helpers/compose");

import { HttpResponse } from "./response";
import { HttpResult } from "./client";
import { getHttpResponse } from "./accessors";

export const isSuccessfulResponse: (response: HttpResponse) => boolean =
	(response: HttpResponse) => response.statusCode >= 200 && response.statusCode < 300;

export const isSuccessfulResult: (result: HttpResult) => boolean =
	compose(isSuccessfulResponse, getHttpResponse);
