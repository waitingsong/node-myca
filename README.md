# myca

Create my CA center, generate a self signed x509 certificate, issue server certificate from node.js via openssl. Multiple center supported. RSA, EC(P-256, P-384) supported.


[![GitHub tag](https://img.shields.io/github/tag/waitingsong/node-myca.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![](https://img.shields.io/badge/lang-TypeScript-blue.svg)]()
[![ci](https://github.com/waitingsong/node-myca/workflows/ci/badge.svg)](https://github.com/waitingsong/node-myca/actions?query=workflow%3A%22ci%22)
[![codecov](https://codecov.io/github/waitingsong/node-myca/branch/main/graph/badge.svg?token=wTaSMKz3Ne)](https://codecov.io/github/waitingsong/node-myca)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)



## 安装全局依赖
```sh
npm i -g c8 lerna rollup tsx
```

## Installing
```bash
npm install --save myca
```

## CLI
- [myca-cli](https://www.npmjs.com/package/myca-cli)
- Installing by `npm i -g myca-cli`
- Command help
  - `myca`
  - `myca initca -h`
  - `myca issue -h`
- Example
  ```sh
  myca initca --days=10950 --alg=ec --pass=capass \
    --cn="Root CA" --ou="waitingsong.com" --o="waitingsong" --l="CD" --c=CN \
  ```

  ```sh
  myca issue --kind=server --days=3650 --pass=mypass \
    --cn="waitingsong.com" --o="waitingsong" --c=CN --caKeyPass=capass \
    --centerName=default --alg=ec \
    --ips="127.0.0.1, 192.168.0.1" \
    --SAN="localhost" 
  ```

  ```sh
  myca issue --kind=client --days=3650 --pass=mypass \
    --cn="client" --o="it" --c=CN --caKeyPass=capss \
    --centerName=default --alg=ec 
  ```


## Usage
- Initialize default center
  ```ts
  import { initDefaultCenter } from 'myca'

  await initDefaultCenter()
  ```


## Packages

| Package      | Version                |
| ------------ | ---------------------- |
| [`myca`]     | [![main-svg]][main-ch] |
| [`myca-cli`] | [![cli-svg]][cli-ch]   |



## License
[MIT](LICENSE)


### Languages
- [English](README.md)
- [中文](README.zh-CN.md)

<br>

[`myca`]: https://github.com/waitingsong/node-myca/tree/main/packages/myca
[main-svg]: https://img.shields.io/npm/v/myca.svg?maxAge=7200
[main-ch]: https://github.com/waitingsong/node-myca/tree/main/packages/myca/CHANGELOG.md

[`myca-cli`]: https://github.com/waitingsong/node-myca/tree/main/packages/myca-cli
[cli-svg]: https://img.shields.io/npm/v/myca-cli.svg?maxAge=7200
[cli-ch]: https://github.com/waitingsong/node-myca/tree/main/packages/myca-cli/CHANGELOG.md



