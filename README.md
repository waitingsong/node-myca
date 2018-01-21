# myca
Create my CA center, generate a self signed x509 certificate, issue server certificate from node.js via openssl. Multiple center supported.

[![Version](https://img.shields.io/npm/v/myca.svg)](https://www.npmjs.com/package/myca)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)


## Installing
```bash
npm install --save myca
```

## Usage
- Initialize default center
```js
myca.initDefaultCenter().catch(console.error)
```

- Initialize CA cert of default center
```js
 import * as myca from 'myca'

 myca
   .initCaCert({
     days: 10950,  // 30years
     pass: 'mycapass',
     CN: 'My Root CA',    // Common Name
     OU: 'waitingsong.com',   // Organizational Unit Name
     O: '',   // Organization Name (eg, company)
     L: '',    // Locality Name (eg, city)
     ST: '',   // State or Province Name
     C: 'CN',   // Country Name (2 letter code)
     emailAddress: '',
   })
   .catch(console.error)
```

- Issue a RSA serve certificate
```js
 import * as myca from 'myca'

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
 import * as myca from 'myca'

 myca.initCenter('ec', '/opt/center-ec')
   .then(() => {
     return myca.initCaCert({
       centerName: 'ec',
       alg: 'ec',
       days: 10950,  // 30years
       pass: 'mycapass',
       CN: 'My Root CA',    // Common Name
       OU: 'waitingsong.com',   // Organizational Unit Name
       C: 'CN',   // Country Name (2 letter code)
     })
   })
   .catch(console.error)
```

- Issue a RSA serve certificate under specified center
```js
 import * as myca from 'myca'

 myca
   .genCert({
     centerName: 'ec',  // <--- specify centerName
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


## License
[MIT](LICENSE)


### Languages
- [English](README.md)
- [中文](README.zh-CN.md)
