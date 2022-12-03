/**
 * Definition of an OAS Schema Object
 */
export interface SchemaObject {
	title?: string;
	multipleOf?: number;
	maximum?: number;
	exclusiveMaximum?: boolean;
	minimum?: number;
	exclusiveMinimum?: boolean;
	maxLength?: number;
	minLength?: number;

	// TODO: Regexp?
	pattern?: string;

	maxItems?: number;
	minItems?: number;
	uniqueItems?: boolean;
	maxProperties?: number;
	minProperties?: number;
	required?: string[];
	enum?: string[];

	type?: string;
	allOf?: (SchemaObject | SchemaRef)[];
	oneOf?: (SchemaObject | SchemaRef)[];
	anyOf?: (SchemaObject | SchemaRef)[];
	not?: SchemaObject;
	items?: SchemaObject;
	properties?: SchemaObject;
	additionalProperties?: boolean | SchemaObject;
	description?: string;
	format?: string;
	default: any;
}

export interface SchemaRef {
	$ref: string;
}
