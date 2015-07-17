# PotcoinJS (potcoinjs-lib)

The pure JavaScript Potcoin library for node.js and browsers.
A continued implementation of the original `0.1.3` version of BitcoinJS used by over a million wallet users; the backbone for almost all Bitcoin web wallets in production today.


## Features

- Clean: Pure JavaScript, concise code, easy to read.
- Compatible: Works on Node.js and all modern browsers.
- Powerful: Support for advanced features, such as multi-sig, HD Wallets.
- Principled: No support for browsers with crap RNG (IE < 11)
- Standardized: Node community coding style, Browserify, Node's stdlib and Buffers.
- Fast: Optimized code, uses typed arrays instead of byte arrays for performance.


## Installation

npm install potcoinjs-lib

OR

Use the potcoinjs.min.js library for any browser


## Setup

### Node.js

    var potcoin = require('potcoinjs-lib')


### Browser

If you're familiar with how to use browserify, ignore this and proceed normally.
These steps are advisory only and allow you to use the API to its full extent.

[Browserify](https://github.com/substack/node-browserify) is assumed to be installed for these steps.

From your repository, create a `foobar.js` file

``` javascript
var foobar = {
  base58: require('bs58'),
  bitcoin: require('bitcoinjs-lib'),
  ecurve: require('ecurve'),
  BigInteger: require('bigi'),
  Buffer: require('buffer')
}

module.exports = foobar
```

Each of these included packages are seperate to `potcoinjs-lib`, and must be installed separately.
They are however used in the potcoinjs-lib public API.

Using browserify, compile `foobar.js` for use in the browser:

    $ browserify foobar.js -s foobar > foobar.js

You will then be able to load `foobar.js` into your browser, with each of the dependencies above accessible from the global `foobar` object.

**NOTE**: See our package.json for the currently supported version of browserify used by this repository.


## Examples

- [Official PotcoinJS Documentation](https://potwallet.com/potcoinjs-documentation.php)


## Projects utilizing PotcoinJS

- [Potwallet](https://potwallet.com)


## Contributors

Stefan Thomas is the inventor and creator of this BitcoinJS. His pioneering work made Bitcoin web wallets possible.

Since then, many people have contributed. [Click here](https://github.com/bitcoinjs/bitcoinjs-lib/graphs/contributors) to see the comprehensive list.

Daniel Cousens, Wei Lu, JP Richardson and Kyle Drake lead the major refactor of the library from 0.1.3 to 1.0.0.

[Potcoin](http://www.potcoin.com) is the maintaining entity for this PotcoinJS project.


## Contributing

We are always accepting of Pull requests, but we do adhere to specific standards in regards to coding style, test driven development and commit messages.

Please make your best effort to adhere to these when contributing to save on trivial corrections.


## Complementing Libraries

- [BIP39](https://github.com/weilu/bip39) - Mnemonic code for generating deterministic keys
- [BIP38](https://github.com/cryptocoinjs/bip38) - Passphrase-protected private keys
- [BCoin](https://github.com/indutny/bcoin) - BIP37 / Bloom Filters / SPV client
- [insight](https://github.com/bitpay/insight) - A bitcoin blockchain API for web wallets.


## License

This library is free and open-source software released under the MIT license.


## Copyright

BitcoinJS (c) 2011-2014 Bitcoinjs-lib contributors
PotcoinJS (c) 2015 Potcoinjs-lib contributors
Released under MIT license
