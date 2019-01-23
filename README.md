# myca
Create my CA center, generate a self signed x509 certificate, issue server certificate from node.js via openssl. Multiple center supported. RSA, EC(P-256, P-384) supported.

[![Version](https://img.shields.io/npm/v/myca.svg)](https://www.npmjs.com/package/myca)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/waitingsong/node-myca.svg?branch=master)](https://travis-ci.org/waitingsong/node-myca)
[![Build status](https://ci.appveyor.com/api/projects/status/fo667k0k2ki8mv68/branch/master?svg=true)](https://ci.appveyor.com/project/waitingsong/node-myca/branch/master)
[![Coverage Status](https://coveralls.io/repos/github/waitingsong/node-myca/badge.svg?branch=master)](https://coveralls.io/github/waitingsong/node-myca?branch=master)


## CLI
- [myca-cli](https://www.npmjs.com/package/myca-cli)
- Installing by `npm i -g myca-cli`
- Command help
  - `myca`
  - `myca initca -h`
  - `myca issue -h`


## Installing
```bash
npm install --save myca
```

## Usage
- Initialize default center
```js
// import * as myca from 'myca'  // TypeScript
const myca = require('myca')

myca.initDefaultCenter().catch(console.error)
```

- Initialize CA cert of default center
```js
 // import * as myca from 'myca'
 const myca = require('myca')

 myca
   .initCaCert({
     days: 10950,  // 30years
     pass: 'mycapass',
     CN: 'My Root CA',    // Common Name
     O: 'My Company',   // Organization Name (eg, company)
     C: 'CN',   // Country Name (2 letter code)
   })
   .catch(console.error)
```

- Issue a RSA serve certificate
```js
 // import * as myca from 'myca'
 const myca = require('myca')

 myca
   .genCert({
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
   })
   .then((ret) => {
     console.log(ret.cert)
     console.log(ret.crtFile)
     console.log(ret.privateUnsecureKey)
   })
   .catch(console.error)
```

- Initialize more center and create self-signed EC CA certificate (default P-256)
```js
 // import * as myca from 'myca'
 const myca = require('myca')

 // centerName: ec, folder: /opt/center-ec/ (can be ommited)
 myca.initCenter('ec', '/opt/center-ec')
   .then(() => {
     return myca.initCaCert({
       centerName: 'ec',
       alg: 'ec',
       days: 10950,
       pass: 'mycapass',
       CN: 'My Root CA',
       O: 'My Company',
       C: 'CN',
     })
   })
   .catch(console.error)
```

- Issue a RSA serve certificate under specified center
```js
 // import * as myca from 'myca'
 const myca = require('myca')

 myca
   .genCert({
     centerName: 'ec',  // <--- specify centerName
     caKeyPass: 'mycapass',
     kind: 'server',
     days: 730,
     pass: 'fooo',
     CN: 'www.waitingsong.com',
     C: 'CN',
   })
   .then((ret) => {
     console.log(ret.cert)
     console.log(ret.crtFile)
     console.log(ret.privateUnsecureKey)
   })
   .catch(console.error)
```

- Issue a serve certificate with Domain Name SANs
```js
 // import * as myca from 'myca'
 const myca = require('myca')

 myca
   .genCert({
     caKeyPass: 'mycapass',
     kind: 'server',
     days: 730,
     pass: 'fooo',
     CN: 'www.waitingsong.com',
     C: 'CN',
     SAN: ['foo.waitingsong.com', 'bar.waitingsong.com'],
   })
   .then((ret) => {
     console.log(ret.cert)
   })
   .catch(console.error)
```

- Issue a serve certificate with IP SANs
```js
 // import * as myca from 'myca'
 const myca = require('myca')

 myca
   .genCert({
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
   })
   .then((ret) => {
     console.log(ret.cert)
   })
   .catch(console.error)
```


- Issue a RSA client p12/pfx certificate
```js
 // import * as myca from 'myca'
 const myca = require('myca')

 myca
   .genCert({
     caKeyPass: 'mycapass',
     kind: 'client',   // pfx cert
     days: 730,
     pass: 'fooo',   // at least 4 letters
     CN: 'www.waitingsong.com',    // Common Name
     C: 'CN',   // Country Name (2 letter code)
   })
   .then((ret) => {
     console.log(ret.pfxFile)
   })
   .catch(console.error)
```


## License
[MIT](LICENSE)


### Languages
- [English](README.md)
- [中文](README.zh-CN.md)
