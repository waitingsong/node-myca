# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.1.5](https://github.com/waitingsong/node-myca/compare/v4.1.4...v4.1.5) (2023-07-24)

**Note:** Version bump only for package myca





## [4.1.4](https://github.com/waitingsong/node-myca/compare/v4.1.3...v4.1.4) (2023-07-24)


### Bug Fixes

* **myca-cli:** value of centerName and centerPath within initCenterCli() ([03bc699](https://github.com/waitingsong/node-myca/commit/03bc699c85ecf2397804426fb9e2833cf070ab85))





## [4.1.3](https://github.com/waitingsong/node-myca/compare/v4.1.2...v4.1.3) (2023-07-21)


### Bug Fixes

* **myca:** kind for client ([8ff64bd](https://github.com/waitingsong/node-myca/commit/8ff64bdef05dc994b92507787aa021f36f45d8b1))





## [4.1.2](https://github.com/waitingsong/node-myca/compare/v4.1.1...v4.1.2) (2023-07-21)


### Bug Fixes

* **myca:** genCert() not use kind during create csr ([1f594b3](https://github.com/waitingsong/node-myca/commit/1f594b3570ea2e3ad1e3b691ba971359cfadab32))
* **myca:** tmp files not removed ([f4a0d14](https://github.com/waitingsong/node-myca/commit/f4a0d14aae62f7485853f66916ecdb7a00909455))
* **myca:** tpl.conf.client ([e835bf2](https://github.com/waitingsong/node-myca/commit/e835bf250f2a00317ecb4cee20ad9ad6b5fbcd5b))





## [4.1.1](https://github.com/waitingsong/node-myca/compare/v4.1.0...v4.1.1) (2023-07-21)

**Note:** Version bump only for package myca





# [4.1.0](https://github.com/waitingsong/node-myca/compare/v4.0.4...v4.1.0) (2023-07-21)


### Bug Fixes

* **myca-cli:** parseCliArgs() argv not merged ([e77b028](https://github.com/waitingsong/node-myca/commit/e77b028a9881b725b19bc9e5d1a84924d47e5ae5))
* **myca:** options.caKeyPass may be number ([4475d57](https://github.com/waitingsong/node-myca/commit/4475d57a8d8561d51a12abdf0103b489d9a1b445))
* **myca:** trim serialContent ([ef73676](https://github.com/waitingsong/node-myca/commit/ef73676b9814991003fb5785e03ceaf69ea7498a))


### Features

* **myca-cli:** pass debug to issueCli() ([1b1fcde](https://github.com/waitingsong/node-myca/commit/1b1fcdebf4fe485e3b75333c99f35b71820d7743))
* **myca:** add debug parameter of functions ([99bc860](https://github.com/waitingsong/node-myca/commit/99bc8603674354a49ea7383476b5e5ece89e6996))
* **myca:** options of runOpenssl() accepts debug property ([77dd565](https://github.com/waitingsong/node-myca/commit/77dd5659f6b75888053ec66e3dd681a4921ac869))
* **myca:** set param conf of genCert() Partial ([eb26f7a](https://github.com/waitingsong/node-myca/commit/eb26f7abc09e5a8c5c31d14b75ae722fd6132b4e))
* **myca:** update tpl.conf.server ([8ca83fb](https://github.com/waitingsong/node-myca/commit/8ca83fb5fe20d3c45c87a2a7339701bce8532efb))





## [4.0.4](https://github.com/waitingsong/node-myca/compare/v4.0.3...v4.0.4) (2023-07-21)

**Note:** Version bump only for package npm-mono-base





## [4.0.3](https://github.com/waitingsong/node-myca/compare/v4.0.2...v4.0.3) (2023-07-20)


### Bug Fixes

* **myca:** runOpenssl() ([126a75e](https://github.com/waitingsong/node-myca/commit/126a75e6c0cd6ca8b99ec835a93e4b8fbb18c0cc))





## [4.0.2](https://github.com/waitingsong/node-myca/compare/v4.0.1...v4.0.2) (2023-07-20)

**Note:** Version bump only for package npm-mono-base





## [4.0.1](https://github.com/waitingsong/node-myca/compare/v4.0.0...v4.0.1) (2023-07-20)

**Note:** Version bump only for package npm-mono-base





# [4.0.0](https://github.com/waitingsong/node-myca/compare/v3.2.0...v4.0.0) (2023-07-20)


### Bug Fixes

* catch test error ([5efe156](https://github.com/waitingsong/node-myca/commit/5efe1565f9ab1766a7db9c4055bba570ea9eb49c))
* createDir() path resolve under linux ([c6d1274](https://github.com/waitingsong/node-myca/commit/c6d1274ef6be06e9862023401ad5bf95fc644c49))
* deps, peerDeps might empty ([e3ab52b](https://github.com/waitingsong/node-myca/commit/e3ab52ba14e483c9a49babaffbdbae6f7d77b41d))
* error TS1345: An expression of type 'void' cannot be tested for truthiness ([0085713](https://github.com/waitingsong/node-myca/commit/00857132333434009e302d78f2455ef09a8deaef))
* options not covered within createFile() ([a2ae4e8](https://github.com/waitingsong/node-myca/commit/a2ae4e826f9ed5c29f241fdff2df85928999b3ae))
* path require parse by normalize() within createDir() ([371a313](https://github.com/waitingsong/node-myca/commit/371a31358bd6375929db935abf74e9637f09adb3))
* revert ts-node to '5.0.1' ([cc83ade](https://github.com/waitingsong/node-myca/commit/cc83ade848f646ddf3913f2bfe430cae7756b26e))
* rimraf() got "no such file or directory" if unlink a file ([2680611](https://github.com/waitingsong/node-myca/commit/26806114d82445c7e511ce5eb6ff59d619d420c4))
* rimraf() rm folder ([87fe6d5](https://github.com/waitingsong/node-myca/commit/87fe6d55a3f592f75196f79a1b6136a4ff218e9e))
* **tslint:** no-unused-variable rule ([d0ce43a](https://github.com/waitingsong/node-myca/commit/d0ce43a5bb8a87caedd4858c40e1549ea58fdc7f))
* wrong variable within createFile() ([49ac701](https://github.com/waitingsong/node-myca/commit/49ac70106943ee7a689350f52063e91b24d0d963))


### Features

* add assertNever() ([6eb9349](https://github.com/waitingsong/node-myca/commit/6eb934998573aaa46653f0ed4fdccd37b17e0325))
* add assertNeverObb() ([91da144](https://github.com/waitingsong/node-myca/commit/91da144c1614a34a3483b7eacfa4787751b79b38))
* add isPathAcessible() ([7eb000b](https://github.com/waitingsong/node-myca/commit/7eb000bc896e0feaa4588ef9fa1ea59173b8242f))
* add lib/shared.ts ([6915fb1](https://github.com/waitingsong/node-myca/commit/6915fb194a124babd924d6b5baea18100db47155))
* add logger() ([5d603c5](https://github.com/waitingsong/node-myca/commit/5d603c5b9d998479c878a56b480fdbc59720125f))
* add Observable functions ([c9364db](https://github.com/waitingsong/node-myca/commit/c9364db556ad9df7f5ce4276e4f6115a73efb183))
* change logger() to accept more args ([b5d0ca4](https://github.com/waitingsong/node-myca/commit/b5d0ca4f1a4aa9057399ba324d27006b28890be4))
* compile output bundle file without minify ([0b78ba1](https://github.com/waitingsong/node-myca/commit/0b78ba142519ff4bca61224fe3705d21807d74ea))
* do isPathAccessible() first within isDirFileExists() ([9ddae98](https://github.com/waitingsong/node-myca/commit/9ddae98cec56ab8b230f0d5c7e0c225dd8669a55))
* export basename() from shared ([7e93fd7](https://github.com/waitingsong/node-myca/commit/7e93fd7d47760f293261deb5c8e39acffc4366c0))
* export dirname() ([0db2a50](https://github.com/waitingsong/node-myca/commit/0db2a5032b57a5e65c4763b91a008402b826d613))
* export native assert() ([683cea8](https://github.com/waitingsong/node-myca/commit/683cea8d3bfc1f24ad50e8f0c812a3b206e326d1))
* export os.tmpdir() ([1cc1f3e](https://github.com/waitingsong/node-myca/commit/1cc1f3e63acf78c55963000da8de411430de88ac))
* export rmdirAsync() and rimraf() ([4ef519a](https://github.com/waitingsong/node-myca/commit/4ef519a9a6863d4dc0f64d7456ac2fcaac40f859))
* export statAsync ([c832590](https://github.com/waitingsong/node-myca/commit/c832590abd803011e2157fa01dba343f327f0fdc))
* output esm.min.js ([f6c729f](https://github.com/waitingsong/node-myca/commit/f6c729f2391f2eb0f673f4b90d4269d97ec7c52a))
* parse peerDependencies as external ([dfdd73e](https://github.com/waitingsong/node-myca/commit/dfdd73e298df1ba19a1ebd677e0fdc8b0e7b5643))
* parseUMDName() ([6e7164f](https://github.com/waitingsong/node-myca/commit/6e7164f5b1463f177d7ed952dc07e5e2b913adba))
* remove log() and logger() ([27e1e29](https://github.com/waitingsong/node-myca/commit/27e1e29489b4f6f12cdae5200325c3065d3155f0))


### Reverts

* wrong tslib remove ([deb2591](https://github.com/waitingsong/node-myca/commit/deb259138c82348276a8b2c4a8396785bee2ea7c))





# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="3.2.0"></a>
# [3.2.0](https://github.com/waitingsong/node-myca/compare/v3.1.1...v3.2.0) (2019-01-23)



<a name="3.1.1"></a>
## [3.1.1](https://github.com/waitingsong/node-myca/compare/v3.1.0...v3.1.1) (2019-01-22)



<a name="3.1.0"></a>
# [3.1.0](https://github.com/waitingsong/node-myca/compare/v3.0.1...v3.1.0) (2019-01-22)


### Features

* initCenter(centerName, path?) path is optional ([862ad34](https://github.com/waitingsong/node-myca/commit/862ad34))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/waitingsong/node-myca/compare/v3.0.0...v3.0.1) (2019-01-21)


### Bug Fixes

* createDir() path resolve under linux ([c6d1274](https://github.com/waitingsong/node-myca/commit/c6d1274))


### Features

* add Observable functions ([c9364db](https://github.com/waitingsong/node-myca/commit/c9364db))
* do isPathAccessible() first within isDirFileExists() ([9ddae98](https://github.com/waitingsong/node-myca/commit/9ddae98))
* export statAsync ([c832590](https://github.com/waitingsong/node-myca/commit/c832590))
