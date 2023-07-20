# myca
使用 openssl 和 node.js 创建自有 CA 中心（自签发CA证书或者上级CA签发的中级CA证书），签发自签名数字证书。支持创建多个 CA 中心。支持 RSA，EC（P-256, P-384）算法。

[![GitHub tag](https://img.shields.io/github/tag/waitingsong/node-myca.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![](https://img.shields.io/badge/lang-TypeScript-blue.svg)]()
[![ci](https://github.com/waitingsong/node-myca/workflows/ci/badge.svg)](https://github.com/waitingsong/node-myca/actions?query=workflow%3A%22ci%22)
[![codecov](https://codecov.io/github/waitingsong/node-myca/branch/main/graph/badge.svg?token=wTaSMKz3Ne)](https://codecov.io/github/waitingsong/node-myca)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)


## 安装
```bash
npm install --save myca
```

## CLI 命令行
- [myca-cli](https://www.npmjs.com/package/myca-cli)
- 安装 `npm i -g myca-cli`
- 命令行帮助
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

## 使用
- 初始化默认中心
  ```ts
  import { initDefaultCenter } from 'myca'

  await initDefaultCenter()
  ```

- 初始化默认中心的 CA 自签发证书
  ```ts
  import { initCaCert } from 'myca'

  const opts = {
    days: 10950,  // 30years
    pass: 'mycapass',
    CN: 'My Root CA',    // Common Name
    O: 'My Company',   // Organization Name (eg, company)
    C: 'CN',   // Country Name (2 letter code)
  }
  await initCaCert(opts)
  ```

- 签发一张 RSA 服务器证书
  ```ts
  import { genCert } from 'myca'

  const opts = {
    caKeyPass: 'mycapass',
    kind: 'server',   // server cert
    days: 730,
    pass: 'fooo',   // at least 4 letters
    CN: 'www.waitingsong.com',    // Common Name
    OU: '',   // Organizational Unit Name
    O: '',   // Organization Name
    L: '',    // Locality Name (eg, city)
    ST: '',   // State or Province Name
    C: 'CN',   // Country Name (2 letter code)
    emailAddress: '',
  }
  await genCert(opts)
  console.log(ret.cert)
  console.log(ret.crtFile)
  console.log(ret.privateUnsecureKey)
  ```

- 创建额外的中心，并且自签发 EC 算法的 CA 证书 (默认 P-256)
  ```ts
  import { initCenter, initCaCert } from 'myca'

  // 中心名centerName: ec, 路径: /opt/center-ec/ （可省略）
  await initCenter('ec', '/opt/center-ec')
  await myca.initCaCert({
    centerName: 'ec',
    alg: 'ec',
    days: 10950,
    pass: 'mycapass',
    CN: 'My Root CA',
    O: 'My Company',
    C: 'CN',
  })
  ```

- 使用指定的中心签发一张 RSA 服务器证书
  ```ts
  import { genCert } from 'myca'

  const opts = {
    centerName: 'ec',  // <--- 指定中心名: ec
    caKeyPass: 'mycapass',
    kind: 'server',
    days: 730,
    pass: 'fooo',
    CN: 'www.waitingsong.com',
    C: 'CN',
  }
  const ret = await genCert(opts)
  console.log(ret.cert)
  console.log(ret.crtFile)
  console.log(ret.privateUnsecureKey)
  ```

- 签发 SAN 多域名服务器证书
  ```ts
  import { genCert } from 'myca'

  const opts = {
    caKeyPass: 'mycapass',
    kind: 'server',
    days: 730,
    pass: 'fooo',
    CN: 'www.waitingsong.com',
    C: 'CN',
    SAN: ['foo.waitingsong.com', 'bar.waitingsong.com'],
  }
  await genCert(opts)
  ```

- 签发 SAN 多ip服务器证书
  ```ts
  import { genCert } from 'myca'

  const opts = {
    caKeyPass: 'mycapass',
    kind: 'server',
    days: 730,
    pass: 'fooo',
    CN: 'www.waitingsong.com',
    C: 'CN',
    // https://www.tbs-certificates.co.uk/FAQ/en/normes_tld.html
    // 10.0.0.0 – 10.255.255.255
    // 172.16.0.0 – 172.31.255.255
    // 192.168.0.0 – 192.168.255.255
    ips: ['127.0.0.1', '192.168.0.1'], // not support ip mask
  }
  const ret = await genCert(opts)
  console.log(ret.cert)
  ```


- 签发一张 RSA p12/pfx 客户端证书
  ```ts
  import { genCert } from 'myca'

  const opts = {
    caKeyPass: 'mycapass',
    kind: 'client',   // pfx cert
    days: 730,
    pass: 'fooo',   // at least 4 letters
    CN: 'www.waitingsong.com',    // Common Name
    C: 'CN',   // Country Name (2 letter code)
  }
  const ret = await genCert(opts)
  console.log(ret.pfxFile)
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


[`myca`]: https://github.com/waitingsong/node-myca/tree/main/packages/myca
[main-svg]: https://img.shields.io/npm/v/myca.svg?maxAge=7200
[main-ch]: https://github.com/waitingsong/node-myca/tree/main/packages/myca/CHANGELOG.md

[`myca-cli`]: https://github.com/waitingsong/node-myca/tree/main/packages/myca-cli
[cli-svg]: https://img.shields.io/npm/v/myca-cli.svg?maxAge=7200
[cli-ch]: https://github.com/waitingsong/node-myca/tree/main/packages/myca-cli/CHANGELOG.md
