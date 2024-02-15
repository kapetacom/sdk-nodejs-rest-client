# [3.3.0](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v3.2.1...v3.3.0) (2024-02-15)


### Features

* Add $withBaseUrl method ([86714ae](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/86714ae1eae2c0c1b0de858a7a98d7347e8c0d61))

## [3.2.1](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v3.2.0...v3.2.1) (2024-02-02)


### Bug Fixes

* bump sdk-rest ([7b7121a](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/7b7121a9c0ac9b39c21d3ceb38f05c8b4d1d0b58))

# [3.2.0](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v3.1.2...v3.2.0) (2024-01-22)


### Features

* Use shared lib for rest clients ([#13](https://github.com/kapetacom/sdk-nodejs-rest-client/issues/13)) ([2dbdb1e](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/2dbdb1e840e24dc749c45088b7aeeee39e09a1da))

## [3.1.2](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v3.1.1...v3.1.2) (2024-01-16)


### Bug Fixes

* Format codebase ([bc89a2d](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/bc89a2d3726c12e990f7ea04876f741be1f7f0cf))
* Handle Set and Map in query transport ([3c1f769](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/3c1f76998fdf9e19cc0413d2494a870c5a156451))

## [3.1.1](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v3.1.0...v3.1.1) (2024-01-07)


### Bug Fixes

* Do not attempt to consume response body twice ([6b86bd0](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/6b86bd03f5ad3c0a084975f83f8fa7c2966ca5ca))

# [3.1.0](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v3.0.1...v3.1.0) (2024-01-07)


### Features

* Use fetch, add documentation and made autoInit optional ([#11](https://github.com/kapetacom/sdk-nodejs-rest-client/issues/11)) ([1d6ffb9](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/1d6ffb92bc1cecf414737fdf2d37cca996612727))

## [3.0.1](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v3.0.0...v3.0.1) (2024-01-05)


### Bug Fixes

* Do not send values that are null or undefined ([#10](https://github.com/kapetacom/sdk-nodejs-rest-client/issues/10)) ([742bac0](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/742bac0cdedc869b414e3edf57aa65b0487db63a))

# [3.0.0](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v2.0.1...v3.0.0) (2024-01-02)


### Features

* Prefix all internal methods with $ to avoid name clashes ([#9](https://github.com/kapetacom/sdk-nodejs-rest-client/issues/9)) ([0f9d6d6](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/0f9d6d6e215cada5943b8a78b48594a287554857))


### BREAKING CHANGES

* We generate methods names which can be named anything

## [2.0.1](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v2.0.0...v2.0.1) (2023-12-13)


### Bug Fixes

* Bumped deps to ^2 also ([7b978a5](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/7b978a5dcaa349996b67d98836ba67c5c8dade4f))

# [2.0.0](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v1.1.2...v2.0.0) (2023-12-12)


### Features

* Refactored to seperate request from client ([#8](https://github.com/kapetacom/sdk-nodejs-rest-client/issues/8)) ([029f573](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/029f573a7e8d76350987deb77468c711d50ef744))


### BREAKING CHANGES

* Refactoring to make it possible to interact with request

## [1.1.2](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v1.1.1...v1.1.2) (2023-10-18)


### Bug Fixes

* Change dates to numbers when serializing ([#6](https://github.com/kapetacom/sdk-nodejs-rest-client/issues/6)) ([c321c7f](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/c321c7f179ed6800fb726d60f1218ea566d261cb))

## [1.1.1](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v1.1.0...v1.1.1) (2023-09-14)


### Bug Fixes

* Change execute into a generic function ([8f05dec](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/8f05decc0ec1f22d36912b4c018a2cf973bed076))

# [1.1.0](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v1.0.4...v1.1.0) (2023-06-18)


### Features

* Token change to trigger version ([213fe77](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/213fe7782d00610c171daca98d210fb7f71b171b))

## [1.0.4](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v1.0.3...v1.0.4) (2023-06-17)


### Bug Fixes

* Handle complex body arguments ([#3](https://github.com/kapetacom/sdk-nodejs-rest-client/issues/3)) ([b48c21a](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/b48c21a9a3dd453e0ea18983d67c5ee66e6b8eb8))

## [1.0.3](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v1.0.2...v1.0.3) (2023-06-16)


### Bug Fixes

* Added types and JSON parsing to client ([081a4d9](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/081a4d9e5b9b2f0d9b14b9459e9c03d5a17e5544))

## [1.0.2](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v1.0.1...v1.0.2) (2023-06-11)


### Bug Fixes

* Default to commonjs ([f3276ca](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/f3276ca421d54ca724bf2b1f36fb3212c9f7d0b9))

## [1.0.1](https://github.com/kapetacom/sdk-nodejs-rest-client/compare/v1.0.0...v1.0.1) (2023-06-09)


### Bug Fixes

* Support mixed modules ([f0d0b1b](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/f0d0b1b62eadae53d560f14129a369c98d68a724))

# 1.0.0 (2023-06-09)


### Features

* Rewrote to TS ([6ec86bf](https://github.com/kapetacom/sdk-nodejs-rest-client/commit/6ec86bfb6cfedc008e59922dafbb6401023d196f))
