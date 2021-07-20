# marshallers

Package containing HTTP request/response marshallers/unmarshaller for
`@api-sdk-creator/http-api-client`

The mashallers are packaged as a separate module in order to promote reuse. A lot of existing
NPM modules that do this sort of work are coupled to a framework (eg: Express). These functions
can be used standalone, or as part of HTTP request/response processing. 

## Usage

```shell
$ npm install @api-sdk-creator/marshallers
```

The module exports:
 - URLEncoded - A submodule containing functions to URL encode/decode a string.
