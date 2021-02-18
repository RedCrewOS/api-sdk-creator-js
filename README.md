# sdk-creator

# About me

Contains libraries to aid SDK developers in the creation of API client SDKs.

See the individual library READMEs for more details. The best starting place is with the
[http-api-client README](http-api-client/README.md)

| :memo: | This library is still in active development and may break compatibility in future releases |
|--------|:------------------------------------------------------------------------------------------|

# Development

The repository is managed by [Rush](https://rushjs.io). As such, the Rush [Command Set](https://rushjs.io/pages/commands/rush_add/) needs to be used to add/remove/update packages and to build/publish the modules/libraries that make up the `@api-sdk-creator` set.

Note: Using `rushx` is the equivalent to using `npm run`

## Building

```shell script
$ rush install
$ rush build
```

## Testing

```shell script
$ cd <project> && rushx test
```
