var global = Function("return this;")();
/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)
  * http://ender.no.de
  * License MIT
  */
!function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context.$

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules[identifier] || window[identifier]
    if (!module) throw new Error("Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules[name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  function boosh(s, r, els) {
    // string || node || nodelist || window
    if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      els = ender._select(s, r)
      els.selector = s
    } else els = isFinite(s.length) ? s : [s]
    return aug(els, boosh)
  }

  function ender(s, r) {
    return boosh(s, r)
  }

  aug(ender, {
      _VERSION: '0.3.6'
    , fn: boosh // for easy compat to jQuery plugins
    , ender: function (o, chain) {
        aug(chain ? boosh : ender, o)
      }
    , _select: function (s, r) {
        return (r || document).querySelectorAll(s)
      }
  })

  aug(boosh, {
    forEach: function (fn, scope, i) {
      // opt out of native forEach so we can intentionally call our own scope
      // defaulting to the current item and be able to return self
      for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(scope || this[i], this[i], i, this)
      // return self for chaining
      return this
    },
    $: ender // handy reference to self
  })

  ender.noConflict = function () {
    context.$ = old
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = context['ender'] || ender

}(this);
// pakmanager:inherits
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = require('util').inherits
    
  provide("inherits", module.exports);
}(global));

// pakmanager:ripemd160
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  /*
    CryptoJS v3.1.2
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    /** @preserve
    (c) 2012 by Cédric Mesnil. All rights reserved.
    
    Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
    
        - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
        - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    
    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    */
    
    // constants table
    var zl = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
      3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
      1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
      4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
    ]
    
    var zr = [
      5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
      6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
      15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
      8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
      12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
    ]
    
    var sl = [
      11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
      7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
      11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
      11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
      9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
    ]
    
    var sr = [
      8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
      9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
      9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
      15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
      8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
    ]
    
    var hl = [0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E]
    var hr = [0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000]
    
    function bytesToWords (bytes) {
      var words = []
      for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
        words[b >>> 5] |= bytes[i] << (24 - b % 32)
      }
      return words
    }
    
    function wordsToBytes (words) {
      var bytes = []
      for (var b = 0; b < words.length * 32; b += 8) {
        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF)
      }
      return bytes
    }
    
    function processBlock (H, M, offset) {
      // swap endian
      for (var i = 0; i < 16; i++) {
        var offset_i = offset + i
        var M_offset_i = M[offset_i]
    
        // Swap
        M[offset_i] = (
          (((M_offset_i << 8) | (M_offset_i >>> 24)) & 0x00ff00ff) |
          (((M_offset_i << 24) | (M_offset_i >>> 8)) & 0xff00ff00)
        )
      }
    
      // Working variables
      var al, bl, cl, dl, el
      var ar, br, cr, dr, er
    
      ar = al = H[0]
      br = bl = H[1]
      cr = cl = H[2]
      dr = dl = H[3]
      er = el = H[4]
    
      // computation
      var t
      for (i = 0; i < 80; i += 1) {
        t = (al + M[offset + zl[i]]) | 0
        if (i < 16) {
          t += f1(bl, cl, dl) + hl[0]
        } else if (i < 32) {
          t += f2(bl, cl, dl) + hl[1]
        } else if (i < 48) {
          t += f3(bl, cl, dl) + hl[2]
        } else if (i < 64) {
          t += f4(bl, cl, dl) + hl[3]
        } else {// if (i<80) {
          t += f5(bl, cl, dl) + hl[4]
        }
        t = t | 0
        t = rotl(t, sl[i])
        t = (t + el) | 0
        al = el
        el = dl
        dl = rotl(cl, 10)
        cl = bl
        bl = t
    
        t = (ar + M[offset + zr[i]]) | 0
        if (i < 16) {
          t += f5(br, cr, dr) + hr[0]
        } else if (i < 32) {
          t += f4(br, cr, dr) + hr[1]
        } else if (i < 48) {
          t += f3(br, cr, dr) + hr[2]
        } else if (i < 64) {
          t += f2(br, cr, dr) + hr[3]
        } else {// if (i<80) {
          t += f1(br, cr, dr) + hr[4]
        }
    
        t = t | 0
        t = rotl(t, sr[i])
        t = (t + er) | 0
        ar = er
        er = dr
        dr = rotl(cr, 10)
        cr = br
        br = t
      }
    
      // intermediate hash value
      t = (H[1] + cl + dr) | 0
      H[1] = (H[2] + dl + er) | 0
      H[2] = (H[3] + el + ar) | 0
      H[3] = (H[4] + al + br) | 0
      H[4] = (H[0] + bl + cr) | 0
      H[0] = t
    }
    
    function f1 (x, y, z) {
      return ((x) ^ (y) ^ (z))
    }
    
    function f2 (x, y, z) {
      return (((x) & (y)) | ((~x) & (z)))
    }
    
    function f3 (x, y, z) {
      return (((x) | (~(y))) ^ (z))
    }
    
    function f4 (x, y, z) {
      return (((x) & (z)) | ((y) & (~(z))))
    }
    
    function f5 (x, y, z) {
      return ((x) ^ ((y) | (~(z))))
    }
    
    function rotl (x, n) {
      return (x << n) | (x >>> (32 - n))
    }
    
    function ripemd160 (message) {
      var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0]
    
      if (typeof message === 'string') {
        message = new Buffer(message, 'utf8')
      }
    
      var m = bytesToWords(message)
    
      var nBitsLeft = message.length * 8
      var nBitsTotal = message.length * 8
    
      // Add padding
      m[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32)
      m[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
        (((nBitsTotal << 8) | (nBitsTotal >>> 24)) & 0x00ff00ff) |
        (((nBitsTotal << 24) | (nBitsTotal >>> 8)) & 0xff00ff00)
      )
    
      for (var i = 0; i < m.length; i += 16) {
        processBlock(H, m, i)
      }
    
      // swap endian
      for (i = 0; i < 5; i++) {
        // shortcut
        var H_i = H[i]
    
        // Swap
        H[i] = (((H_i << 8) | (H_i >>> 24)) & 0x00ff00ff) |
          (((H_i << 24) | (H_i >>> 8)) & 0xff00ff00)
      }
    
      var digestbytes = wordsToBytes(H)
      return new Buffer(digestbytes)
    }
    
    module.exports = ripemd160
    
  provide("ripemd160", module.exports);
}(global));

// pakmanager:sha.js/hash
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // prototype class for hash functions
    function Hash (blockSize, finalSize) {
      this._block = new Buffer(blockSize)
      this._finalSize = finalSize
      this._blockSize = blockSize
      this._len = 0
      this._s = 0
    }
    
    Hash.prototype.update = function (data, enc) {
      if (typeof data === 'string') {
        enc = enc || 'utf8'
        data = new Buffer(data, enc)
      }
    
      var l = this._len += data.length
      var s = this._s || 0
      var f = 0
      var buffer = this._block
    
      while (s < l) {
        var t = Math.min(data.length, f + this._blockSize - (s % this._blockSize))
        var ch = (t - f)
    
        for (var i = 0; i < ch; i++) {
          buffer[(s % this._blockSize) + i] = data[i + f]
        }
    
        s += ch
        f += ch
    
        if ((s % this._blockSize) === 0) {
          this._update(buffer)
        }
      }
      this._s = s
    
      return this
    }
    
    Hash.prototype.digest = function (enc) {
      // Suppose the length of the message M, in bits, is l
      var l = this._len * 8
    
      // Append the bit 1 to the end of the message
      this._block[this._len % this._blockSize] = 0x80
    
      // and then k zero bits, where k is the smallest non-negative solution to the equation (l + 1 + k) === finalSize mod blockSize
      this._block.fill(0, this._len % this._blockSize + 1)
    
      if (l % (this._blockSize * 8) >= this._finalSize * 8) {
        this._update(this._block)
        this._block.fill(0)
      }
    
      // to this append the block which is equal to the number l written in binary
      // TODO: handle case where l is > Math.pow(2, 29)
      this._block.writeInt32BE(l, this._blockSize - 4)
    
      var hash = this._update(this._block) || this._hash()
    
      return enc ? hash.toString(enc) : hash
    }
    
    Hash.prototype._update = function () {
      throw new Error('_update must be implemented by subclass')
    }
    
    module.exports = Hash
    
  provide("sha.js/hash", module.exports);
}(global));

// pakmanager:sha.js/sha256
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  /**
     * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
     * in FIPS 180-2
     * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     *
     */
    
    var inherits = require('inherits')
    var Hash =  require('sha.js/hash')
    
    var K = [
      0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
      0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
      0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
      0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
      0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
      0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
      0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
      0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
      0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
      0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
      0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
      0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
      0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
      0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
      0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
      0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
    ]
    
    var W = new Array(64)
    
    function Sha256 () {
      this.init()
    
      this._w = W // new Array(64)
    
      Hash.call(this, 64, 56)
    }
    
    inherits(Sha256, Hash)
    
    Sha256.prototype.init = function () {
      this._a = 0x6a09e667 | 0
      this._b = 0xbb67ae85 | 0
      this._c = 0x3c6ef372 | 0
      this._d = 0xa54ff53a | 0
      this._e = 0x510e527f | 0
      this._f = 0x9b05688c | 0
      this._g = 0x1f83d9ab | 0
      this._h = 0x5be0cd19 | 0
    
      return this
    }
    
    function S (X, n) {
      return (X >>> n) | (X << (32 - n))
    }
    
    function R (X, n) {
      return (X >>> n)
    }
    
    function Ch (x, y, z) {
      return ((x & y) ^ ((~x) & z))
    }
    
    function Maj (x, y, z) {
      return ((x & y) ^ (x & z) ^ (y & z))
    }
    
    function Sigma0256 (x) {
      return (S(x, 2) ^ S(x, 13) ^ S(x, 22))
    }
    
    function Sigma1256 (x) {
      return (S(x, 6) ^ S(x, 11) ^ S(x, 25))
    }
    
    function Gamma0256 (x) {
      return (S(x, 7) ^ S(x, 18) ^ R(x, 3))
    }
    
    function Gamma1256 (x) {
      return (S(x, 17) ^ S(x, 19) ^ R(x, 10))
    }
    
    Sha256.prototype._update = function (M) {
      var W = this._w
    
      var a = this._a | 0
      var b = this._b | 0
      var c = this._c | 0
      var d = this._d | 0
      var e = this._e | 0
      var f = this._f | 0
      var g = this._g | 0
      var h = this._h | 0
    
      var j = 0
    
      function calcW () { return Gamma1256(W[j - 2]) + W[j - 7] + Gamma0256(W[j - 15]) + W[j - 16] }
      function loop (w) {
        W[j] = w
    
        var T1 = h + Sigma1256(e) + Ch(e, f, g) + K[j] + w
        var T2 = Sigma0256(a) + Maj(a, b, c)
    
        h = g
        g = f
        f = e
        e = d + T1
        d = c
        c = b
        b = a
        a = T1 + T2
    
        j++
      }
    
      while (j < 16) loop(M.readInt32BE(j * 4))
      while (j < 64) loop(calcW())
    
      this._a = (a + this._a) | 0
      this._b = (b + this._b) | 0
      this._c = (c + this._c) | 0
      this._d = (d + this._d) | 0
      this._e = (e + this._e) | 0
      this._f = (f + this._f) | 0
      this._g = (g + this._g) | 0
      this._h = (h + this._h) | 0
    }
    
    Sha256.prototype._hash = function () {
      var H = new Buffer(32)
    
      H.writeInt32BE(this._a, 0)
      H.writeInt32BE(this._b, 4)
      H.writeInt32BE(this._c, 8)
      H.writeInt32BE(this._d, 12)
      H.writeInt32BE(this._e, 16)
      H.writeInt32BE(this._f, 20)
      H.writeInt32BE(this._g, 24)
      H.writeInt32BE(this._h, 28)
    
      return H
    }
    
    module.exports = Sha256
    
  provide("sha.js/sha256", module.exports);
}(global));

// pakmanager:sha.js/sha512
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var inherits = require('inherits')
    var Hash =  require('sha.js/hash')
    
    var K = [
      0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
      0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
      0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
      0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
      0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
      0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
      0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
      0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
      0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
      0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
      0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
      0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
      0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
      0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
      0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
      0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
      0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
      0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
      0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
      0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
      0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
      0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
      0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
      0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
      0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
      0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
      0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
      0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
      0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
      0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
      0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
      0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
      0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
      0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
      0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
      0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
      0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
      0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
      0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
      0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
    ]
    
    var W = new Array(160)
    
    function Sha512 () {
      this.init()
      this._w = W
    
      Hash.call(this, 128, 112)
    }
    
    inherits(Sha512, Hash)
    
    Sha512.prototype.init = function () {
      this._a = 0x6a09e667 | 0
      this._b = 0xbb67ae85 | 0
      this._c = 0x3c6ef372 | 0
      this._d = 0xa54ff53a | 0
      this._e = 0x510e527f | 0
      this._f = 0x9b05688c | 0
      this._g = 0x1f83d9ab | 0
      this._h = 0x5be0cd19 | 0
    
      this._al = 0xf3bcc908 | 0
      this._bl = 0x84caa73b | 0
      this._cl = 0xfe94f82b | 0
      this._dl = 0x5f1d36f1 | 0
      this._el = 0xade682d1 | 0
      this._fl = 0x2b3e6c1f | 0
      this._gl = 0xfb41bd6b | 0
      this._hl = 0x137e2179 | 0
    
      return this
    }
    
    function S (X, Xl, n) {
      return (X >>> n) | (Xl << (32 - n))
    }
    
    function Ch (x, y, z) {
      return ((x & y) ^ ((~x) & z))
    }
    
    function Maj (x, y, z) {
      return ((x & y) ^ (x & z) ^ (y & z))
    }
    
    Sha512.prototype._update = function (M) {
      var W = this._w
    
      var a = this._a | 0
      var b = this._b | 0
      var c = this._c | 0
      var d = this._d | 0
      var e = this._e | 0
      var f = this._f | 0
      var g = this._g | 0
      var h = this._h | 0
    
      var al = this._al | 0
      var bl = this._bl | 0
      var cl = this._cl | 0
      var dl = this._dl | 0
      var el = this._el | 0
      var fl = this._fl | 0
      var gl = this._gl | 0
      var hl = this._hl | 0
    
      var i = 0, j = 0
      var Wi, Wil
      function calcW () {
        var x = W[j - 15 * 2]
        var xl = W[j - 15 * 2 + 1]
        var gamma0 = S(x, xl, 1) ^ S(x, xl, 8) ^ (x >>> 7)
        var gamma0l = S(xl, x, 1) ^ S(xl, x, 8) ^ S(xl, x, 7)
    
        x = W[j - 2 * 2]
        xl = W[j - 2 * 2 + 1]
        var gamma1 = S(x, xl, 19) ^ S(xl, x, 29) ^ (x >>> 6)
        var gamma1l = S(xl, x, 19) ^ S(x, xl, 29) ^ S(xl, x, 6)
    
        // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
        var Wi7 = W[j - 7 * 2]
        var Wi7l = W[j - 7 * 2 + 1]
    
        var Wi16 = W[j - 16 * 2]
        var Wi16l = W[j - 16 * 2 + 1]
    
        Wil = gamma0l + Wi7l
        Wi = gamma0 + Wi7 + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0)
        Wil = Wil + gamma1l
        Wi = Wi + gamma1 + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0)
        Wil = Wil + Wi16l
        Wi = Wi + Wi16 + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0)
      }
    
      function loop () {
        W[j] = Wi
        W[j + 1] = Wil
    
        var maj = Maj(a, b, c)
        var majl = Maj(al, bl, cl)
    
        var sigma0h = S(a, al, 28) ^ S(al, a, 2) ^ S(al, a, 7)
        var sigma0l = S(al, a, 28) ^ S(a, al, 2) ^ S(a, al, 7)
        var sigma1h = S(e, el, 14) ^ S(e, el, 18) ^ S(el, e, 9)
        var sigma1l = S(el, e, 14) ^ S(el, e, 18) ^ S(e, el, 9)
    
        // t1 = h + sigma1 + ch + K[i] + W[i]
        var Ki = K[j]
        var Kil = K[j + 1]
    
        var ch = Ch(e, f, g)
        var chl = Ch(el, fl, gl)
    
        var t1l = hl + sigma1l
        var t1 = h + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0)
        t1l = t1l + chl
        t1 = t1 + ch + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0)
        t1l = t1l + Kil
        t1 = t1 + Ki + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0)
        t1l = t1l + Wil
        t1 = t1 + Wi + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0)
    
        // t2 = sigma0 + maj
        var t2l = sigma0l + majl
        var t2 = sigma0h + maj + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0)
    
        h = g
        hl = gl
        g = f
        gl = fl
        f = e
        fl = el
        el = (dl + t1l) | 0
        e = (d + t1 + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0
        d = c
        dl = cl
        c = b
        cl = bl
        b = a
        bl = al
        al = (t1l + t2l) | 0
        a = (t1 + t2 + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0
    
        i++
        j += 2
      }
    
      while (i < 16) {
        Wi = M.readInt32BE(j * 4)
        Wil = M.readInt32BE(j * 4 + 4)
    
        loop()
      }
    
      while (i < 80) {
        calcW()
        loop()
      }
    
      this._al = (this._al + al) | 0
      this._bl = (this._bl + bl) | 0
      this._cl = (this._cl + cl) | 0
      this._dl = (this._dl + dl) | 0
      this._el = (this._el + el) | 0
      this._fl = (this._fl + fl) | 0
      this._gl = (this._gl + gl) | 0
      this._hl = (this._hl + hl) | 0
    
      this._a = (this._a + a + ((this._al >>> 0) < (al >>> 0) ? 1 : 0)) | 0
      this._b = (this._b + b + ((this._bl >>> 0) < (bl >>> 0) ? 1 : 0)) | 0
      this._c = (this._c + c + ((this._cl >>> 0) < (cl >>> 0) ? 1 : 0)) | 0
      this._d = (this._d + d + ((this._dl >>> 0) < (dl >>> 0) ? 1 : 0)) | 0
      this._e = (this._e + e + ((this._el >>> 0) < (el >>> 0) ? 1 : 0)) | 0
      this._f = (this._f + f + ((this._fl >>> 0) < (fl >>> 0) ? 1 : 0)) | 0
      this._g = (this._g + g + ((this._gl >>> 0) < (gl >>> 0) ? 1 : 0)) | 0
      this._h = (this._h + h + ((this._hl >>> 0) < (hl >>> 0) ? 1 : 0)) | 0
    }
    
    Sha512.prototype._hash = function () {
      var H = new Buffer(64)
    
      function writeInt64BE (h, l, offset) {
        H.writeInt32BE(h, offset)
        H.writeInt32BE(l, offset + 4)
      }
    
      writeInt64BE(this._a, this._al, 0)
      writeInt64BE(this._b, this._bl, 8)
      writeInt64BE(this._c, this._cl, 16)
      writeInt64BE(this._d, this._dl, 24)
      writeInt64BE(this._e, this._el, 32)
      writeInt64BE(this._f, this._fl, 40)
      writeInt64BE(this._g, this._gl, 48)
      writeInt64BE(this._h, this._hl, 56)
    
      return H
    }
    
    module.exports = Sha512
    
  provide("sha.js/sha512", module.exports);
}(global));

// pakmanager:sha.js/sha
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  /*
     * A JavaScript implementation of the Secure Hash Algorithm, SHA-0, as defined
     * in FIPS PUB 180-1
     * This source code is derived from sha1.js of the same repository.
     * The difference between SHA-0 and SHA-1 is just a bitwise rotate left
     * operation was added.
     */
    
    var inherits = require('inherits')
    var Hash =  require('sha.js/hash')
    
    var W = new Array(80)
    
    function Sha () {
      this.init()
      this._w = W
    
      Hash.call(this, 64, 56)
    }
    
    inherits(Sha, Hash)
    
    Sha.prototype.init = function () {
      this._a = 0x67452301 | 0
      this._b = 0xefcdab89 | 0
      this._c = 0x98badcfe | 0
      this._d = 0x10325476 | 0
      this._e = 0xc3d2e1f0 | 0
    
      return this
    }
    
    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    function rol (num, cnt) {
      return (num << cnt) | (num >>> (32 - cnt))
    }
    
    Sha.prototype._update = function (M) {
      var W = this._w
    
      var a = this._a
      var b = this._b
      var c = this._c
      var d = this._d
      var e = this._e
    
      var j = 0, k
    
      /*
       * SHA-1 has a bitwise rotate left operation. But, SHA is not
       * function calcW() { return rol(W[j - 3] ^ W[j -  8] ^ W[j - 14] ^ W[j - 16], 1) }
       */
      function calcW () { return W[j - 3] ^ W[j - 8] ^ W[j - 14] ^ W[j - 16] }
      function loop (w, f) {
        W[j] = w
    
        var t = rol(a, 5) + f + e + w + k
    
        e = d
        d = c
        c = rol(b, 30)
        b = a
        a = t
        j++
      }
    
      k = 1518500249
      while (j < 16) loop(M.readInt32BE(j * 4), (b & c) | ((~b) & d))
      while (j < 20) loop(calcW(), (b & c) | ((~b) & d))
      k = 1859775393
      while (j < 40) loop(calcW(), b ^ c ^ d)
      k = -1894007588
      while (j < 60) loop(calcW(), (b & c) | (b & d) | (c & d))
      k = -899497514
      while (j < 80) loop(calcW(), b ^ c ^ d)
    
      this._a = (a + this._a) | 0
      this._b = (b + this._b) | 0
      this._c = (c + this._c) | 0
      this._d = (d + this._d) | 0
      this._e = (e + this._e) | 0
    }
    
    Sha.prototype._hash = function () {
      var H = new Buffer(20)
    
      H.writeInt32BE(this._a | 0, 0)
      H.writeInt32BE(this._b | 0, 4)
      H.writeInt32BE(this._c | 0, 8)
      H.writeInt32BE(this._d | 0, 12)
      H.writeInt32BE(this._e | 0, 16)
    
      return H
    }
    
    module.exports = Sha
    
    
  provide("sha.js/sha", module.exports);
}(global));

// pakmanager:sha.js/sha1
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  /*
     * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
     * in FIPS PUB 180-1
     * Version 2.1a Copyright Paul Johnston 2000 - 2002.
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     * Distributed under the BSD License
     * See http://pajhome.org.uk/crypt/md5 for details.
     */
    
    var inherits = require('inherits')
    var Hash =  require('sha.js/hash')
    
    var W = new Array(80)
    
    function Sha1 () {
      this.init()
      this._w = W
    
      Hash.call(this, 64, 56)
    }
    
    inherits(Sha1, Hash)
    
    Sha1.prototype.init = function () {
      this._a = 0x67452301 | 0
      this._b = 0xefcdab89 | 0
      this._c = 0x98badcfe | 0
      this._d = 0x10325476 | 0
      this._e = 0xc3d2e1f0 | 0
    
      return this
    }
    
    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    function rol (num, cnt) {
      return (num << cnt) | (num >>> (32 - cnt))
    }
    
    Sha1.prototype._update = function (M) {
      var W = this._w
    
      var a = this._a
      var b = this._b
      var c = this._c
      var d = this._d
      var e = this._e
    
      var j = 0, k
    
      function calcW () { return rol(W[j - 3] ^ W[j - 8] ^ W[j - 14] ^ W[j - 16], 1) }
      function loop (w, f) {
        W[j] = w
    
        var t = rol(a, 5) + f + e + w + k
    
        e = d
        d = c
        c = rol(b, 30)
        b = a
        a = t
        j++
      }
    
      k = 1518500249
      while (j < 16) loop(M.readInt32BE(j * 4), (b & c) | ((~b) & d))
      while (j < 20) loop(calcW(), (b & c) | ((~b) & d))
      k = 1859775393
      while (j < 40) loop(calcW(), b ^ c ^ d)
      k = -1894007588
      while (j < 60) loop(calcW(), (b & c) | (b & d) | (c & d))
      k = -899497514
      while (j < 80) loop(calcW(), b ^ c ^ d)
    
      this._a = (a + this._a) | 0
      this._b = (b + this._b) | 0
      this._c = (c + this._c) | 0
      this._d = (d + this._d) | 0
      this._e = (e + this._e) | 0
    }
    
    Sha1.prototype._hash = function () {
      var H = new Buffer(20)
    
      H.writeInt32BE(this._a | 0, 0)
      H.writeInt32BE(this._b | 0, 4)
      H.writeInt32BE(this._c | 0, 8)
      H.writeInt32BE(this._d | 0, 12)
      H.writeInt32BE(this._e | 0, 16)
    
      return H
    }
    
    module.exports = Sha1
    
  provide("sha.js/sha1", module.exports);
}(global));

// pakmanager:sha.js/sha224
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  /**
     * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
     * in FIPS 180-2
     * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     *
     */
    
    var inherits = require('inherits')
    var Sha256 =  require('sha.js/sha256')
    var Hash =  require('sha.js/hash')
    
    var W = new Array(64)
    
    function Sha224 () {
      this.init()
    
      this._w = W // new Array(64)
    
      Hash.call(this, 64, 56)
    }
    
    inherits(Sha224, Sha256)
    
    Sha224.prototype.init = function () {
      this._a = 0xc1059ed8 | 0
      this._b = 0x367cd507 | 0
      this._c = 0x3070dd17 | 0
      this._d = 0xf70e5939 | 0
      this._e = 0xffc00b31 | 0
      this._f = 0x68581511 | 0
      this._g = 0x64f98fa7 | 0
      this._h = 0xbefa4fa4 | 0
    
      return this
    }
    
    Sha224.prototype._hash = function () {
      var H = new Buffer(28)
    
      H.writeInt32BE(this._a, 0)
      H.writeInt32BE(this._b, 4)
      H.writeInt32BE(this._c, 8)
      H.writeInt32BE(this._d, 12)
      H.writeInt32BE(this._e, 16)
      H.writeInt32BE(this._f, 20)
      H.writeInt32BE(this._g, 24)
    
      return H
    }
    
    module.exports = Sha224
    
  provide("sha.js/sha224", module.exports);
}(global));

// pakmanager:sha.js/sha384
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var inherits = require('inherits')
    var SHA512 =  require('sha.js/sha512')
    var Hash =  require('sha.js/hash')
    
    var W = new Array(160)
    
    function Sha384 () {
      this.init()
      this._w = W
    
      Hash.call(this, 128, 112)
    }
    
    inherits(Sha384, SHA512)
    
    Sha384.prototype.init = function () {
      this._a = 0xcbbb9d5d | 0
      this._b = 0x629a292a | 0
      this._c = 0x9159015a | 0
      this._d = 0x152fecd8 | 0
      this._e = 0x67332667 | 0
      this._f = 0x8eb44a87 | 0
      this._g = 0xdb0c2e0d | 0
      this._h = 0x47b5481d | 0
    
      this._al = 0xc1059ed8 | 0
      this._bl = 0x367cd507 | 0
      this._cl = 0x3070dd17 | 0
      this._dl = 0xf70e5939 | 0
      this._el = 0xffc00b31 | 0
      this._fl = 0x68581511 | 0
      this._gl = 0x64f98fa7 | 0
      this._hl = 0xbefa4fa4 | 0
    
      return this
    }
    
    Sha384.prototype._hash = function () {
      var H = new Buffer(48)
    
      function writeInt64BE (h, l, offset) {
        H.writeInt32BE(h, offset)
        H.writeInt32BE(l, offset + 4)
      }
    
      writeInt64BE(this._a, this._al, 0)
      writeInt64BE(this._b, this._bl, 8)
      writeInt64BE(this._c, this._cl, 16)
      writeInt64BE(this._d, this._dl, 24)
      writeInt64BE(this._e, this._el, 32)
      writeInt64BE(this._f, this._fl, 40)
    
      return H
    }
    
    module.exports = Sha384
    
  provide("sha.js/sha384", module.exports);
}(global));

// pakmanager:sha.js
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var exports = module.exports = function SHA (algorithm) {
      algorithm = algorithm.toLowerCase()
    
      var Algorithm = exports[algorithm]
      if (!Algorithm) throw new Error(algorithm + ' is not supported (we accept pull requests)')
    
      return new Algorithm()
    }
    
    exports.sha =  require('sha.js/sha')
    exports.sha1 =  require('sha.js/sha1')
    exports.sha224 =  require('sha.js/sha224')
    exports.sha256 =  require('sha.js/sha256')
    exports.sha384 =  require('sha.js/sha384')
    exports.sha512 =  require('sha.js/sha512')
    
  provide("sha.js", module.exports);
}(global));

// pakmanager:bs58
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // Base58 encoding/decoding
    // Originally written by Mike Hearn for BitcoinJ
    // Copyright (c) 2011 Google Inc
    // Ported to JavaScript by Stefan Thomas
    // Merged Buffer refactorings from base58-native by Stephen Pair
    // Copyright (c) 2013 BitPay Inc
    
    var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    var ALPHABET_MAP = {}
    for(var i = 0; i < ALPHABET.length; i++) {
      ALPHABET_MAP[ALPHABET.charAt(i)] = i
    }
    var BASE = 58
    
    function encode(buffer) {
      if (buffer.length === 0) return ''
    
      var i, j, digits = [0]
      for (i = 0; i < buffer.length; i++) {
        for (j = 0; j < digits.length; j++) digits[j] <<= 8
    
        digits[0] += buffer[i]
    
        var carry = 0
        for (j = 0; j < digits.length; ++j) {
          digits[j] += carry
    
          carry = (digits[j] / BASE) | 0
          digits[j] %= BASE
        }
    
        while (carry) {
          digits.push(carry % BASE)
    
          carry = (carry / BASE) | 0
        }
      }
    
      // deal with leading zeros
      for (i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) digits.push(0)
    
      // convert digits to a string
      var stringOutput = ""
      for (var i = digits.length - 1; i >= 0; i--) {
        stringOutput = stringOutput + ALPHABET[digits[i]]
      }
      return stringOutput
    }
    
    function decode(string) {
      if (string.length === 0) return []
    
      var i, j, bytes = [0]
      for (i = 0; i < string.length; i++) {
        var c = string[i]
        if (!(c in ALPHABET_MAP)) throw new Error('Non-base58 character')
    
        for (j = 0; j < bytes.length; j++) bytes[j] *= BASE
        bytes[0] += ALPHABET_MAP[c]
    
        var carry = 0
        for (j = 0; j < bytes.length; ++j) {
          bytes[j] += carry
    
          carry = bytes[j] >> 8
          bytes[j] &= 0xff
        }
    
        while (carry) {
          bytes.push(carry & 0xff)
    
          carry >>= 8
        }
      }
    
      // deal with leading zeros
      for (i = 0; string[i] === '1' && i < string.length - 1; i++) bytes.push(0)
    
      return bytes.reverse()
    }
    
    module.exports = {
      encode: encode,
      decode: decode
    }
    
  provide("bs58", module.exports);
}(global));

// pakmanager:create-hash
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = require('crypto').createHash;
  provide("create-hash", module.exports);
}(global));

// pakmanager:bigi/lib/bigi
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // (public) Constructor
    function BigInteger(a, b, c) {
      if (!(this instanceof BigInteger))
        return new BigInteger(a, b, c)
    
      if (a != null) {
        if ("number" == typeof a) this.fromNumber(a, b, c)
        else if (b == null && "string" != typeof a) this.fromString(a, 256)
        else this.fromString(a, b)
      }
    }
    
    var proto = BigInteger.prototype
    
    // duck-typed isBigInteger
    proto.__bigi = require('../package.json').version
    BigInteger.isBigInteger = function (obj, check_ver) {
      return obj && obj.__bigi && (!check_ver || obj.__bigi === proto.__bigi)
    }
    
    // Bits per digit
    var dbits
    
    // am: Compute w_j += (x*this_i), propagate carries,
    // c is initial carry, returns final carry.
    // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
    // We need to select the fastest one that works in this environment.
    
    // am1: use a single mult and divide to get the high bits,
    // max digit bits should be 26 because
    // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
    function am1(i, x, w, j, c, n) {
      while (--n >= 0) {
        var v = x * this[i++] + w[j] + c
        c = Math.floor(v / 0x4000000)
        w[j++] = v & 0x3ffffff
      }
      return c
    }
    // am2 avoids a big mult-and-extract completely.
    // Max digit bits should be <= 30 because we do bitwise ops
    // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
    function am2(i, x, w, j, c, n) {
      var xl = x & 0x7fff,
        xh = x >> 15
      while (--n >= 0) {
        var l = this[i] & 0x7fff
        var h = this[i++] >> 15
        var m = xh * l + h * xl
        l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff)
        c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30)
        w[j++] = l & 0x3fffffff
      }
      return c
    }
    // Alternately, set max digit bits to 28 since some
    // browsers slow down when dealing with 32-bit numbers.
    function am3(i, x, w, j, c, n) {
      var xl = x & 0x3fff,
        xh = x >> 14
      while (--n >= 0) {
        var l = this[i] & 0x3fff
        var h = this[i++] >> 14
        var m = xh * l + h * xl
        l = xl * l + ((m & 0x3fff) << 14) + w[j] + c
        c = (l >> 28) + (m >> 14) + xh * h
        w[j++] = l & 0xfffffff
      }
      return c
    }
    
    // wtf?
    BigInteger.prototype.am = am1
    dbits = 26
    
    BigInteger.prototype.DB = dbits
    BigInteger.prototype.DM = ((1 << dbits) - 1)
    var DV = BigInteger.prototype.DV = (1 << dbits)
    
    var BI_FP = 52
    BigInteger.prototype.FV = Math.pow(2, BI_FP)
    BigInteger.prototype.F1 = BI_FP - dbits
    BigInteger.prototype.F2 = 2 * dbits - BI_FP
    
    // Digit conversions
    var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz"
    var BI_RC = new Array()
    var rr, vv
    rr = "0".charCodeAt(0)
    for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv
    rr = "a".charCodeAt(0)
    for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv
    rr = "A".charCodeAt(0)
    for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv
    
    function int2char(n) {
      return BI_RM.charAt(n)
    }
    
    function intAt(s, i) {
      var c = BI_RC[s.charCodeAt(i)]
      return (c == null) ? -1 : c
    }
    
    // (protected) copy this to r
    function bnpCopyTo(r) {
      for (var i = this.t - 1; i >= 0; --i) r[i] = this[i]
      r.t = this.t
      r.s = this.s
    }
    
    // (protected) set from integer value x, -DV <= x < DV
    function bnpFromInt(x) {
      this.t = 1
      this.s = (x < 0) ? -1 : 0
      if (x > 0) this[0] = x
      else if (x < -1) this[0] = x + DV
      else this.t = 0
    }
    
    // return bigint initialized to value
    function nbv(i) {
      var r = new BigInteger()
      r.fromInt(i)
      return r
    }
    
    // (protected) set from string and radix
    function bnpFromString(s, b) {
      var self = this
    
      var k
      if (b == 16) k = 4
      else if (b == 8) k = 3
      else if (b == 256) k = 8; // byte array
      else if (b == 2) k = 1
      else if (b == 32) k = 5
      else if (b == 4) k = 2
      else {
        self.fromRadix(s, b)
        return
      }
      self.t = 0
      self.s = 0
      var i = s.length,
        mi = false,
        sh = 0
      while (--i >= 0) {
        var x = (k == 8) ? s[i] & 0xff : intAt(s, i)
        if (x < 0) {
          if (s.charAt(i) == "-") mi = true
          continue
        }
        mi = false
        if (sh == 0)
          self[self.t++] = x
        else if (sh + k > self.DB) {
          self[self.t - 1] |= (x & ((1 << (self.DB - sh)) - 1)) << sh
          self[self.t++] = (x >> (self.DB - sh))
        } else
          self[self.t - 1] |= x << sh
        sh += k
        if (sh >= self.DB) sh -= self.DB
      }
      if (k == 8 && (s[0] & 0x80) != 0) {
        self.s = -1
        if (sh > 0) self[self.t - 1] |= ((1 << (self.DB - sh)) - 1) << sh
      }
      self.clamp()
      if (mi) BigInteger.ZERO.subTo(self, self)
    }
    
    // (protected) clamp off excess high words
    function bnpClamp() {
      var c = this.s & this.DM
      while (this.t > 0 && this[this.t - 1] == c)--this.t
    }
    
    // (public) return string representation in given radix
    function bnToString(b) {
      var self = this
      if (self.s < 0) return "-" + self.negate()
        .toString(b)
      var k
      if (b == 16) k = 4
      else if (b == 8) k = 3
      else if (b == 2) k = 1
      else if (b == 32) k = 5
      else if (b == 4) k = 2
      else return self.toRadix(b)
      var km = (1 << k) - 1,
        d, m = false,
        r = "",
        i = self.t
      var p = self.DB - (i * self.DB) % k
      if (i-- > 0) {
        if (p < self.DB && (d = self[i] >> p) > 0) {
          m = true
          r = int2char(d)
        }
        while (i >= 0) {
          if (p < k) {
            d = (self[i] & ((1 << p) - 1)) << (k - p)
            d |= self[--i] >> (p += self.DB - k)
          } else {
            d = (self[i] >> (p -= k)) & km
            if (p <= 0) {
              p += self.DB
              --i
            }
          }
          if (d > 0) m = true
          if (m) r += int2char(d)
        }
      }
      return m ? r : "0"
    }
    
    // (public) -this
    function bnNegate() {
      var r = new BigInteger()
      BigInteger.ZERO.subTo(this, r)
      return r
    }
    
    // (public) |this|
    function bnAbs() {
      return (this.s < 0) ? this.negate() : this
    }
    
    // (public) return + if this > a, - if this < a, 0 if equal
    function bnCompareTo(a) {
      var r = this.s - a.s
      if (r != 0) return r
      var i = this.t
      r = i - a.t
      if (r != 0) return (this.s < 0) ? -r : r
      while (--i >= 0)
        if ((r = this[i] - a[i]) != 0) return r
      return 0
    }
    
    // returns bit length of the integer x
    function nbits(x) {
      var r = 1,
        t
      if ((t = x >>> 16) != 0) {
        x = t
        r += 16
      }
      if ((t = x >> 8) != 0) {
        x = t
        r += 8
      }
      if ((t = x >> 4) != 0) {
        x = t
        r += 4
      }
      if ((t = x >> 2) != 0) {
        x = t
        r += 2
      }
      if ((t = x >> 1) != 0) {
        x = t
        r += 1
      }
      return r
    }
    
    // (public) return the number of bits in "this"
    function bnBitLength() {
      if (this.t <= 0) return 0
      return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM))
    }
    
    // (public) return the number of bytes in "this"
    function bnByteLength() {
      return this.bitLength() >> 3
    }
    
    // (protected) r = this << n*DB
    function bnpDLShiftTo(n, r) {
      var i
      for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i]
      for (i = n - 1; i >= 0; --i) r[i] = 0
      r.t = this.t + n
      r.s = this.s
    }
    
    // (protected) r = this >> n*DB
    function bnpDRShiftTo(n, r) {
      for (var i = n; i < this.t; ++i) r[i - n] = this[i]
      r.t = Math.max(this.t - n, 0)
      r.s = this.s
    }
    
    // (protected) r = this << n
    function bnpLShiftTo(n, r) {
      var self = this
      var bs = n % self.DB
      var cbs = self.DB - bs
      var bm = (1 << cbs) - 1
      var ds = Math.floor(n / self.DB),
        c = (self.s << bs) & self.DM,
        i
      for (i = self.t - 1; i >= 0; --i) {
        r[i + ds + 1] = (self[i] >> cbs) | c
        c = (self[i] & bm) << bs
      }
      for (i = ds - 1; i >= 0; --i) r[i] = 0
      r[ds] = c
      r.t = self.t + ds + 1
      r.s = self.s
      r.clamp()
    }
    
    // (protected) r = this >> n
    function bnpRShiftTo(n, r) {
      var self = this
      r.s = self.s
      var ds = Math.floor(n / self.DB)
      if (ds >= self.t) {
        r.t = 0
        return
      }
      var bs = n % self.DB
      var cbs = self.DB - bs
      var bm = (1 << bs) - 1
      r[0] = self[ds] >> bs
      for (var i = ds + 1; i < self.t; ++i) {
        r[i - ds - 1] |= (self[i] & bm) << cbs
        r[i - ds] = self[i] >> bs
      }
      if (bs > 0) r[self.t - ds - 1] |= (self.s & bm) << cbs
      r.t = self.t - ds
      r.clamp()
    }
    
    // (protected) r = this - a
    function bnpSubTo(a, r) {
      var self = this
      var i = 0,
        c = 0,
        m = Math.min(a.t, self.t)
      while (i < m) {
        c += self[i] - a[i]
        r[i++] = c & self.DM
        c >>= self.DB
      }
      if (a.t < self.t) {
        c -= a.s
        while (i < self.t) {
          c += self[i]
          r[i++] = c & self.DM
          c >>= self.DB
        }
        c += self.s
      } else {
        c += self.s
        while (i < a.t) {
          c -= a[i]
          r[i++] = c & self.DM
          c >>= self.DB
        }
        c -= a.s
      }
      r.s = (c < 0) ? -1 : 0
      if (c < -1) r[i++] = self.DV + c
      else if (c > 0) r[i++] = c
      r.t = i
      r.clamp()
    }
    
    // (protected) r = this * a, r != this,a (HAC 14.12)
    // "this" should be the larger one if appropriate.
    function bnpMultiplyTo(a, r) {
      var x = this.abs(),
        y = a.abs()
      var i = x.t
      r.t = i + y.t
      while (--i >= 0) r[i] = 0
      for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t)
      r.s = 0
      r.clamp()
      if (this.s != a.s) BigInteger.ZERO.subTo(r, r)
    }
    
    // (protected) r = this^2, r != this (HAC 14.16)
    function bnpSquareTo(r) {
      var x = this.abs()
      var i = r.t = 2 * x.t
      while (--i >= 0) r[i] = 0
      for (i = 0; i < x.t - 1; ++i) {
        var c = x.am(i, x[i], r, 2 * i, 0, 1)
        if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
          r[i + x.t] -= x.DV
          r[i + x.t + 1] = 1
        }
      }
      if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1)
      r.s = 0
      r.clamp()
    }
    
    // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
    // r != q, this != m.  q or r may be null.
    function bnpDivRemTo(m, q, r) {
      var self = this
      var pm = m.abs()
      if (pm.t <= 0) return
      var pt = self.abs()
      if (pt.t < pm.t) {
        if (q != null) q.fromInt(0)
        if (r != null) self.copyTo(r)
        return
      }
      if (r == null) r = new BigInteger()
      var y = new BigInteger(),
        ts = self.s,
        ms = m.s
      var nsh = self.DB - nbits(pm[pm.t - 1]); // normalize modulus
      if (nsh > 0) {
        pm.lShiftTo(nsh, y)
        pt.lShiftTo(nsh, r)
      } else {
        pm.copyTo(y)
        pt.copyTo(r)
      }
      var ys = y.t
      var y0 = y[ys - 1]
      if (y0 == 0) return
      var yt = y0 * (1 << self.F1) + ((ys > 1) ? y[ys - 2] >> self.F2 : 0)
      var d1 = self.FV / yt,
        d2 = (1 << self.F1) / yt,
        e = 1 << self.F2
      var i = r.t,
        j = i - ys,
        t = (q == null) ? new BigInteger() : q
      y.dlShiftTo(j, t)
      if (r.compareTo(t) >= 0) {
        r[r.t++] = 1
        r.subTo(t, r)
      }
      BigInteger.ONE.dlShiftTo(ys, t)
      t.subTo(y, y); // "negative" y so we can replace sub with am later
      while (y.t < ys) y[y.t++] = 0
      while (--j >= 0) {
        // Estimate quotient digit
        var qd = (r[--i] == y0) ? self.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2)
        if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) { // Try it out
          y.dlShiftTo(j, t)
          r.subTo(t, r)
          while (r[i] < --qd) r.subTo(t, r)
        }
      }
      if (q != null) {
        r.drShiftTo(ys, q)
        if (ts != ms) BigInteger.ZERO.subTo(q, q)
      }
      r.t = ys
      r.clamp()
      if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder
      if (ts < 0) BigInteger.ZERO.subTo(r, r)
    }
    
    // (public) this mod a
    function bnMod(a) {
      var r = new BigInteger()
      this.abs()
        .divRemTo(a, null, r)
      if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r)
      return r
    }
    
    // Modular reduction using "classic" algorithm
    function Classic(m) {
      this.m = m
    }
    
    function cConvert(x) {
      if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m)
      else return x
    }
    
    function cRevert(x) {
      return x
    }
    
    function cReduce(x) {
      x.divRemTo(this.m, null, x)
    }
    
    function cMulTo(x, y, r) {
      x.multiplyTo(y, r)
      this.reduce(r)
    }
    
    function cSqrTo(x, r) {
      x.squareTo(r)
      this.reduce(r)
    }
    
    Classic.prototype.convert = cConvert
    Classic.prototype.revert = cRevert
    Classic.prototype.reduce = cReduce
    Classic.prototype.mulTo = cMulTo
    Classic.prototype.sqrTo = cSqrTo
    
    // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
    // justification:
    //         xy == 1 (mod m)
    //         xy =  1+km
    //   xy(2-xy) = (1+km)(1-km)
    // x[y(2-xy)] = 1-k^2m^2
    // x[y(2-xy)] == 1 (mod m^2)
    // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
    // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
    // JS multiply "overflows" differently from C/C++, so care is needed here.
    function bnpInvDigit() {
      if (this.t < 1) return 0
      var x = this[0]
      if ((x & 1) == 0) return 0
      var y = x & 3; // y == 1/x mod 2^2
      y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
      y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
      y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
      // last step - calculate inverse mod DV directly
      // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
      y = (y * (2 - x * y % this.DV)) % this.DV; // y == 1/x mod 2^dbits
      // we really want the negative inverse, and -DV < y < DV
      return (y > 0) ? this.DV - y : -y
    }
    
    // Montgomery reduction
    function Montgomery(m) {
      this.m = m
      this.mp = m.invDigit()
      this.mpl = this.mp & 0x7fff
      this.mph = this.mp >> 15
      this.um = (1 << (m.DB - 15)) - 1
      this.mt2 = 2 * m.t
    }
    
    // xR mod m
    function montConvert(x) {
      var r = new BigInteger()
      x.abs()
        .dlShiftTo(this.m.t, r)
      r.divRemTo(this.m, null, r)
      if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r)
      return r
    }
    
    // x/R mod m
    function montRevert(x) {
      var r = new BigInteger()
      x.copyTo(r)
      this.reduce(r)
      return r
    }
    
    // x = x/R mod m (HAC 14.32)
    function montReduce(x) {
      while (x.t <= this.mt2) // pad x so am has enough room later
        x[x.t++] = 0
      for (var i = 0; i < this.m.t; ++i) {
        // faster way of calculating u0 = x[i]*mp mod DV
        var j = x[i] & 0x7fff
        var u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM
        // use am to combine the multiply-shift-add into one call
        j = i + this.m.t
        x[j] += this.m.am(0, u0, x, i, 0, this.m.t)
        // propagate carry
        while (x[j] >= x.DV) {
          x[j] -= x.DV
          x[++j]++
        }
      }
      x.clamp()
      x.drShiftTo(this.m.t, x)
      if (x.compareTo(this.m) >= 0) x.subTo(this.m, x)
    }
    
    // r = "x^2/R mod m"; x != r
    function montSqrTo(x, r) {
      x.squareTo(r)
      this.reduce(r)
    }
    
    // r = "xy/R mod m"; x,y != r
    function montMulTo(x, y, r) {
      x.multiplyTo(y, r)
      this.reduce(r)
    }
    
    Montgomery.prototype.convert = montConvert
    Montgomery.prototype.revert = montRevert
    Montgomery.prototype.reduce = montReduce
    Montgomery.prototype.mulTo = montMulTo
    Montgomery.prototype.sqrTo = montSqrTo
    
    // (protected) true iff this is even
    function bnpIsEven() {
      return ((this.t > 0) ? (this[0] & 1) : this.s) == 0
    }
    
    // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
    function bnpExp(e, z) {
      if (e > 0xffffffff || e < 1) return BigInteger.ONE
      var r = new BigInteger(),
        r2 = new BigInteger(),
        g = z.convert(this),
        i = nbits(e) - 1
      g.copyTo(r)
      while (--i >= 0) {
        z.sqrTo(r, r2)
        if ((e & (1 << i)) > 0) z.mulTo(r2, g, r)
        else {
          var t = r
          r = r2
          r2 = t
        }
      }
      return z.revert(r)
    }
    
    // (public) this^e % m, 0 <= e < 2^32
    function bnModPowInt(e, m) {
      var z
      if (e < 256 || m.isEven()) z = new Classic(m)
      else z = new Montgomery(m)
      return this.exp(e, z)
    }
    
    // protected
    proto.copyTo = bnpCopyTo
    proto.fromInt = bnpFromInt
    proto.fromString = bnpFromString
    proto.clamp = bnpClamp
    proto.dlShiftTo = bnpDLShiftTo
    proto.drShiftTo = bnpDRShiftTo
    proto.lShiftTo = bnpLShiftTo
    proto.rShiftTo = bnpRShiftTo
    proto.subTo = bnpSubTo
    proto.multiplyTo = bnpMultiplyTo
    proto.squareTo = bnpSquareTo
    proto.divRemTo = bnpDivRemTo
    proto.invDigit = bnpInvDigit
    proto.isEven = bnpIsEven
    proto.exp = bnpExp
    
    // public
    proto.toString = bnToString
    proto.negate = bnNegate
    proto.abs = bnAbs
    proto.compareTo = bnCompareTo
    proto.bitLength = bnBitLength
    proto.byteLength = bnByteLength
    proto.mod = bnMod
    proto.modPowInt = bnModPowInt
    
    // (public)
    function bnClone() {
      var r = new BigInteger()
      this.copyTo(r)
      return r
    }
    
    // (public) return value as integer
    function bnIntValue() {
      if (this.s < 0) {
        if (this.t == 1) return this[0] - this.DV
        else if (this.t == 0) return -1
      } else if (this.t == 1) return this[0]
      else if (this.t == 0) return 0
      // assumes 16 < DB < 32
      return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0]
    }
    
    // (public) return value as byte
    function bnByteValue() {
      return (this.t == 0) ? this.s : (this[0] << 24) >> 24
    }
    
    // (public) return value as short (assumes DB>=16)
    function bnShortValue() {
      return (this.t == 0) ? this.s : (this[0] << 16) >> 16
    }
    
    // (protected) return x s.t. r^x < DV
    function bnpChunkSize(r) {
      return Math.floor(Math.LN2 * this.DB / Math.log(r))
    }
    
    // (public) 0 if this == 0, 1 if this > 0
    function bnSigNum() {
      if (this.s < 0) return -1
      else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0
      else return 1
    }
    
    // (protected) convert to radix string
    function bnpToRadix(b) {
      if (b == null) b = 10
      if (this.signum() == 0 || b < 2 || b > 36) return "0"
      var cs = this.chunkSize(b)
      var a = Math.pow(b, cs)
      var d = nbv(a),
        y = new BigInteger(),
        z = new BigInteger(),
        r = ""
      this.divRemTo(d, y, z)
      while (y.signum() > 0) {
        r = (a + z.intValue())
          .toString(b)
          .substr(1) + r
        y.divRemTo(d, y, z)
      }
      return z.intValue()
        .toString(b) + r
    }
    
    // (protected) convert from radix string
    function bnpFromRadix(s, b) {
      var self = this
      self.fromInt(0)
      if (b == null) b = 10
      var cs = self.chunkSize(b)
      var d = Math.pow(b, cs),
        mi = false,
        j = 0,
        w = 0
      for (var i = 0; i < s.length; ++i) {
        var x = intAt(s, i)
        if (x < 0) {
          if (s.charAt(i) == "-" && self.signum() == 0) mi = true
          continue
        }
        w = b * w + x
        if (++j >= cs) {
          self.dMultiply(d)
          self.dAddOffset(w, 0)
          j = 0
          w = 0
        }
      }
      if (j > 0) {
        self.dMultiply(Math.pow(b, j))
        self.dAddOffset(w, 0)
      }
      if (mi) BigInteger.ZERO.subTo(self, self)
    }
    
    // (protected) alternate constructor
    function bnpFromNumber(a, b, c) {
      var self = this
      if ("number" == typeof b) {
        // new BigInteger(int,int,RNG)
        if (a < 2) self.fromInt(1)
        else {
          self.fromNumber(a, c)
          if (!self.testBit(a - 1)) // force MSB set
            self.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, self)
          if (self.isEven()) self.dAddOffset(1, 0); // force odd
          while (!self.isProbablePrime(b)) {
            self.dAddOffset(2, 0)
            if (self.bitLength() > a) self.subTo(BigInteger.ONE.shiftLeft(a - 1), self)
          }
        }
      } else {
        // new BigInteger(int,RNG)
        var x = new Array(),
          t = a & 7
        x.length = (a >> 3) + 1
        b.nextBytes(x)
        if (t > 0) x[0] &= ((1 << t) - 1)
        else x[0] = 0
        self.fromString(x, 256)
      }
    }
    
    // (public) convert to bigendian byte array
    function bnToByteArray() {
      var self = this
      var i = self.t,
        r = new Array()
      r[0] = self.s
      var p = self.DB - (i * self.DB) % 8,
        d, k = 0
      if (i-- > 0) {
        if (p < self.DB && (d = self[i] >> p) != (self.s & self.DM) >> p)
          r[k++] = d | (self.s << (self.DB - p))
        while (i >= 0) {
          if (p < 8) {
            d = (self[i] & ((1 << p) - 1)) << (8 - p)
            d |= self[--i] >> (p += self.DB - 8)
          } else {
            d = (self[i] >> (p -= 8)) & 0xff
            if (p <= 0) {
              p += self.DB
              --i
            }
          }
          if ((d & 0x80) != 0) d |= -256
          if (k === 0 && (self.s & 0x80) != (d & 0x80))++k
          if (k > 0 || d != self.s) r[k++] = d
        }
      }
      return r
    }
    
    function bnEquals(a) {
      return (this.compareTo(a) == 0)
    }
    
    function bnMin(a) {
      return (this.compareTo(a) < 0) ? this : a
    }
    
    function bnMax(a) {
      return (this.compareTo(a) > 0) ? this : a
    }
    
    // (protected) r = this op a (bitwise)
    function bnpBitwiseTo(a, op, r) {
      var self = this
      var i, f, m = Math.min(a.t, self.t)
      for (i = 0; i < m; ++i) r[i] = op(self[i], a[i])
      if (a.t < self.t) {
        f = a.s & self.DM
        for (i = m; i < self.t; ++i) r[i] = op(self[i], f)
        r.t = self.t
      } else {
        f = self.s & self.DM
        for (i = m; i < a.t; ++i) r[i] = op(f, a[i])
        r.t = a.t
      }
      r.s = op(self.s, a.s)
      r.clamp()
    }
    
    // (public) this & a
    function op_and(x, y) {
      return x & y
    }
    
    function bnAnd(a) {
      var r = new BigInteger()
      this.bitwiseTo(a, op_and, r)
      return r
    }
    
    // (public) this | a
    function op_or(x, y) {
      return x | y
    }
    
    function bnOr(a) {
      var r = new BigInteger()
      this.bitwiseTo(a, op_or, r)
      return r
    }
    
    // (public) this ^ a
    function op_xor(x, y) {
      return x ^ y
    }
    
    function bnXor(a) {
      var r = new BigInteger()
      this.bitwiseTo(a, op_xor, r)
      return r
    }
    
    // (public) this & ~a
    function op_andnot(x, y) {
      return x & ~y
    }
    
    function bnAndNot(a) {
      var r = new BigInteger()
      this.bitwiseTo(a, op_andnot, r)
      return r
    }
    
    // (public) ~this
    function bnNot() {
      var r = new BigInteger()
      for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i]
      r.t = this.t
      r.s = ~this.s
      return r
    }
    
    // (public) this << n
    function bnShiftLeft(n) {
      var r = new BigInteger()
      if (n < 0) this.rShiftTo(-n, r)
      else this.lShiftTo(n, r)
      return r
    }
    
    // (public) this >> n
    function bnShiftRight(n) {
      var r = new BigInteger()
      if (n < 0) this.lShiftTo(-n, r)
      else this.rShiftTo(n, r)
      return r
    }
    
    // return index of lowest 1-bit in x, x < 2^31
    function lbit(x) {
      if (x == 0) return -1
      var r = 0
      if ((x & 0xffff) == 0) {
        x >>= 16
        r += 16
      }
      if ((x & 0xff) == 0) {
        x >>= 8
        r += 8
      }
      if ((x & 0xf) == 0) {
        x >>= 4
        r += 4
      }
      if ((x & 3) == 0) {
        x >>= 2
        r += 2
      }
      if ((x & 1) == 0)++r
      return r
    }
    
    // (public) returns index of lowest 1-bit (or -1 if none)
    function bnGetLowestSetBit() {
      for (var i = 0; i < this.t; ++i)
        if (this[i] != 0) return i * this.DB + lbit(this[i])
      if (this.s < 0) return this.t * this.DB
      return -1
    }
    
    // return number of 1 bits in x
    function cbit(x) {
      var r = 0
      while (x != 0) {
        x &= x - 1
        ++r
      }
      return r
    }
    
    // (public) return number of set bits
    function bnBitCount() {
      var r = 0,
        x = this.s & this.DM
      for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x)
      return r
    }
    
    // (public) true iff nth bit is set
    function bnTestBit(n) {
      var j = Math.floor(n / this.DB)
      if (j >= this.t) return (this.s != 0)
      return ((this[j] & (1 << (n % this.DB))) != 0)
    }
    
    // (protected) this op (1<<n)
    function bnpChangeBit(n, op) {
      var r = BigInteger.ONE.shiftLeft(n)
      this.bitwiseTo(r, op, r)
      return r
    }
    
    // (public) this | (1<<n)
    function bnSetBit(n) {
      return this.changeBit(n, op_or)
    }
    
    // (public) this & ~(1<<n)
    function bnClearBit(n) {
      return this.changeBit(n, op_andnot)
    }
    
    // (public) this ^ (1<<n)
    function bnFlipBit(n) {
      return this.changeBit(n, op_xor)
    }
    
    // (protected) r = this + a
    function bnpAddTo(a, r) {
      var self = this
    
      var i = 0,
        c = 0,
        m = Math.min(a.t, self.t)
      while (i < m) {
        c += self[i] + a[i]
        r[i++] = c & self.DM
        c >>= self.DB
      }
      if (a.t < self.t) {
        c += a.s
        while (i < self.t) {
          c += self[i]
          r[i++] = c & self.DM
          c >>= self.DB
        }
        c += self.s
      } else {
        c += self.s
        while (i < a.t) {
          c += a[i]
          r[i++] = c & self.DM
          c >>= self.DB
        }
        c += a.s
      }
      r.s = (c < 0) ? -1 : 0
      if (c > 0) r[i++] = c
      else if (c < -1) r[i++] = self.DV + c
      r.t = i
      r.clamp()
    }
    
    // (public) this + a
    function bnAdd(a) {
      var r = new BigInteger()
      this.addTo(a, r)
      return r
    }
    
    // (public) this - a
    function bnSubtract(a) {
      var r = new BigInteger()
      this.subTo(a, r)
      return r
    }
    
    // (public) this * a
    function bnMultiply(a) {
      var r = new BigInteger()
      this.multiplyTo(a, r)
      return r
    }
    
    // (public) this^2
    function bnSquare() {
      var r = new BigInteger()
      this.squareTo(r)
      return r
    }
    
    // (public) this / a
    function bnDivide(a) {
      var r = new BigInteger()
      this.divRemTo(a, r, null)
      return r
    }
    
    // (public) this % a
    function bnRemainder(a) {
      var r = new BigInteger()
      this.divRemTo(a, null, r)
      return r
    }
    
    // (public) [this/a,this%a]
    function bnDivideAndRemainder(a) {
      var q = new BigInteger(),
        r = new BigInteger()
      this.divRemTo(a, q, r)
      return new Array(q, r)
    }
    
    // (protected) this *= n, this >= 0, 1 < n < DV
    function bnpDMultiply(n) {
      this[this.t] = this.am(0, n - 1, this, 0, 0, this.t)
      ++this.t
      this.clamp()
    }
    
    // (protected) this += n << w words, this >= 0
    function bnpDAddOffset(n, w) {
      if (n == 0) return
      while (this.t <= w) this[this.t++] = 0
      this[w] += n
      while (this[w] >= this.DV) {
        this[w] -= this.DV
        if (++w >= this.t) this[this.t++] = 0
        ++this[w]
      }
    }
    
    // A "null" reducer
    function NullExp() {}
    
    function nNop(x) {
      return x
    }
    
    function nMulTo(x, y, r) {
      x.multiplyTo(y, r)
    }
    
    function nSqrTo(x, r) {
      x.squareTo(r)
    }
    
    NullExp.prototype.convert = nNop
    NullExp.prototype.revert = nNop
    NullExp.prototype.mulTo = nMulTo
    NullExp.prototype.sqrTo = nSqrTo
    
    // (public) this^e
    function bnPow(e) {
      return this.exp(e, new NullExp())
    }
    
    // (protected) r = lower n words of "this * a", a.t <= n
    // "this" should be the larger one if appropriate.
    function bnpMultiplyLowerTo(a, n, r) {
      var i = Math.min(this.t + a.t, n)
      r.s = 0; // assumes a,this >= 0
      r.t = i
      while (i > 0) r[--i] = 0
      var j
      for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t)
      for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i)
      r.clamp()
    }
    
    // (protected) r = "this * a" without lower n words, n > 0
    // "this" should be the larger one if appropriate.
    function bnpMultiplyUpperTo(a, n, r) {
      --n
      var i = r.t = this.t + a.t - n
      r.s = 0; // assumes a,this >= 0
      while (--i >= 0) r[i] = 0
      for (i = Math.max(n - this.t, 0); i < a.t; ++i)
        r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n)
      r.clamp()
      r.drShiftTo(1, r)
    }
    
    // Barrett modular reduction
    function Barrett(m) {
      // setup Barrett
      this.r2 = new BigInteger()
      this.q3 = new BigInteger()
      BigInteger.ONE.dlShiftTo(2 * m.t, this.r2)
      this.mu = this.r2.divide(m)
      this.m = m
    }
    
    function barrettConvert(x) {
      if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m)
      else if (x.compareTo(this.m) < 0) return x
      else {
        var r = new BigInteger()
        x.copyTo(r)
        this.reduce(r)
        return r
      }
    }
    
    function barrettRevert(x) {
      return x
    }
    
    // x = x mod m (HAC 14.42)
    function barrettReduce(x) {
      var self = this
      x.drShiftTo(self.m.t - 1, self.r2)
      if (x.t > self.m.t + 1) {
        x.t = self.m.t + 1
        x.clamp()
      }
      self.mu.multiplyUpperTo(self.r2, self.m.t + 1, self.q3)
      self.m.multiplyLowerTo(self.q3, self.m.t + 1, self.r2)
      while (x.compareTo(self.r2) < 0) x.dAddOffset(1, self.m.t + 1)
      x.subTo(self.r2, x)
      while (x.compareTo(self.m) >= 0) x.subTo(self.m, x)
    }
    
    // r = x^2 mod m; x != r
    function barrettSqrTo(x, r) {
      x.squareTo(r)
      this.reduce(r)
    }
    
    // r = x*y mod m; x,y != r
    function barrettMulTo(x, y, r) {
      x.multiplyTo(y, r)
      this.reduce(r)
    }
    
    Barrett.prototype.convert = barrettConvert
    Barrett.prototype.revert = barrettRevert
    Barrett.prototype.reduce = barrettReduce
    Barrett.prototype.mulTo = barrettMulTo
    Barrett.prototype.sqrTo = barrettSqrTo
    
    // (public) this^e % m (HAC 14.85)
    function bnModPow(e, m) {
      var i = e.bitLength(),
        k, r = nbv(1),
        z
      if (i <= 0) return r
      else if (i < 18) k = 1
      else if (i < 48) k = 3
      else if (i < 144) k = 4
      else if (i < 768) k = 5
      else k = 6
      if (i < 8)
        z = new Classic(m)
      else if (m.isEven())
        z = new Barrett(m)
      else
        z = new Montgomery(m)
    
      // precomputation
      var g = new Array(),
        n = 3,
        k1 = k - 1,
        km = (1 << k) - 1
      g[1] = z.convert(this)
      if (k > 1) {
        var g2 = new BigInteger()
        z.sqrTo(g[1], g2)
        while (n <= km) {
          g[n] = new BigInteger()
          z.mulTo(g2, g[n - 2], g[n])
          n += 2
        }
      }
    
      var j = e.t - 1,
        w, is1 = true,
        r2 = new BigInteger(),
        t
      i = nbits(e[j]) - 1
      while (j >= 0) {
        if (i >= k1) w = (e[j] >> (i - k1)) & km
        else {
          w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i)
          if (j > 0) w |= e[j - 1] >> (this.DB + i - k1)
        }
    
        n = k
        while ((w & 1) == 0) {
          w >>= 1
          --n
        }
        if ((i -= n) < 0) {
          i += this.DB
          --j
        }
        if (is1) { // ret == 1, don't bother squaring or multiplying it
          g[w].copyTo(r)
          is1 = false
        } else {
          while (n > 1) {
            z.sqrTo(r, r2)
            z.sqrTo(r2, r)
            n -= 2
          }
          if (n > 0) z.sqrTo(r, r2)
          else {
            t = r
            r = r2
            r2 = t
          }
          z.mulTo(r2, g[w], r)
        }
    
        while (j >= 0 && (e[j] & (1 << i)) == 0) {
          z.sqrTo(r, r2)
          t = r
          r = r2
          r2 = t
          if (--i < 0) {
            i = this.DB - 1
            --j
          }
        }
      }
      return z.revert(r)
    }
    
    // (public) gcd(this,a) (HAC 14.54)
    function bnGCD(a) {
      var x = (this.s < 0) ? this.negate() : this.clone()
      var y = (a.s < 0) ? a.negate() : a.clone()
      if (x.compareTo(y) < 0) {
        var t = x
        x = y
        y = t
      }
      var i = x.getLowestSetBit(),
        g = y.getLowestSetBit()
      if (g < 0) return x
      if (i < g) g = i
      if (g > 0) {
        x.rShiftTo(g, x)
        y.rShiftTo(g, y)
      }
      while (x.signum() > 0) {
        if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x)
        if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y)
        if (x.compareTo(y) >= 0) {
          x.subTo(y, x)
          x.rShiftTo(1, x)
        } else {
          y.subTo(x, y)
          y.rShiftTo(1, y)
        }
      }
      if (g > 0) y.lShiftTo(g, y)
      return y
    }
    
    // (protected) this % n, n < 2^26
    function bnpModInt(n) {
      if (n <= 0) return 0
      var d = this.DV % n,
        r = (this.s < 0) ? n - 1 : 0
      if (this.t > 0)
        if (d == 0) r = this[0] % n
        else
          for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n
      return r
    }
    
    // (public) 1/this % m (HAC 14.61)
    function bnModInverse(m) {
      var ac = m.isEven()
      if ((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO
      var u = m.clone(),
        v = this.clone()
      var a = nbv(1),
        b = nbv(0),
        c = nbv(0),
        d = nbv(1)
      while (u.signum() != 0) {
        while (u.isEven()) {
          u.rShiftTo(1, u)
          if (ac) {
            if (!a.isEven() || !b.isEven()) {
              a.addTo(this, a)
              b.subTo(m, b)
            }
            a.rShiftTo(1, a)
          } else if (!b.isEven()) b.subTo(m, b)
          b.rShiftTo(1, b)
        }
        while (v.isEven()) {
          v.rShiftTo(1, v)
          if (ac) {
            if (!c.isEven() || !d.isEven()) {
              c.addTo(this, c)
              d.subTo(m, d)
            }
            c.rShiftTo(1, c)
          } else if (!d.isEven()) d.subTo(m, d)
          d.rShiftTo(1, d)
        }
        if (u.compareTo(v) >= 0) {
          u.subTo(v, u)
          if (ac) a.subTo(c, a)
          b.subTo(d, b)
        } else {
          v.subTo(u, v)
          if (ac) c.subTo(a, c)
          d.subTo(b, d)
        }
      }
      if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO
      if (d.compareTo(m) >= 0) return d.subtract(m)
      if (d.signum() < 0) d.addTo(m, d)
      else return d
      if (d.signum() < 0) return d.add(m)
      else return d
    }
    
    var lowprimes = [
      2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
      73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
      157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233,
      239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317,
      331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419,
      421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503,
      509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607,
      613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701,
      709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811,
      821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911,
      919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
    ]
    
    var lplim = (1 << 26) / lowprimes[lowprimes.length - 1]
    
    // (public) test primality with certainty >= 1-.5^t
    function bnIsProbablePrime(t) {
      var i, x = this.abs()
      if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
        for (i = 0; i < lowprimes.length; ++i)
          if (x[0] == lowprimes[i]) return true
        return false
      }
      if (x.isEven()) return false
      i = 1
      while (i < lowprimes.length) {
        var m = lowprimes[i],
          j = i + 1
        while (j < lowprimes.length && m < lplim) m *= lowprimes[j++]
        m = x.modInt(m)
        while (i < j) if (m % lowprimes[i++] == 0) return false
      }
      return x.millerRabin(t)
    }
    
    // (protected) true if probably prime (HAC 4.24, Miller-Rabin)
    function bnpMillerRabin(t) {
      var n1 = this.subtract(BigInteger.ONE)
      var k = n1.getLowestSetBit()
      if (k <= 0) return false
      var r = n1.shiftRight(k)
      t = (t + 1) >> 1
      if (t > lowprimes.length) t = lowprimes.length
      var a = new BigInteger(null)
      var j, bases = []
      for (var i = 0; i < t; ++i) {
        for (;;) {
          j = lowprimes[Math.floor(Math.random() * lowprimes.length)]
          if (bases.indexOf(j) == -1) break
        }
        bases.push(j)
        a.fromInt(j)
        var y = a.modPow(r, this)
        if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
          var j = 1
          while (j++ < k && y.compareTo(n1) != 0) {
            y = y.modPowInt(2, this)
            if (y.compareTo(BigInteger.ONE) == 0) return false
          }
          if (y.compareTo(n1) != 0) return false
        }
      }
      return true
    }
    
    // protected
    proto.chunkSize = bnpChunkSize
    proto.toRadix = bnpToRadix
    proto.fromRadix = bnpFromRadix
    proto.fromNumber = bnpFromNumber
    proto.bitwiseTo = bnpBitwiseTo
    proto.changeBit = bnpChangeBit
    proto.addTo = bnpAddTo
    proto.dMultiply = bnpDMultiply
    proto.dAddOffset = bnpDAddOffset
    proto.multiplyLowerTo = bnpMultiplyLowerTo
    proto.multiplyUpperTo = bnpMultiplyUpperTo
    proto.modInt = bnpModInt
    proto.millerRabin = bnpMillerRabin
    
    // public
    proto.clone = bnClone
    proto.intValue = bnIntValue
    proto.byteValue = bnByteValue
    proto.shortValue = bnShortValue
    proto.signum = bnSigNum
    proto.toByteArray = bnToByteArray
    proto.equals = bnEquals
    proto.min = bnMin
    proto.max = bnMax
    proto.and = bnAnd
    proto.or = bnOr
    proto.xor = bnXor
    proto.andNot = bnAndNot
    proto.not = bnNot
    proto.shiftLeft = bnShiftLeft
    proto.shiftRight = bnShiftRight
    proto.getLowestSetBit = bnGetLowestSetBit
    proto.bitCount = bnBitCount
    proto.testBit = bnTestBit
    proto.setBit = bnSetBit
    proto.clearBit = bnClearBit
    proto.flipBit = bnFlipBit
    proto.add = bnAdd
    proto.subtract = bnSubtract
    proto.multiply = bnMultiply
    proto.divide = bnDivide
    proto.remainder = bnRemainder
    proto.divideAndRemainder = bnDivideAndRemainder
    proto.modPow = bnModPow
    proto.modInverse = bnModInverse
    proto.pow = bnPow
    proto.gcd = bnGCD
    proto.isProbablePrime = bnIsProbablePrime
    
    // JSBN-specific extension
    proto.square = bnSquare
    
    // constants
    BigInteger.ZERO = nbv(0)
    BigInteger.ONE = nbv(1)
    BigInteger.valueOf = nbv
    
    module.exports = BigInteger
    
  provide("bigi/lib/bigi", module.exports);
}(global));

// pakmanager:bigi/lib/convert
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // FIXME: Kind of a weird way to throw exceptions, consider removing
    var assert = require('assert')
    var BigInteger =  require('bigi/lib/bigi')
    
    /**
     * Turns a byte array into a big integer.
     *
     * This function will interpret a byte array as a big integer in big
     * endian notation.
     */
    BigInteger.fromByteArrayUnsigned = function(byteArray) {
      // BigInteger expects a DER integer conformant byte array
      if (byteArray[0] & 0x80) {
        return new BigInteger([0].concat(byteArray))
      }
    
      return new BigInteger(byteArray)
    }
    
    /**
     * Returns a byte array representation of the big integer.
     *
     * This returns the absolute of the contained value in big endian
     * form. A value of zero results in an empty array.
     */
    BigInteger.prototype.toByteArrayUnsigned = function() {
      var byteArray = this.toByteArray()
      return byteArray[0] === 0 ? byteArray.slice(1) : byteArray
    }
    
    BigInteger.fromDERInteger = function(byteArray) {
      return new BigInteger(byteArray)
    }
    
    /*
     * Converts BigInteger to a DER integer representation.
     *
     * The format for this value uses the most significant bit as a sign
     * bit.  If the most significant bit is already set and the integer is
     * positive, a 0x00 is prepended.
     *
     * Examples:
     *
     *      0 =>     0x00
     *      1 =>     0x01
     *     -1 =>     0xff
     *    127 =>     0x7f
     *   -127 =>     0x81
     *    128 =>   0x0080
     *   -128 =>     0x80
     *    255 =>   0x00ff
     *   -255 =>   0xff01
     *  16300 =>   0x3fac
     * -16300 =>   0xc054
     *  62300 => 0x00f35c
     * -62300 => 0xff0ca4
    */
    BigInteger.prototype.toDERInteger = BigInteger.prototype.toByteArray
    
    BigInteger.fromBuffer = function(buffer) {
      // BigInteger expects a DER integer conformant byte array
      if (buffer[0] & 0x80) {
        var byteArray = Array.prototype.slice.call(buffer)
    
        return new BigInteger([0].concat(byteArray))
      }
    
      return new BigInteger(buffer)
    }
    
    BigInteger.fromHex = function(hex) {
      if (hex === '') return BigInteger.ZERO
    
      assert.equal(hex, hex.match(/^[A-Fa-f0-9]+/), 'Invalid hex string')
      assert.equal(hex.length % 2, 0, 'Incomplete hex')
      return new BigInteger(hex, 16)
    }
    
    BigInteger.prototype.toBuffer = function(size) {
      var byteArray = this.toByteArrayUnsigned()
      var zeros = []
    
      var padding = size - byteArray.length
      while (zeros.length < padding) zeros.push(0)
    
      return new Buffer(zeros.concat(byteArray))
    }
    
    BigInteger.prototype.toHex = function(size) {
      return this.toBuffer(size).toString('hex')
    }
    
  provide("bigi/lib/convert", module.exports);
}(global));

// pakmanager:bigi
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var BigInteger =  require('bigi/lib/bigi')
    
    //addons
     require('bigi/lib/convert')
    
    module.exports = BigInteger
  provide("bigi", module.exports);
}(global));

// pakmanager:bs58check
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  'use strict'
    
    var base58 = require('bs58')
    var createHash = require('create-hash')
    
    // SHA256(SHA256(buffer))
    function sha256x2 (buffer) {
      buffer = createHash('sha256').update(buffer).digest()
      return createHash('sha256').update(buffer).digest()
    }
    
    // Encode a buffer as a base58-check encoded string
    function encode (payload) {
      var checksum = sha256x2(payload).slice(0, 4)
    
      return base58.encode(Buffer.concat([
        payload,
        checksum
      ]))
    }
    
    // Decode a base58-check encoded string to a buffer
    function decode (string) {
      var buffer = new Buffer(base58.decode(string))
    
      var payload = buffer.slice(0, -4)
      var checksum = buffer.slice(-4)
      var newChecksum = sha256x2(payload).slice(0, 4)
    
      for (var i = 0; i < newChecksum.length; ++i) {
        if (newChecksum[i] === checksum[i]) continue
    
        throw new Error('Invalid checksum')
      }
    
      return payload
    }
    
    module.exports = {
      encode: encode,
      decode: decode
    }
    
  provide("bs58check", module.exports);
}(global));

// pakmanager:create-hmac
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = require('crypto').createHmac;
  provide("create-hmac", module.exports);
}(global));

// pakmanager:ecurve/lib/point
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var BigInteger = require('bigi')
    
    var THREE = BigInteger.valueOf(3)
    
    function Point(curve, x, y, z) {
      assert.notStrictEqual(z, undefined, 'Missing Z coordinate')
    
      this.curve = curve
      this.x = x
      this.y = y
      this.z = z
      this._zInv = null
    
      this.compressed = true
    }
    
    Object.defineProperty(Point.prototype, 'zInv', {
      get: function() {
        if (this._zInv === null) {
          this._zInv = this.z.modInverse(this.curve.p)
        }
    
        return this._zInv
      }
    })
    
    Object.defineProperty(Point.prototype, 'affineX', {
      get: function() {
        return this.x.multiply(this.zInv).mod(this.curve.p)
      }
    })
    
    Object.defineProperty(Point.prototype, 'affineY', {
      get: function() {
        return this.y.multiply(this.zInv).mod(this.curve.p)
      }
    })
    
    Point.fromAffine = function(curve, x, y) {
      return new Point(curve, x, y, BigInteger.ONE)
    }
    
    Point.prototype.equals = function(other) {
      if (other === this) return true
      if (this.curve.isInfinity(this)) return this.curve.isInfinity(other)
      if (this.curve.isInfinity(other)) return this.curve.isInfinity(this)
    
      // u = Y2 * Z1 - Y1 * Z2
      var u = other.y.multiply(this.z).subtract(this.y.multiply(other.z)).mod(this.curve.p)
    
      if (u.signum() !== 0) return false
    
      // v = X2 * Z1 - X1 * Z2
      var v = other.x.multiply(this.z).subtract(this.x.multiply(other.z)).mod(this.curve.p)
    
      return v.signum() === 0
    }
    
    Point.prototype.negate = function() {
      var y = this.curve.p.subtract(this.y)
    
      return new Point(this.curve, this.x, y, this.z)
    }
    
    Point.prototype.add = function(b) {
      if (this.curve.isInfinity(this)) return b
      if (this.curve.isInfinity(b)) return this
    
      var x1 = this.x
      var y1 = this.y
      var x2 = b.x
      var y2 = b.y
    
      // u = Y2 * Z1 - Y1 * Z2
      var u = y2.multiply(this.z).subtract(y1.multiply(b.z)).mod(this.curve.p)
      // v = X2 * Z1 - X1 * Z2
      var v = x2.multiply(this.z).subtract(x1.multiply(b.z)).mod(this.curve.p)
    
      if (v.signum() === 0) {
        if (u.signum() === 0) {
          return this.twice() // this == b, so double
        }
    
        return this.curve.infinity // this = -b, so infinity
      }
    
      var v2 = v.square()
      var v3 = v2.multiply(v)
      var x1v2 = x1.multiply(v2)
      var zu2 = u.square().multiply(this.z)
    
      // x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
      var x3 = zu2.subtract(x1v2.shiftLeft(1)).multiply(b.z).subtract(v3).multiply(v).mod(this.curve.p)
      // y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
      var y3 = x1v2.multiply(THREE).multiply(u).subtract(y1.multiply(v3)).subtract(zu2.multiply(u)).multiply(b.z).add(u.multiply(v3)).mod(this.curve.p)
      // z3 = v^3 * z1 * z2
      var z3 = v3.multiply(this.z).multiply(b.z).mod(this.curve.p)
    
      return new Point(this.curve, x3, y3, z3)
    }
    
    Point.prototype.twice = function() {
      if (this.curve.isInfinity(this)) return this
      if (this.y.signum() === 0) return this.curve.infinity
    
      var x1 = this.x
      var y1 = this.y
    
      var y1z1 = y1.multiply(this.z)
      var y1sqz1 = y1z1.multiply(y1).mod(this.curve.p)
      var a = this.curve.a
    
      // w = 3 * x1^2 + a * z1^2
      var w = x1.square().multiply(THREE)
    
      if (a.signum() !== 0) {
        w = w.add(this.z.square().multiply(a))
      }
    
      w = w.mod(this.curve.p)
      // x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
      var x3 = w.square().subtract(x1.shiftLeft(3).multiply(y1sqz1)).shiftLeft(1).multiply(y1z1).mod(this.curve.p)
      // y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
      var y3 = w.multiply(THREE).multiply(x1).subtract(y1sqz1.shiftLeft(1)).shiftLeft(2).multiply(y1sqz1).subtract(w.pow(3)).mod(this.curve.p)
      // z3 = 8 * (y1 * z1)^3
      var z3 = y1z1.pow(3).shiftLeft(3).mod(this.curve.p)
    
      return new Point(this.curve, x3, y3, z3)
    }
    
    // Simple NAF (Non-Adjacent Form) multiplication algorithm
    // TODO: modularize the multiplication algorithm
    Point.prototype.multiply = function(k) {
      if (this.curve.isInfinity(this)) return this
      if (k.signum() === 0) return this.curve.infinity
    
      var e = k
      var h = e.multiply(THREE)
    
      var neg = this.negate()
      var R = this
    
      for (var i = h.bitLength() - 2; i > 0; --i) {
        R = R.twice()
    
        var hBit = h.testBit(i)
        var eBit = e.testBit(i)
    
        if (hBit != eBit) {
          R = R.add(hBit ? this : neg)
        }
      }
    
      return R
    }
    
    // Compute this*j + x*k (simultaneous multiplication)
    Point.prototype.multiplyTwo = function(j, x, k) {
      var i
    
      if (j.bitLength() > k.bitLength())
        i = j.bitLength() - 1
      else
        i = k.bitLength() - 1
    
      var R = this.curve.infinity
      var both = this.add(x)
    
      while (i >= 0) {
        R = R.twice()
    
        var jBit = j.testBit(i)
        var kBit = k.testBit(i)
    
        if (jBit) {
          if (kBit) {
            R = R.add(both)
    
          } else {
            R = R.add(this)
          }
    
        } else {
          if (kBit) {
            R = R.add(x)
          }
        }
        --i
      }
    
      return R
    }
    
    Point.prototype.getEncoded = function(compressed) {
      if (compressed == undefined) compressed = this.compressed
      if (this.curve.isInfinity(this)) return new Buffer('00', 'hex') // Infinity point encoded is simply '00'
    
      var x = this.affineX
      var y = this.affineY
    
      var buffer
    
      // Determine size of q in bytes
      var byteLength = Math.floor((this.curve.p.bitLength() + 7) / 8)
    
      // 0x02/0x03 | X
      if (compressed) {
        buffer = new Buffer(1 + byteLength)
        buffer.writeUInt8(y.isEven() ? 0x02 : 0x03, 0)
    
      // 0x04 | X | Y
      } else {
        buffer = new Buffer(1 + byteLength + byteLength)
        buffer.writeUInt8(0x04, 0)
    
        y.toBuffer(byteLength).copy(buffer, 1 + byteLength)
      }
    
      x.toBuffer(byteLength).copy(buffer, 1)
    
      return buffer
    }
    
    Point.decodeFrom = function(curve, buffer) {
      var type = buffer.readUInt8(0)
      var compressed = (type !== 4)
    
      var byteLength = Math.floor((curve.p.bitLength() + 7) / 8)
      var x = BigInteger.fromBuffer(buffer.slice(1, 1 + byteLength))
    
      var Q
      if (compressed) {
        assert.equal(buffer.length, byteLength + 1, 'Invalid sequence length')
        assert(type === 0x02 || type === 0x03, 'Invalid sequence tag')
    
        var isOdd = (type === 0x03)
        Q = curve.pointFromX(isOdd, x)
    
      } else {
        assert.equal(buffer.length, 1 + byteLength + byteLength, 'Invalid sequence length')
    
        var y = BigInteger.fromBuffer(buffer.slice(1 + byteLength))
        Q = Point.fromAffine(curve, x, y)
      }
    
      Q.compressed = compressed
      return Q
    }
    
    Point.prototype.toString = function () {
      if (this.curve.isInfinity(this)) return '(INFINITY)'
    
      return '(' + this.affineX.toString() + ',' + this.affineY.toString() + ')'
    }
    
    module.exports = Point
    
  provide("ecurve/lib/point", module.exports);
}(global));

// pakmanager:ecurve/lib/curve
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var BigInteger = require('bigi')
    
    var Point =  require('ecurve/lib/point')
    
    function Curve(p, a, b, Gx, Gy, n, h) {
      this.p = p
      this.a = a
      this.b = b
      this.G = Point.fromAffine(this, Gx, Gy)
      this.n = n
      this.h = h
    
      this.infinity = new Point(this, null, null, BigInteger.ZERO)
    
      // result caching
      this.pOverFour = p.add(BigInteger.ONE).shiftRight(2)
    }
    
    Curve.prototype.pointFromX = function(isOdd, x) {
      var alpha = x.pow(3).add(this.a.multiply(x)).add(this.b).mod(this.p)
      var beta = alpha.modPow(this.pOverFour, this.p) // XXX: not compatible with all curves
    
      var y = beta
      if (beta.isEven() ^ !isOdd) {
        y = this.p.subtract(y) // -y % p
      }
    
      return Point.fromAffine(this, x, y)
    }
    
    Curve.prototype.isInfinity = function(Q) {
      if (Q === this.infinity) return true
    
      return Q.z.signum() === 0 && Q.y.signum() !== 0
    }
    
    Curve.prototype.isOnCurve = function(Q) {
      if (this.isInfinity(Q)) return true
    
      var x = Q.affineX
      var y = Q.affineY
      var a = this.a
      var b = this.b
      var p = this.p
    
      // Check that xQ and yQ are integers in the interval [0, p - 1]
      if (x.signum() < 0 || x.compareTo(p) >= 0) return false
      if (y.signum() < 0 || y.compareTo(p) >= 0) return false
    
      // and check that y^2 = x^3 + ax + b (mod p)
      var lhs = y.square().mod(p)
      var rhs = x.pow(3).add(a.multiply(x)).add(b).mod(p)
      return lhs.equals(rhs)
    }
    
    /**
     * Validate an elliptic curve point.
     *
     * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
     */
    Curve.prototype.validate = function(Q) {
      // Check Q != O
      assert(!this.isInfinity(Q), 'Point is at infinity')
      assert(this.isOnCurve(Q), 'Point is not on the curve')
    
      // Check nQ = O (where Q is a scalar multiple of G)
      var nQ = Q.multiply(this.n)
      assert(this.isInfinity(nQ), 'Point is not a scalar multiple of G')
    
      return true
    }
    
    module.exports = Curve
    
  provide("ecurve/lib/curve", module.exports);
}(global));

// pakmanager:ecurve/lib/names
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var BigInteger = require('bigi')
    
    var curves = require('./curves')
    var Curve =  require('ecurve/lib/curve')
    
    function getCurveByName(name) {
      var curve = curves[name]
      if (!curve) return null
    
      var p = new BigInteger(curve.p, 16)
      var a = new BigInteger(curve.a, 16)
      var b = new BigInteger(curve.b, 16)
      var n = new BigInteger(curve.n, 16)
      var h = new BigInteger(curve.h, 16)
      var Gx = new BigInteger(curve.Gx, 16)
      var Gy = new BigInteger(curve.Gy, 16)
    
      return new Curve(p, a, b, Gx, Gy, n, h)
    }
    
    module.exports = getCurveByName
    
  provide("ecurve/lib/names", module.exports);
}(global));

// pakmanager:ecurve
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var Point =  require('ecurve/lib/point')
    var Curve =  require('ecurve/lib/curve')
    
    var getCurveByName =  require('ecurve/lib/names')
    
    module.exports = {
      Curve: Curve,
      Point: Point,
      getCurveByName: getCurveByName
    }
    
  provide("ecurve", module.exports);
}(global));

// pakmanager:randombytes
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = require('crypto').randomBytes;
  provide("randombytes", module.exports);
}(global));

// pakmanager:typeforce
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  function getName (value) {
      if (value === undefined) return ''
      if (value === null) return ''
    //  if (value.constructor.name !== undefined) return fn.name
    
      // why not constructor.name: https://kangax.github.io/compat-table/es6/#function_name_property
      return value.constructor.toString().match(/function (.*?)\s*\(/)[1]
    }
    
    module.exports = function enforce (type, value, strict) {
      var typeName = type
    
      if (typeof type === 'string') {
        if (type[0] === '?') {
          if (value === undefined || value === null) {
            return
          }
    
          type = type.slice(1)
        }
      }
    
      switch (type) {
        case 'Array': {
          if (value !== null && value !== undefined && value.constructor === Array) return
          break
        }
    
        case 'Boolean': {
          if (typeof value === 'boolean') return
          break
        }
    
        case 'Buffer': {
          if (Buffer.isBuffer(value)) return
          break
        }
    
        case 'Function': {
          if (typeof value === 'function') return
          break
        }
    
        case 'Number': {
          if (typeof value === 'number') return
          break
        }
    
        case 'Object': {
          if (typeof value === 'object') return
          break
        }
    
        case 'String': {
          if (typeof value === 'string') return
          break
        }
    
        default: {
          switch (typeof type) {
            case 'string': {
              if (type === getName(value)) return
              break
            }
    
            // evaluate type templates
            case 'object': {
              if (Array.isArray(type)) {
                var subType = type[0]
    
                enforce('Array', value)
                value.forEach(function (x) {
                  enforce(subType, x, strict)
                })
    
                return
              }
    
              enforce('Object', value)
              var propertyNames = strict ? value : type
    
              for (var propertyName in propertyNames) {
                var propertyType = type[propertyName]
                var propertyValue = value[propertyName]
    
                if (!propertyType) {
                  throw new TypeError('Unexpected property "' + propertyName + '"')
                }
    
                try {
                  enforce(propertyType, propertyValue, strict)
                } catch (e) {
                  throw new TypeError('Expected property "' + propertyName + '" of type ' + JSON.stringify(propertyType) + ', got ' + getName(propertyValue) + ' ' + propertyValue)
                }
              }
    
              return
            }
          }
        }
      }
    
      throw new TypeError('Expected ' + typeName + ', got ' + getName(value) + ' ' + value)
    }
    
  provide("typeforce", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/opcodes
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = {
      // push value
      OP_FALSE: 0,
      OP_0: 0,
      OP_PUSHDATA1: 76,
      OP_PUSHDATA2: 77,
      OP_PUSHDATA4: 78,
      OP_1NEGATE: 79,
      OP_RESERVED: 80,
      OP_1: 81,
      OP_TRUE: 81,
      OP_2: 82,
      OP_3: 83,
      OP_4: 84,
      OP_5: 85,
      OP_6: 86,
      OP_7: 87,
      OP_8: 88,
      OP_9: 89,
      OP_10: 90,
      OP_11: 91,
      OP_12: 92,
      OP_13: 93,
      OP_14: 94,
      OP_15: 95,
      OP_16: 96,
    
      // control
      OP_NOP: 97,
      OP_VER: 98,
      OP_IF: 99,
      OP_NOTIF: 100,
      OP_VERIF: 101,
      OP_VERNOTIF: 102,
      OP_ELSE: 103,
      OP_ENDIF: 104,
      OP_VERIFY: 105,
      OP_RETURN: 106,
    
      // stack ops
      OP_TOALTSTACK: 107,
      OP_FROMALTSTACK: 108,
      OP_2DROP: 109,
      OP_2DUP: 110,
      OP_3DUP: 111,
      OP_2OVER: 112,
      OP_2ROT: 113,
      OP_2SWAP: 114,
      OP_IFDUP: 115,
      OP_DEPTH: 116,
      OP_DROP: 117,
      OP_DUP: 118,
      OP_NIP: 119,
      OP_OVER: 120,
      OP_PICK: 121,
      OP_ROLL: 122,
      OP_ROT: 123,
      OP_SWAP: 124,
      OP_TUCK: 125,
    
      // splice ops
      OP_CAT: 126,
      OP_SUBSTR: 127,
      OP_LEFT: 128,
      OP_RIGHT: 129,
      OP_SIZE: 130,
    
      // bit logic
      OP_INVERT: 131,
      OP_AND: 132,
      OP_OR: 133,
      OP_XOR: 134,
      OP_EQUAL: 135,
      OP_EQUALVERIFY: 136,
      OP_RESERVED1: 137,
      OP_RESERVED2: 138,
    
      // numeric
      OP_1ADD: 139,
      OP_1SUB: 140,
      OP_2MUL: 141,
      OP_2DIV: 142,
      OP_NEGATE: 143,
      OP_ABS: 144,
      OP_NOT: 145,
      OP_0NOTEQUAL: 146,
    
      OP_ADD: 147,
      OP_SUB: 148,
      OP_MUL: 149,
      OP_DIV: 150,
      OP_MOD: 151,
      OP_LSHIFT: 152,
      OP_RSHIFT: 153,
    
      OP_BOOLAND: 154,
      OP_BOOLOR: 155,
      OP_NUMEQUAL: 156,
      OP_NUMEQUALVERIFY: 157,
      OP_NUMNOTEQUAL: 158,
      OP_LESSTHAN: 159,
      OP_GREATERTHAN: 160,
      OP_LESSTHANOREQUAL: 161,
      OP_GREATERTHANOREQUAL: 162,
      OP_MIN: 163,
      OP_MAX: 164,
    
      OP_WITHIN: 165,
    
      // crypto
      OP_RIPEMD160: 166,
      OP_SHA1: 167,
      OP_SHA256: 168,
      OP_HASH160: 169,
      OP_HASH256: 170,
      OP_CODESEPARATOR: 171,
      OP_CHECKSIG: 172,
      OP_CHECKSIGVERIFY: 173,
      OP_CHECKMULTISIG: 174,
      OP_CHECKMULTISIGVERIFY: 175,
    
      // expansion
      OP_NOP1: 176,
      OP_NOP2: 177,
      OP_NOP3: 178,
      OP_NOP4: 179,
      OP_NOP5: 180,
      OP_NOP6: 181,
      OP_NOP7: 182,
      OP_NOP8: 183,
      OP_NOP9: 184,
      OP_NOP10: 185,
    
      // template matching params
      OP_PUBKEYHASH: 253,
      OP_PUBKEY: 254,
      OP_INVALIDOPCODE: 255
    }
    
  provide("potcoinjs-lib/src/opcodes", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/bufferutils
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var opcodes =  require('potcoinjs-lib/src/opcodes')
    
    // https://github.com/feross/buffer/blob/master/index.js#L1127
    function verifuint (value, max) {
      assert(typeof value === 'number', 'cannot write a non-number as a number')
      assert(value >= 0, 'specified a negative value for writing an unsigned value')
      assert(value <= max, 'value is larger than maximum value for type')
      assert(Math.floor(value) === value, 'value has a fractional component')
    }
    
    function pushDataSize (i) {
      return i < opcodes.OP_PUSHDATA1 ? 1
      : i < 0xff ? 2
      : i < 0xffff ? 3
      : 5
    }
    
    function readPushDataInt (buffer, offset) {
      var opcode = buffer.readUInt8(offset)
      var number, size
    
      // ~6 bit
      if (opcode < opcodes.OP_PUSHDATA1) {
        number = opcode
        size = 1
    
      // 8 bit
      } else if (opcode === opcodes.OP_PUSHDATA1) {
        if (offset + 2 > buffer.length) return null
        number = buffer.readUInt8(offset + 1)
        size = 2
    
      // 16 bit
      } else if (opcode === opcodes.OP_PUSHDATA2) {
        if (offset + 3 > buffer.length) return null
        number = buffer.readUInt16LE(offset + 1)
        size = 3
    
      // 32 bit
      } else {
        if (offset + 5 > buffer.length) return null
        assert.equal(opcode, opcodes.OP_PUSHDATA4, 'Unexpected opcode')
    
        number = buffer.readUInt32LE(offset + 1)
        size = 5
      }
    
      return {
        opcode: opcode,
        number: number,
        size: size
      }
    }
    
    function readUInt64LE (buffer, offset) {
      var a = buffer.readUInt32LE(offset)
      var b = buffer.readUInt32LE(offset + 4)
      b *= 0x100000000
    
      verifuint(b + a, 0x001fffffffffffff)
    
      return b + a
    }
    
    function readVarInt (buffer, offset) {
      var t = buffer.readUInt8(offset)
      var number, size
    
      // 8 bit
      if (t < 253) {
        number = t
        size = 1
    
      // 16 bit
      } else if (t < 254) {
        number = buffer.readUInt16LE(offset + 1)
        size = 3
    
      // 32 bit
      } else if (t < 255) {
        number = buffer.readUInt32LE(offset + 1)
        size = 5
    
      // 64 bit
      } else {
        number = readUInt64LE(buffer, offset + 1)
        size = 9
      }
    
      return {
        number: number,
        size: size
      }
    }
    
    function writePushDataInt (buffer, number, offset) {
      var size = pushDataSize(number)
    
      // ~6 bit
      if (size === 1) {
        buffer.writeUInt8(number, offset)
    
      // 8 bit
      } else if (size === 2) {
        buffer.writeUInt8(opcodes.OP_PUSHDATA1, offset)
        buffer.writeUInt8(number, offset + 1)
    
      // 16 bit
      } else if (size === 3) {
        buffer.writeUInt8(opcodes.OP_PUSHDATA2, offset)
        buffer.writeUInt16LE(number, offset + 1)
    
      // 32 bit
      } else {
        buffer.writeUInt8(opcodes.OP_PUSHDATA4, offset)
        buffer.writeUInt32LE(number, offset + 1)
      }
    
      return size
    }
    
    function writeUInt64LE (buffer, value, offset) {
      verifuint(value, 0x001fffffffffffff)
    
      buffer.writeInt32LE(value & -1, offset)
      buffer.writeUInt32LE(Math.floor(value / 0x100000000), offset + 4)
    }
    
    function varIntSize (i) {
      return i < 253 ? 1
      : i < 0x10000 ? 3
      : i < 0x100000000 ? 5
      : 9
    }
    
    function writeVarInt (buffer, number, offset) {
      var size = varIntSize(number)
    
      // 8 bit
      if (size === 1) {
        buffer.writeUInt8(number, offset)
    
      // 16 bit
      } else if (size === 3) {
        buffer.writeUInt8(253, offset)
        buffer.writeUInt16LE(number, offset + 1)
    
      // 32 bit
      } else if (size === 5) {
        buffer.writeUInt8(254, offset)
        buffer.writeUInt32LE(number, offset + 1)
    
      // 64 bit
      } else {
        buffer.writeUInt8(255, offset)
        writeUInt64LE(buffer, number, offset + 1)
      }
    
      return size
    }
    
    function varIntBuffer (i) {
      var size = varIntSize(i)
      var buffer = new Buffer(size)
      writeVarInt(buffer, i, 0)
    
      return buffer
    }
    
    function reverse (buffer) {
      var buffer2 = new Buffer(buffer)
      Array.prototype.reverse.call(buffer2)
      return buffer2
    }
    
    module.exports = {
      pushDataSize: pushDataSize,
      readPushDataInt: readPushDataInt,
      readUInt64LE: readUInt64LE,
      readVarInt: readVarInt,
      reverse: reverse,
      varIntBuffer: varIntBuffer,
      varIntSize: varIntSize,
      writePushDataInt: writePushDataInt,
      writeUInt64LE: writeUInt64LE,
      writeVarInt: writeVarInt
    }
    
  provide("potcoinjs-lib/src/bufferutils", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/crypto
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var createHash = require('create-hash')
    
    function hash160 (buffer) {
      return ripemd160(sha256(buffer))
    }
    
    function hash256 (buffer) {
      return sha256(sha256(buffer))
    }
    
    function ripemd160 (buffer) {
      return createHash('rmd160').update(buffer).digest()
    }
    
    function sha1 (buffer) {
      return createHash('sha1').update(buffer).digest()
    }
    
    function sha256 (buffer) {
      return createHash('sha256').update(buffer).digest()
    }
    
    // FIXME: Name not consistent with others
    var createHmac = require('create-hmac')
    
    function HmacSHA256 (buffer, secret) {
      console.warn('Hmac* functions are deprecated for removal in 2.0.0, use node crypto instead')
      return createHmac('sha256', secret).update(buffer).digest()
    }
    
    function HmacSHA512 (buffer, secret) {
      console.warn('Hmac* functions are deprecated for removal in 2.0.0, use node crypto instead')
      return createHmac('sha512', secret).update(buffer).digest()
    }
    
    module.exports = {
      ripemd160: ripemd160,
      sha1: sha1,
      sha256: sha256,
      hash160: hash160,
      hash256: hash256,
      HmacSHA256: HmacSHA256,
      HmacSHA512: HmacSHA512
    }
    
  provide("potcoinjs-lib/src/crypto", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/ecsignature
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var typeForce = require('typeforce')
    
    var BigInteger = require('bigi')
    
    function ECSignature (r, s) {
      typeForce('BigInteger', r)
      typeForce('BigInteger', s)
    
      this.r = r
      this.s = s
    }
    
    ECSignature.parseCompact = function (buffer) {
      assert.equal(buffer.length, 65, 'Invalid signature length')
      var i = buffer.readUInt8(0) - 27
    
      // At most 3 bits
      assert.equal(i, i & 7, 'Invalid signature parameter')
      var compressed = !!(i & 4)
    
      // Recovery param only
      i = i & 3
    
      var r = BigInteger.fromBuffer(buffer.slice(1, 33))
      var s = BigInteger.fromBuffer(buffer.slice(33))
    
      return {
        compressed: compressed,
        i: i,
        signature: new ECSignature(r, s)
      }
    }
    
    ECSignature.fromDER = function (buffer) {
      assert.equal(buffer.readUInt8(0), 0x30, 'Not a DER sequence')
      assert.equal(buffer.readUInt8(1), buffer.length - 2, 'Invalid sequence length')
      assert.equal(buffer.readUInt8(2), 0x02, 'Expected a DER integer')
    
      var rLen = buffer.readUInt8(3)
      assert(rLen > 0, 'R length is zero')
    
      var offset = 4 + rLen
      assert.equal(buffer.readUInt8(offset), 0x02, 'Expected a DER integer (2)')
    
      var sLen = buffer.readUInt8(offset + 1)
      assert(sLen > 0, 'S length is zero')
    
      var rB = buffer.slice(4, offset)
      var sB = buffer.slice(offset + 2)
      offset += 2 + sLen
    
      if (rLen > 1 && rB.readUInt8(0) === 0x00) {
        assert(rB.readUInt8(1) & 0x80, 'R value excessively padded')
      }
    
      if (sLen > 1 && sB.readUInt8(0) === 0x00) {
        assert(sB.readUInt8(1) & 0x80, 'S value excessively padded')
      }
    
      assert.equal(offset, buffer.length, 'Invalid DER encoding')
      var r = BigInteger.fromDERInteger(rB)
      var s = BigInteger.fromDERInteger(sB)
    
      assert(r.signum() >= 0, 'R value is negative')
      assert(s.signum() >= 0, 'S value is negative')
    
      return new ECSignature(r, s)
    }
    
    // BIP62: 1 byte hashType flag (only 0x01, 0x02, 0x03, 0x81, 0x82 and 0x83 are allowed)
    ECSignature.parseScriptSignature = function (buffer) {
      var hashType = buffer.readUInt8(buffer.length - 1)
      var hashTypeMod = hashType & ~0x80
    
      assert(hashTypeMod > 0x00 && hashTypeMod < 0x04, 'Invalid hashType ' + hashType)
    
      return {
        signature: ECSignature.fromDER(buffer.slice(0, -1)),
        hashType: hashType
      }
    }
    
    ECSignature.prototype.toCompact = function (i, compressed) {
      if (compressed) {
        i += 4
      }
    
      i += 27
    
      var buffer = new Buffer(65)
      buffer.writeUInt8(i, 0)
    
      this.r.toBuffer(32).copy(buffer, 1)
      this.s.toBuffer(32).copy(buffer, 33)
    
      return buffer
    }
    
    ECSignature.prototype.toDER = function () {
      var rBa = this.r.toDERInteger()
      var sBa = this.s.toDERInteger()
    
      var sequence = []
    
      // INTEGER
      sequence.push(0x02, rBa.length)
      sequence = sequence.concat(rBa)
    
      // INTEGER
      sequence.push(0x02, sBa.length)
      sequence = sequence.concat(sBa)
    
      // SEQUENCE
      sequence.unshift(0x30, sequence.length)
    
      return new Buffer(sequence)
    }
    
    ECSignature.prototype.toScriptSignature = function (hashType) {
      var hashTypeMod = hashType & ~0x80
      assert(hashTypeMod > 0x00 && hashTypeMod < 0x04, 'Invalid hashType ' + hashType)
    
      var hashTypeBuffer = new Buffer(1)
      hashTypeBuffer.writeUInt8(hashType, 0)
    
      return Buffer.concat([this.toDER(), hashTypeBuffer])
    }
    
    module.exports = ECSignature
    
  provide("potcoinjs-lib/src/ecsignature", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/script
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var bufferutils =  require('potcoinjs-lib/src/bufferutils')
    var crypto =  require('potcoinjs-lib/src/crypto')
    var typeForce = require('typeforce')
    var opcodes =  require('potcoinjs-lib/src/opcodes')
    
    function Script (buffer, chunks) {
      typeForce('Buffer', buffer)
      typeForce('Array', chunks)
    
      this.buffer = buffer
      this.chunks = chunks
    }
    
    Script.fromASM = function (asm) {
      var strChunks = asm.split(' ')
      var chunks = strChunks.map(function (strChunk) {
        // opcode
        if (strChunk in opcodes) {
          return opcodes[strChunk]
    
        // data chunk
        } else {
          return new Buffer(strChunk, 'hex')
        }
      })
    
      return Script.fromChunks(chunks)
    }
    
    Script.fromBuffer = function (buffer) {
      var chunks = []
      var i = 0
    
      while (i < buffer.length) {
        var opcode = buffer.readUInt8(i)
    
        // data chunk
        if ((opcode > opcodes.OP_0) && (opcode <= opcodes.OP_PUSHDATA4)) {
          var d = bufferutils.readPushDataInt(buffer, i)
    
          // did reading a pushDataInt fail? return non-chunked script
          if (d === null) return new Script(buffer, [])
          i += d.size
    
          // attempt to read too much data?
          if (i + d.number > buffer.length) return new Script(buffer, [])
    
          var data = buffer.slice(i, i + d.number)
          i += d.number
    
          chunks.push(data)
    
        // opcode
        } else {
          chunks.push(opcode)
    
          i += 1
        }
      }
    
      return new Script(buffer, chunks)
    }
    
    Script.fromChunks = function (chunks) {
      typeForce('Array', chunks)
    
      var bufferSize = chunks.reduce(function (accum, chunk) {
        // data chunk
        if (Buffer.isBuffer(chunk)) {
          return accum + bufferutils.pushDataSize(chunk.length) + chunk.length
        }
    
        // opcode
        return accum + 1
      }, 0.0)
    
      var buffer = new Buffer(bufferSize)
      var offset = 0
    
      chunks.forEach(function (chunk) {
        // data chunk
        if (Buffer.isBuffer(chunk)) {
          offset += bufferutils.writePushDataInt(buffer, chunk.length, offset)
    
          chunk.copy(buffer, offset)
          offset += chunk.length
    
        // opcode
        } else {
          buffer.writeUInt8(chunk, offset)
          offset += 1
        }
      })
    
      assert.equal(offset, buffer.length, 'Could not decode chunks')
      return new Script(buffer, chunks)
    }
    
    Script.fromHex = function (hex) {
      return Script.fromBuffer(new Buffer(hex, 'hex'))
    }
    
    Script.EMPTY = Script.fromChunks([])
    
    Script.prototype.getHash = function () {
      return crypto.hash160(this.buffer)
    }
    
    // FIXME: doesn't work for data chunks, maybe time to use buffertools.compare...
    Script.prototype.without = function (needle) {
      return Script.fromChunks(this.chunks.filter(function (op) {
        return op !== needle
      }))
    }
    
    var reverseOps = []
    for (var op in opcodes) {
      var code = opcodes[op]
      reverseOps[code] = op
    }
    
    Script.prototype.toASM = function () {
      return this.chunks.map(function (chunk) {
        // data chunk
        if (Buffer.isBuffer(chunk)) {
          return chunk.toString('hex')
    
        // opcode
        } else {
          return reverseOps[chunk]
        }
      }).join(' ')
    }
    
    Script.prototype.toBuffer = function () {
      return this.buffer
    }
    
    Script.prototype.toHex = function () {
      return this.toBuffer().toString('hex')
    }
    
    module.exports = Script
    
  provide("potcoinjs-lib/src/script", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/networks
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // https://en.bitcoin.it/wiki/List_of_address_prefixes
    
    var networks = {
      potcoin: {
        magicPrefix: '\x18Potcoin Signed Message:\n',
        bip32: {
          public: 0x213045C1, // Ppub
          private: 0x213045C0 // Pprv
        },
        pubKeyHash: 0x38, //0xfd, // https://github.com/potcoin/potcoin/blob/master/src/script.h#L206
        scriptHash: 0x05,
        wif: 0xB7,
        dustThreshold: 0,
        dustSoftThreshold: 100000,
        feePerKb: 100000, // https://github.com/potcoin/potcoin/blob/master/src/main.cpp#L53
        estimateFee: estimateFee('potcoin')
      }
    }
    
    function estimateFee (type) {
      return function (tx) {
        var network = networks[type]
        var baseFee = network.feePerKb
        var byteSize = tx.toBuffer().length
    
        var fee = baseFee * Math.ceil(byteSize / 1000)
        if (network.dustSoftThreshold === undefined) return fee
    
        tx.outs.forEach(function (e) {
          if (e.value < network.dustSoftThreshold) {
            fee += baseFee
          }
        })
    
        return fee
      }
    }
    
    module.exports = networks
    
  provide("potcoinjs-lib/src/networks", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/scripts
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var ops =  require('potcoinjs-lib/src/opcodes')
    var typeForce = require('typeforce')
    
    var ecurve = require('ecurve')
    var curve = ecurve.getCurveByName('secp256k1')
    
    var ECSignature =  require('potcoinjs-lib/src/ecsignature')
    var Script =  require('potcoinjs-lib/src/script')
    
    function isCanonicalPubKey (buffer) {
      if (!Buffer.isBuffer(buffer)) return false
    
      try {
        ecurve.Point.decodeFrom(curve, buffer)
      } catch (e) {
        if (!(e.message.match(/Invalid sequence (length|tag)/)))
          throw e
    
        return false
      }
    
      return true
    }
    
    function isCanonicalSignature (buffer) {
      if (!Buffer.isBuffer(buffer)) return false
    
      try {
        ECSignature.parseScriptSignature(buffer)
      } catch (e) {
        if (!(e.message.match(/Not a DER sequence|Invalid sequence length|Expected a DER integer|R length is zero|S length is zero|R value excessively padded|S value excessively padded|R value is negative|S value is negative|Invalid hashType/))) {
          throw e
        }
    
        return false
      }
    
      return true
    }
    
    function isPubKeyHashInput (script) {
      return script.chunks.length === 2 &&
        isCanonicalSignature(script.chunks[0]) &&
        isCanonicalPubKey(script.chunks[1])
    }
    
    function isPubKeyHashOutput (script) {
      return script.chunks.length === 5 &&
        script.chunks[0] === ops.OP_DUP &&
        script.chunks[1] === ops.OP_HASH160 &&
        Buffer.isBuffer(script.chunks[2]) &&
        script.chunks[2].length === 20 &&
        script.chunks[3] === ops.OP_EQUALVERIFY &&
        script.chunks[4] === ops.OP_CHECKSIG
    }
    
    function isPubKeyInput (script) {
      return script.chunks.length === 1 &&
        isCanonicalSignature(script.chunks[0])
    }
    
    function isPubKeyOutput (script) {
      return script.chunks.length === 2 &&
        isCanonicalPubKey(script.chunks[0]) &&
        script.chunks[1] === ops.OP_CHECKSIG
    }
    
    function isScriptHashInput (script, allowIncomplete) {
      if (script.chunks.length < 2) return false
    
      var lastChunk = script.chunks[script.chunks.length - 1]
      if (!Buffer.isBuffer(lastChunk)) return false
    
      var scriptSig = Script.fromChunks(script.chunks.slice(0, -1))
      var redeemScript = Script.fromBuffer(lastChunk)
    
      // is redeemScript a valid script?
      if (redeemScript.chunks.length === 0) return false
    
      return classifyInput(scriptSig, allowIncomplete) === classifyOutput(redeemScript)
    }
    
    function isScriptHashOutput (script) {
      return script.chunks.length === 3 &&
        script.chunks[0] === ops.OP_HASH160 &&
        Buffer.isBuffer(script.chunks[1]) &&
        script.chunks[1].length === 20 &&
        script.chunks[2] === ops.OP_EQUAL
    }
    
    // allowIncomplete is to account for combining signatures
    // See https://github.com/bitcoin/bitcoin/blob/f425050546644a36b0b8e0eb2f6934a3e0f6f80f/src/script/sign.cpp#L195-L197
    function isMultisigInput (script, allowIncomplete) {
      if (script.chunks.length < 2) return false
      if (script.chunks[0] !== ops.OP_0) return false
    
      if (allowIncomplete) {
        return script.chunks.slice(1).every(function (chunk) {
          return chunk === ops.OP_0 || isCanonicalSignature(chunk)
        })
      }
    
      return script.chunks.slice(1).every(isCanonicalSignature)
    }
    
    function isMultisigOutput (script) {
      if (script.chunks.length < 4) return false
      if (script.chunks[script.chunks.length - 1] !== ops.OP_CHECKMULTISIG) return false
    
      var mOp = script.chunks[0]
      if (mOp === ops.OP_0) return false
      if (mOp < ops.OP_1) return false
      if (mOp > ops.OP_16) return false
    
      var nOp = script.chunks[script.chunks.length - 2]
      if (nOp === ops.OP_0) return false
      if (nOp < ops.OP_1) return false
      if (nOp > ops.OP_16) return false
    
      var m = mOp - (ops.OP_1 - 1)
      var n = nOp - (ops.OP_1 - 1)
      if (n < m) return false
    
      var pubKeys = script.chunks.slice(1, -2)
      if (n < pubKeys.length) return false
    
      return pubKeys.every(isCanonicalPubKey)
    }
    
    function isNullDataOutput (script) {
      return script.chunks[0] === ops.OP_RETURN
    }
    
    function classifyOutput (script) {
      typeForce('Script', script)
    
      if (isPubKeyHashOutput(script)) {
        return 'pubkeyhash'
      } else if (isScriptHashOutput(script)) {
        return 'scripthash'
      } else if (isMultisigOutput(script)) {
        return 'multisig'
      } else if (isPubKeyOutput(script)) {
        return 'pubkey'
      } else if (isNullDataOutput(script)) {
        return 'nulldata'
      }
    
      return 'nonstandard'
    }
    
    function classifyInput (script, allowIncomplete) {
      typeForce('Script', script)
    
      if (isPubKeyHashInput(script)) {
        return 'pubkeyhash'
      } else if (isMultisigInput(script, allowIncomplete)) {
        return 'multisig'
      } else if (isScriptHashInput(script, allowIncomplete)) {
        return 'scripthash'
      } else if (isPubKeyInput(script)) {
        return 'pubkey'
      }
    
      return 'nonstandard'
    }
    
    // Standard Script Templates
    // {pubKey} OP_CHECKSIG
    function pubKeyOutput (pubKey) {
      return Script.fromChunks([
        pubKey.toBuffer(),
        ops.OP_CHECKSIG
      ])
    }
    
    // OP_DUP OP_HASH160 {pubKeyHash} OP_EQUALVERIFY OP_CHECKSIG
    function pubKeyHashOutput (hash) {
      typeForce('Buffer', hash)
    
      return Script.fromChunks([
        ops.OP_DUP,
        ops.OP_HASH160,
        hash,
        ops.OP_EQUALVERIFY,
        ops.OP_CHECKSIG
      ])
    }
    
    // OP_HASH160 {scriptHash} OP_EQUAL
    function scriptHashOutput (hash) {
      typeForce('Buffer', hash)
    
      return Script.fromChunks([
        ops.OP_HASH160,
        hash,
        ops.OP_EQUAL
      ])
    }
    
    // m [pubKeys ...] n OP_CHECKMULTISIG
    function multisigOutput (m, pubKeys) {
      typeForce(['ECPubKey'], pubKeys)
    
      assert(pubKeys.length >= m, 'Not enough pubKeys provided')
    
      var pubKeyBuffers = pubKeys.map(function (pubKey) {
        return pubKey.toBuffer()
      })
      var n = pubKeys.length
    
      return Script.fromChunks([].concat(
        (ops.OP_1 - 1) + m,
        pubKeyBuffers,
        (ops.OP_1 - 1) + n,
        ops.OP_CHECKMULTISIG
      ))
    }
    
    // {signature}
    function pubKeyInput (signature) {
      typeForce('Buffer', signature)
    
      return Script.fromChunks([signature])
    }
    
    // {signature} {pubKey}
    function pubKeyHashInput (signature, pubKey) {
      typeForce('Buffer', signature)
    
      return Script.fromChunks([signature, pubKey.toBuffer()])
    }
    
    // <scriptSig> {serialized scriptPubKey script}
    function scriptHashInput (scriptSig, scriptPubKey) {
      return Script.fromChunks([].concat(
        scriptSig.chunks,
        scriptPubKey.toBuffer()
      ))
    }
    
    // OP_0 [signatures ...]
    function multisigInput (signatures, scriptPubKey) {
      if (scriptPubKey) {
        assert(isMultisigOutput(scriptPubKey))
    
        var mOp = scriptPubKey.chunks[0]
        var nOp = scriptPubKey.chunks[scriptPubKey.chunks.length - 2]
        var m = mOp - (ops.OP_1 - 1)
        var n = nOp - (ops.OP_1 - 1)
    
        assert(signatures.length >= m, 'Not enough signatures provided')
        assert(signatures.length <= n, 'Too many signatures provided')
      }
    
      return Script.fromChunks([].concat(ops.OP_0, signatures))
    }
    
    function nullDataOutput (data) {
      return Script.fromChunks([ops.OP_RETURN, data])
    }
    
    module.exports = {
      isCanonicalPubKey: isCanonicalPubKey,
      isCanonicalSignature: isCanonicalSignature,
      isPubKeyHashInput: isPubKeyHashInput,
      isPubKeyHashOutput: isPubKeyHashOutput,
      isPubKeyInput: isPubKeyInput,
      isPubKeyOutput: isPubKeyOutput,
      isScriptHashInput: isScriptHashInput,
      isScriptHashOutput: isScriptHashOutput,
      isMultisigInput: isMultisigInput,
      isMultisigOutput: isMultisigOutput,
      isNullDataOutput: isNullDataOutput,
      classifyOutput: classifyOutput,
      classifyInput: classifyInput,
      pubKeyOutput: pubKeyOutput,
      pubKeyHashOutput: pubKeyHashOutput,
      scriptHashOutput: scriptHashOutput,
      multisigOutput: multisigOutput,
      pubKeyInput: pubKeyInput,
      pubKeyHashInput: pubKeyHashInput,
      scriptHashInput: scriptHashInput,
      multisigInput: multisigInput,
      dataOutput: function (data) {
        console.warn('dataOutput is deprecated, use nullDataOutput by 2.0.0')
        return nullDataOutput(data)
      },
      nullDataOutput: nullDataOutput
    }
    
  provide("potcoinjs-lib/src/scripts", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/ecdsa
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var createHmac = require('create-hmac')
    var typeForce = require('typeforce')
    
    var BigInteger = require('bigi')
    var ECSignature =  require('potcoinjs-lib/src/ecsignature')
    
    var ZERO = new Buffer([0])
    var ONE = new Buffer([1])
    
    // https://tools.ietf.org/html/rfc6979#section-3.2
    function deterministicGenerateK (curve, hash, d, checkSig) {
      typeForce('Buffer', hash)
      typeForce('BigInteger', d)
    
      // FIXME: remove/uncomment for 2.0.0
      //  typeForce('Function', checkSig)
    
      if (typeof checkSig !== 'function') {
        console.warn('deterministicGenerateK requires a checkSig callback in 2.0.0, see #337 for more information')
    
        checkSig = function (k) {
          var G = curve.G
          var n = curve.n
          var e = BigInteger.fromBuffer(hash)
    
          var Q = G.multiply(k)
    
          if (curve.isInfinity(Q))
            return false
    
          var r = Q.affineX.mod(n)
          if (r.signum() === 0)
            return false
    
          var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n)
          if (s.signum() === 0)
            return false
    
          return true
        }
      }
    
      // sanity check
      assert.equal(hash.length, 32, 'Hash must be 256 bit')
    
      var x = d.toBuffer(32)
      var k = new Buffer(32)
      var v = new Buffer(32)
    
      // Step A, ignored as hash already provided
      // Step B
      v.fill(1)
    
      // Step C
      k.fill(0)
    
      // Step D
      k = createHmac('sha256', k)
        .update(v)
        .update(ZERO)
        .update(x)
        .update(hash)
        .digest()
    
      // Step E
      v = createHmac('sha256', k).update(v).digest()
    
      // Step F
      k = createHmac('sha256', k)
        .update(v)
        .update(ONE)
        .update(x)
        .update(hash)
        .digest()
    
      // Step G
      v = createHmac('sha256', k).update(v).digest()
    
      // Step H1/H2a, ignored as tlen === qlen (256 bit)
      // Step H2b
      v = createHmac('sha256', k).update(v).digest()
    
      var T = BigInteger.fromBuffer(v)
    
      // Step H3, repeat until T is within the interval [1, n - 1] and is suitable for ECDSA
      while ((T.signum() <= 0) || (T.compareTo(curve.n) >= 0) || !checkSig(T)) {
        k = createHmac('sha256', k)
          .update(v)
          .update(ZERO)
          .digest()
    
        v = createHmac('sha256', k).update(v).digest()
    
        // Step H1/H2a, again, ignored as tlen === qlen (256 bit)
        // Step H2b again
        v = createHmac('sha256', k).update(v).digest()
        T = BigInteger.fromBuffer(v)
      }
    
      return T
    }
    
    function sign (curve, hash, d) {
      var r, s
    
      var e = BigInteger.fromBuffer(hash)
      var n = curve.n
      var G = curve.G
    
      deterministicGenerateK(curve, hash, d, function (k) {
        var Q = G.multiply(k)
    
        if (curve.isInfinity(Q))
          return false
    
        r = Q.affineX.mod(n)
        if (r.signum() === 0)
          return false
    
        s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n)
        if (s.signum() === 0)
          return false
    
        return true
      })
    
      var N_OVER_TWO = n.shiftRight(1)
    
      // enforce low S values, see bip62: 'low s values in signatures'
      if (s.compareTo(N_OVER_TWO) > 0) {
        s = n.subtract(s)
      }
    
      return new ECSignature(r, s)
    }
    
    function verifyRaw (curve, e, signature, Q) {
      var n = curve.n
      var G = curve.G
    
      var r = signature.r
      var s = signature.s
    
      // 1.4.1 Enforce r and s are both integers in the interval [1, n − 1]
      if (r.signum() <= 0 || r.compareTo(n) >= 0) return false
      if (s.signum() <= 0 || s.compareTo(n) >= 0) return false
    
      // c = s^-1 mod n
      var c = s.modInverse(n)
    
      // 1.4.4 Compute u1 = es^−1 mod n
      //               u2 = rs^−1 mod n
      var u1 = e.multiply(c).mod(n)
      var u2 = r.multiply(c).mod(n)
    
      // 1.4.5 Compute R = (xR, yR) = u1G + u2Q
      var R = G.multiplyTwo(u1, Q, u2)
      var v = R.affineX.mod(n)
    
      // 1.4.5 (cont.) Enforce R is not at infinity
      if (curve.isInfinity(R)) return false
    
      // 1.4.8 If v = r, output "valid", and if v != r, output "invalid"
      return v.equals(r)
    }
    
    function verify (curve, hash, signature, Q) {
      // 1.4.2 H = Hash(M), already done by the user
      // 1.4.3 e = H
      var e = BigInteger.fromBuffer(hash)
    
      return verifyRaw(curve, e, signature, Q)
    }
    
    /**
      * Recover a public key from a signature.
      *
      * See SEC 1: Elliptic Curve Cryptography, section 4.1.6, "Public
      * Key Recovery Operation".
      *
      * http://www.secg.org/download/aid-780/sec1-v2.pdf
      */
    function recoverPubKey (curve, e, signature, i) {
      assert.strictEqual(i & 3, i, 'Recovery param is more than two bits')
    
      var n = curve.n
      var G = curve.G
    
      var r = signature.r
      var s = signature.s
    
      assert(r.signum() > 0 && r.compareTo(n) < 0, 'Invalid r value')
      assert(s.signum() > 0 && s.compareTo(n) < 0, 'Invalid s value')
    
      // A set LSB signifies that the y-coordinate is odd
      var isYOdd = i & 1
    
      // The more significant bit specifies whether we should use the
      // first or second candidate key.
      var isSecondKey = i >> 1
    
      // 1.1 Let x = r + jn
      var x = isSecondKey ? r.add(n) : r
      var R = curve.pointFromX(isYOdd, x)
    
      // 1.4 Check that nR is at infinity
      var nR = R.multiply(n)
      assert(curve.isInfinity(nR), 'nR is not a valid curve point')
    
      // Compute -e from e
      var eNeg = e.negate().mod(n)
    
      // 1.6.1 Compute Q = r^-1 (sR -  eG)
      //               Q = r^-1 (sR + -eG)
      var rInv = r.modInverse(n)
    
      var Q = R.multiplyTwo(s, G, eNeg).multiply(rInv)
      curve.validate(Q)
    
      return Q
    }
    
    /**
      * Calculate pubkey extraction parameter.
      *
      * When extracting a pubkey from a signature, we have to
      * distinguish four different cases. Rather than putting this
      * burden on the verifier, Potcoin includes a 2-bit value with the
      * signature.
      *
      * This function simply tries all four cases and returns the value
      * that resulted in a successful pubkey recovery.
      */
    function calcPubKeyRecoveryParam (curve, e, signature, Q) {
      for (var i = 0; i < 4; i++) {
        var Qprime = recoverPubKey(curve, e, signature, i)
    
        // 1.6.2 Verify Q
        if (Qprime.equals(Q)) {
          return i
        }
      }
    
      throw new Error('Unable to find valid recovery factor')
    }
    
    module.exports = {
      calcPubKeyRecoveryParam: calcPubKeyRecoveryParam,
      deterministicGenerateK: deterministicGenerateK,
      recoverPubKey: recoverPubKey,
      sign: sign,
      verify: verify,
      verifyRaw: verifyRaw
    }
    
  provide("potcoinjs-lib/src/ecdsa", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/address
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var base58check = require('bs58check')
    var typeForce = require('typeforce')
    var networks =  require('potcoinjs-lib/src/networks')
    var scripts =  require('potcoinjs-lib/src/scripts')
    
    function findScriptTypeByVersion (version) {
      for (var networkName in networks) {
        var network = networks[networkName]
    
        if (version === network.pubKeyHash) return 'pubkeyhash'
        if (version === network.scriptHash) return 'scripthash'
      }
    }
    
    function Address (hash, version) {
      typeForce('Buffer', hash)
    
      assert.strictEqual(hash.length, 20, 'Invalid hash length')
      assert.strictEqual(version & 0xff, version, 'Invalid version byte')
    
      this.hash = hash
      this.version = version
    }
    
    Address.fromBase58Check = function (string) {
      var payload = base58check.decode(string)
      var version = payload.readUInt8(0)
      var hash = payload.slice(1)
    
      return new Address(hash, version)
    }
    
    Address.fromOutputScript = function (script, network) {
      network = network || networks.potcoin
    
      if (scripts.isPubKeyHashOutput(script)) return new Address(script.chunks[2], network.pubKeyHash)
      if (scripts.isScriptHashOutput(script)) return new Address(script.chunks[1], network.scriptHash)
    
      assert(false, script.toASM() + ' has no matching Address')
    }
    
    Address.prototype.toBase58Check = function () {
      var payload = new Buffer(21)
      payload.writeUInt8(this.version, 0)
      this.hash.copy(payload, 1)
    
      return base58check.encode(payload)
    }
    
    Address.prototype.toOutputScript = function () {
      var scriptType = findScriptTypeByVersion(this.version)
    
      if (scriptType === 'pubkeyhash') return scripts.pubKeyHashOutput(this.hash)
      if (scriptType === 'scripthash') return scripts.scriptHashOutput(this.hash)
    
      assert(false, this.toString() + ' has no matching Script')
    }
    
    Address.prototype.toString = Address.prototype.toBase58Check
    
    module.exports = Address
    
  provide("potcoinjs-lib/src/address", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/ecpubkey
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var crypto =  require('potcoinjs-lib/src/crypto')
    var ecdsa =  require('potcoinjs-lib/src/ecdsa')
    var typeForce = require('typeforce')
    var networks =  require('potcoinjs-lib/src/networks')
    
    var Address =  require('potcoinjs-lib/src/address')
    
    var ecurve = require('ecurve')
    var secp256k1 = ecurve.getCurveByName('secp256k1')
    
    function ECPubKey (Q, compressed) {
      if (compressed === undefined) {
        compressed = true
      }
    
      typeForce('Point', Q)
      typeForce('Boolean', compressed)
    
      this.compressed = compressed
      this.Q = Q
    }
    
    // Constants
    ECPubKey.curve = secp256k1
    
    // Static constructors
    ECPubKey.fromBuffer = function (buffer) {
      var Q = ecurve.Point.decodeFrom(ECPubKey.curve, buffer)
      return new ECPubKey(Q, Q.compressed)
    }
    
    ECPubKey.fromHex = function (hex) {
      return ECPubKey.fromBuffer(new Buffer(hex, 'hex'))
    }
    
    // Operations
    ECPubKey.prototype.getAddress = function (network) {
      network = network || networks.potcoin
    
      return new Address(crypto.hash160(this.toBuffer()), network.pubKeyHash)
    }
    
    ECPubKey.prototype.verify = function (hash, signature) {
      return ecdsa.verify(ECPubKey.curve, hash, signature, this.Q)
    }
    
    // Export functions
    ECPubKey.prototype.toBuffer = function () {
      return this.Q.getEncoded(this.compressed)
    }
    
    ECPubKey.prototype.toHex = function () {
      return this.toBuffer().toString('hex')
    }
    
    module.exports = ECPubKey
    
  provide("potcoinjs-lib/src/ecpubkey", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/eckey
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var base58check = require('bs58check')
    var ecdsa =  require('potcoinjs-lib/src/ecdsa')
    var networks =  require('potcoinjs-lib/src/networks')
    var randomBytes = require('randombytes')
    var typeForce = require('typeforce')
    
    var BigInteger = require('bigi')
    var ECPubKey =  require('potcoinjs-lib/src/ecpubkey')
    
    var ecurve = require('ecurve')
    var secp256k1 = ecurve.getCurveByName('secp256k1')
    
    function ECKey (d, compressed) {
      assert(d.signum() > 0, 'Private key must be greater than 0')
      assert(d.compareTo(ECKey.curve.n) < 0, 'Private key must be less than the curve order')
    
      var Q = ECKey.curve.G.multiply(d)
    
      this.d = d
      this.pub = new ECPubKey(Q, compressed)
    }
    
    // Constants
    ECKey.curve = secp256k1
    
    // Static constructors
    ECKey.fromWIF = function (string) {
      var payload = base58check.decode(string)
      var compressed = false
    
      // Ignore the version byte
      payload = payload.slice(1)
    
      if (payload.length === 33) {
        assert.strictEqual(payload[32], 0x01, 'Invalid compression flag')
    
        // Truncate the compression flag
        payload = payload.slice(0, -1)
        compressed = true
      }
    
      assert.equal(payload.length, 32, 'Invalid WIF payload length')
    
      var d = BigInteger.fromBuffer(payload)
      return new ECKey(d, compressed)
    }
    
    ECKey.makeRandom = function (compressed, rng) {
      rng = rng || randomBytes
    
      var buffer = rng(32)
      typeForce('Buffer', buffer)
      assert.equal(buffer.length, 32, 'Expected 256-bit Buffer from RNG')
    
      var d = BigInteger.fromBuffer(buffer)
      d = d.mod(ECKey.curve.n)
    
      return new ECKey(d, compressed)
    }
    
    // Export functions
    ECKey.prototype.toWIF = function (network) {
      network = network || networks.potcoin
    
      var bufferLen = this.pub.compressed ? 34 : 33
      var buffer = new Buffer(bufferLen)
    
      buffer.writeUInt8(network.wif, 0)
      this.d.toBuffer(32).copy(buffer, 1)
    
      if (this.pub.compressed) {
        buffer.writeUInt8(0x01, 33)
      }
    
      return base58check.encode(buffer)
    }
    
    // Operations
    ECKey.prototype.sign = function (hash) {
      return ecdsa.sign(ECKey.curve, hash, this.d)
    }
    
    module.exports = ECKey
    
  provide("potcoinjs-lib/src/eckey", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/transaction
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var bufferutils =  require('potcoinjs-lib/src/bufferutils')
    var crypto =  require('potcoinjs-lib/src/crypto')
    var typeForce = require('typeforce')
    var opcodes =  require('potcoinjs-lib/src/opcodes')
    var scripts =  require('potcoinjs-lib/src/scripts')
    
    var Address =  require('potcoinjs-lib/src/address')
    var ECSignature =  require('potcoinjs-lib/src/ecsignature')
    var Script =  require('potcoinjs-lib/src/script')
    
    function Transaction () {
      this.version = 1
      this.locktime = 0
      this.ins = []
      this.outs = []
    }
    
    Transaction.DEFAULT_SEQUENCE = 0xffffffff
    Transaction.SIGHASH_ALL = 0x01
    Transaction.SIGHASH_NONE = 0x02
    Transaction.SIGHASH_SINGLE = 0x03
    Transaction.SIGHASH_ANYONECANPAY = 0x80
    
    Transaction.fromBuffer = function (buffer, __disableAssert) {
      var offset = 0
      function readSlice (n) {
        offset += n
        return buffer.slice(offset - n, offset)
      }
    
      function readUInt32 () {
        var i = buffer.readUInt32LE(offset)
        offset += 4
        return i
      }
    
      function readUInt64 () {
        var i = bufferutils.readUInt64LE(buffer, offset)
        offset += 8
        return i
      }
    
      function readVarInt () {
        var vi = bufferutils.readVarInt(buffer, offset)
        offset += vi.size
        return vi.number
      }
    
      function readScript () {
        return Script.fromBuffer(readSlice(readVarInt()))
      }
    
      function readGenerationScript () {
        return new Script(readSlice(readVarInt()), [])
      }
    
      var tx = new Transaction()
      tx.version = readUInt32()
    
      var vinLen = readVarInt()
      for (var i = 0; i < vinLen; ++i) {
        var hash = readSlice(32)
    
        if (Transaction.isCoinbaseHash(hash)) {
          tx.ins.push({
            hash: hash,
            index: readUInt32(),
            script: readGenerationScript(),
            sequence: readUInt32()
          })
        } else {
          tx.ins.push({
            hash: hash,
            index: readUInt32(),
            script: readScript(),
            sequence: readUInt32()
          })
        }
      }
    
      var voutLen = readVarInt()
      for (i = 0; i < voutLen; ++i) {
        tx.outs.push({
          value: readUInt64(),
          script: readScript()
        })
      }
    
      tx.locktime = readUInt32()
    
      if (!__disableAssert) {
        assert.equal(offset, buffer.length, 'Transaction has unexpected data')
      }
    
      return tx
    }
    
    Transaction.fromHex = function (hex) {
      return Transaction.fromBuffer(new Buffer(hex, 'hex'))
    }
    
    Transaction.isCoinbaseHash = function (buffer) {
      return Array.prototype.every.call(buffer, function (x) {
        return x === 0
      })
    }
    
    /**
     * Create a new txIn.
     *
     * Can be called with any of:
     *
     * - A transaction and an index
     * - A transaction hash and an index
     *
     * Note that this method does not sign the created input.
     */
    Transaction.prototype.addInput = function (hash, index, sequence, script) {
      if (sequence === undefined || sequence === null) {
        sequence = Transaction.DEFAULT_SEQUENCE
      }
    
      script = script || Script.EMPTY
    
      if (typeof hash === 'string') {
        // TxId hex is big-endian, we need little-endian
        hash = bufferutils.reverse(new Buffer(hash, 'hex'))
      } else if (hash instanceof Transaction) {
        hash = hash.getHash()
      }
    
      typeForce('Buffer', hash)
      typeForce('Number', index)
      typeForce('Number', sequence)
      typeForce('Script', script)
    
      assert.equal(hash.length, 32, 'Expected hash length of 32, got ' + hash.length)
    
      // Add the input and return the input's index
      return (this.ins.push({
        hash: hash,
        index: index,
        script: script,
        sequence: sequence
      }) - 1)
    }
    
    /**
     * Create a new txOut.
     *
     * Can be called with:
     *
     * - A base58 address string and a value
     * - An Address object and a value
     * - A scriptPubKey Script and a value
     */
    Transaction.prototype.addOutput = function (scriptPubKey, value) {
      // Attempt to get a valid address if it's a base58 address string
      if (typeof scriptPubKey === 'string') {
        scriptPubKey = Address.fromBase58Check(scriptPubKey)
      }
    
      // Attempt to get a valid script if it's an Address object
      if (scriptPubKey instanceof Address) {
        scriptPubKey = scriptPubKey.toOutputScript()
      }
    
      typeForce('Script', scriptPubKey)
      typeForce('Number', value)
    
      // Add the output and return the output's index
      return (this.outs.push({
        script: scriptPubKey,
        value: value
      }) - 1)
    }
    
    Transaction.prototype.clone = function () {
      var newTx = new Transaction()
      newTx.version = this.version
      newTx.locktime = this.locktime
    
      newTx.ins = this.ins.map(function (txIn) {
        return {
          hash: txIn.hash,
          index: txIn.index,
          script: txIn.script,
          sequence: txIn.sequence
        }
      })
    
      newTx.outs = this.outs.map(function (txOut) {
        return {
          script: txOut.script,
          value: txOut.value
        }
      })
    
      return newTx
    }
    
    /**
     * Hash transaction for signing a specific input.
     *
     * Potcoin uses a different hash for each signed transaction input. This
     * method copies the transaction, makes the necessary changes based on the
     * hashType, serializes and finally hashes the result. This hash can then be
     * used to sign the transaction input in question.
     */
    Transaction.prototype.hashForSignature = function (inIndex, prevOutScript, hashType) {
      // FIXME: remove in 2.x.y
      if (arguments[0] instanceof Script) {
        console.warn('hashForSignature(prevOutScript, inIndex, ...) has been deprecated. Use hashForSignature(inIndex, prevOutScript, ...)')
    
        // swap the arguments (must be stored in tmp, arguments is special)
        var tmp = arguments[0]
        inIndex = arguments[1]
        prevOutScript = tmp
      }
    
      typeForce('Number', inIndex)
      typeForce('Script', prevOutScript)
      typeForce('Number', hashType)
    
      assert(inIndex >= 0, 'Invalid vin index')
      assert(inIndex < this.ins.length, 'Invalid vin index')
    
      var txTmp = this.clone()
      var hashScript = prevOutScript.without(opcodes.OP_CODESEPARATOR)
    
      // Blank out other inputs' signatures
      txTmp.ins.forEach(function (txIn) {
        txIn.script = Script.EMPTY
      })
      txTmp.ins[inIndex].script = hashScript
    
      var hashTypeModifier = hashType & 0x1f
    
      if (hashTypeModifier === Transaction.SIGHASH_NONE) {
        assert(false, 'SIGHASH_NONE not yet supported')
      } else if (hashTypeModifier === Transaction.SIGHASH_SINGLE) {
        assert(false, 'SIGHASH_SINGLE not yet supported')
      }
    
      if (hashType & Transaction.SIGHASH_ANYONECANPAY) {
        assert(false, 'SIGHASH_ANYONECANPAY not yet supported')
      }
    
      var hashTypeBuffer = new Buffer(4)
      hashTypeBuffer.writeInt32LE(hashType, 0)
    
      var buffer = Buffer.concat([txTmp.toBuffer(), hashTypeBuffer])
      return crypto.hash256(buffer)
    }
    
    Transaction.prototype.getHash = function () {
      return crypto.hash256(this.toBuffer())
    }
    
    Transaction.prototype.getId = function () {
      // TxHash is little-endian, we need big-endian
      return bufferutils.reverse(this.getHash()).toString('hex')
    }
    
    Transaction.prototype.toBuffer = function () {
      function scriptSize (script) {
        var length = script.buffer.length
    
        return bufferutils.varIntSize(length) + length
      }
    
      var buffer = new Buffer(
        8 +
        bufferutils.varIntSize(this.ins.length) +
        bufferutils.varIntSize(this.outs.length) +
        this.ins.reduce(function (sum, input) { return sum + 40 + scriptSize(input.script) }, 0) +
        this.outs.reduce(function (sum, output) { return sum + 8 + scriptSize(output.script) }, 0)
      )
    
      var offset = 0
      function writeSlice (slice) {
        slice.copy(buffer, offset)
        offset += slice.length
      }
    
      function writeUInt32 (i) {
        buffer.writeUInt32LE(i, offset)
        offset += 4
      }
    
      function writeUInt64 (i) {
        bufferutils.writeUInt64LE(buffer, i, offset)
        offset += 8
      }
    
      function writeVarInt (i) {
        var n = bufferutils.writeVarInt(buffer, i, offset)
        offset += n
      }
    
      writeUInt32(this.version)
      writeVarInt(this.ins.length)
    
      this.ins.forEach(function (txIn) {
        writeSlice(txIn.hash)
        writeUInt32(txIn.index)
        writeVarInt(txIn.script.buffer.length)
        writeSlice(txIn.script.buffer)
        writeUInt32(txIn.sequence)
      })
    
      writeVarInt(this.outs.length)
      this.outs.forEach(function (txOut) {
        writeUInt64(txOut.value)
        writeVarInt(txOut.script.buffer.length)
        writeSlice(txOut.script.buffer)
      })
    
      writeUInt32(this.locktime)
    
      return buffer
    }
    
    Transaction.prototype.toHex = function () {
      return this.toBuffer().toString('hex')
    }
    
    Transaction.prototype.setInputScript = function (index, script) {
      typeForce('Number', index)
      typeForce('Script', script)
    
      this.ins[index].script = script
    }
    
    // FIXME: remove in 2.x.y
    Transaction.prototype.sign = function (index, privKey, hashType) {
      console.warn('Transaction.prototype.sign is deprecated.  Use TransactionBuilder instead.')
    
      var prevOutScript = privKey.pub.getAddress().toOutputScript()
      var signature = this.signInput(index, prevOutScript, privKey, hashType)
    
      var scriptSig = scripts.pubKeyHashInput(signature, privKey.pub)
      this.setInputScript(index, scriptSig)
    }
    
    // FIXME: remove in 2.x.y
    Transaction.prototype.signInput = function (index, prevOutScript, privKey, hashType) {
      console.warn('Transaction.prototype.signInput is deprecated.  Use TransactionBuilder instead.')
    
      hashType = hashType || Transaction.SIGHASH_ALL
    
      var hash = this.hashForSignature(index, prevOutScript, hashType)
      var signature = privKey.sign(hash)
    
      return signature.toScriptSignature(hashType)
    }
    
    // FIXME: remove in 2.x.y
    Transaction.prototype.validateInput = function (index, prevOutScript, pubKey, buffer) {
      console.warn('Transaction.prototype.validateInput is deprecated.  Use TransactionBuilder instead.')
    
      var parsed = ECSignature.parseScriptSignature(buffer)
      var hash = this.hashForSignature(index, prevOutScript, parsed.hashType)
    
      return pubKey.verify(hash, parsed.signature)
    }
    
    module.exports = Transaction
    
  provide("potcoinjs-lib/src/transaction", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/hdnode
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var base58check = require('bs58check')
    var bcrypto =  require('potcoinjs-lib/src/crypto')
    var createHmac = require('create-hmac')
    var typeForce = require('typeforce')
    var networks =  require('potcoinjs-lib/src/networks')
    
    var BigInteger = require('bigi')
    var ECKey =  require('potcoinjs-lib/src/eckey')
    var ECPubKey =  require('potcoinjs-lib/src/ecpubkey')
    
    var ecurve = require('ecurve')
    var curve = ecurve.getCurveByName('secp256k1')
    
    function findBIP32NetworkByVersion (version) {
      for (var name in networks) {
        var network = networks[name]
    
        if (version === network.bip32.private || version === network.bip32.public) {
          return network
        }
      }
    
      assert(false, 'Could not find network for ' + version.toString(16))
    }
    
    function HDNode (K, chainCode, network) {
      network = network || networks.potcoin
    
      typeForce('Buffer', chainCode)
    
      assert.equal(chainCode.length, 32, 'Expected chainCode length of 32, got ' + chainCode.length)
      assert(network.bip32, 'Unknown BIP32 constants for network')
    
      this.chainCode = chainCode
      this.depth = 0
      this.index = 0
      this.parentFingerprint = 0x00000000
      this.network = network
    
      if (K instanceof BigInteger) {
        this.privKey = new ECKey(K, true)
        this.pubKey = this.privKey.pub
      } else if (K instanceof ECKey) {
        assert(K.pub.compressed, 'ECKey must be compressed')
        this.privKey = K
        this.pubKey = K.pub
      } else if (K instanceof ECPubKey) {
        assert(K.compressed, 'ECPubKey must be compressed')
        this.pubKey = K
      } else {
        this.pubKey = new ECPubKey(K, true)
      }
    }
    
    HDNode.MASTER_SECRET = new Buffer('Potcoin seed')
    HDNode.HIGHEST_BIT = 0x80000000
    HDNode.LENGTH = 78
    
    HDNode.fromSeedBuffer = function (seed, network) {
      typeForce('Buffer', seed)
    
      assert(seed.length >= 16, 'Seed should be at least 128 bits')
      assert(seed.length <= 64, 'Seed should be at most 512 bits')
    
      var I = createHmac('sha512', HDNode.MASTER_SECRET).update(seed).digest()
      var IL = I.slice(0, 32)
      var IR = I.slice(32)
    
      // In case IL is 0 or >= n, the master key is invalid
      // This is handled by `new ECKey` in the HDNode constructor
      var pIL = BigInteger.fromBuffer(IL)
    
      return new HDNode(pIL, IR, network)
    }
    
    HDNode.fromSeedHex = function (hex, network) {
      return HDNode.fromSeedBuffer(new Buffer(hex, 'hex'), network)
    }
    
    HDNode.fromBase58 = function (string, network) {
      return HDNode.fromBuffer(base58check.decode(string), network, true)
    }
    
    // FIXME: remove in 2.x.y
    HDNode.fromBuffer = function (buffer, network, __ignoreDeprecation) {
      if (!__ignoreDeprecation) {
        console.warn('HDNode.fromBuffer() is deprecated for removal in 2.x.y, use fromBase58 instead')
      }
    
      assert.strictEqual(buffer.length, HDNode.LENGTH, 'Invalid buffer length')
    
      // 4 byte: version bytes
      var version = buffer.readUInt32BE(0)
    
      if (network) {
        assert(version === network.bip32.private || version === network.bip32.public, "Network doesn't match")
    
      // auto-detect
      } else {
        network = findBIP32NetworkByVersion(version)
      }
    
      // 1 byte: depth: 0x00 for master nodes, 0x01 for level-1 descendants, ...
      var depth = buffer.readUInt8(4)
    
      // 4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
      var parentFingerprint = buffer.readUInt32BE(5)
      if (depth === 0) {
        assert.strictEqual(parentFingerprint, 0x00000000, 'Invalid parent fingerprint')
      }
    
      // 4 bytes: child number. This is the number i in xi = xpar/i, with xi the key being serialized.
      // This is encoded in MSB order. (0x00000000 if master key)
      var index = buffer.readUInt32BE(9)
      assert(depth > 0 || index === 0, 'Invalid index')
    
      // 32 bytes: the chain code
      var chainCode = buffer.slice(13, 45)
      var data, hd
    
      // 33 bytes: private key data (0x00 + k)
      if (version === network.bip32.private) {
        assert.strictEqual(buffer.readUInt8(45), 0x00, 'Invalid private key')
        data = buffer.slice(46, 78)
        var d = BigInteger.fromBuffer(data)
        hd = new HDNode(d, chainCode, network)
    
      // 33 bytes: public key data (0x02 + X or 0x03 + X)
      } else {
        data = buffer.slice(45, 78)
        var Q = ecurve.Point.decodeFrom(curve, data)
        assert.equal(Q.compressed, true, 'Invalid public key')
    
        // Verify that the X coordinate in the public point corresponds to a point on the curve.
        // If not, the extended public key is invalid.
        curve.validate(Q)
    
        hd = new HDNode(Q, chainCode, network)
      }
    
      hd.depth = depth
      hd.index = index
      hd.parentFingerprint = parentFingerprint
    
      return hd
    }
    
    // FIXME: remove in 2.x.y
    HDNode.fromHex = function (hex, network) {
      return HDNode.fromBuffer(new Buffer(hex, 'hex'), network)
    }
    
    HDNode.prototype.getIdentifier = function () {
      return bcrypto.hash160(this.pubKey.toBuffer())
    }
    
    HDNode.prototype.getFingerprint = function () {
      return this.getIdentifier().slice(0, 4)
    }
    
    HDNode.prototype.getAddress = function () {
      return this.pubKey.getAddress(this.network)
    }
    
    HDNode.prototype.neutered = function () {
      var neutered = new HDNode(this.pubKey.Q, this.chainCode, this.network)
      neutered.depth = this.depth
      neutered.index = this.index
      neutered.parentFingerprint = this.parentFingerprint
    
      return neutered
    }
    
    HDNode.prototype.toBase58 = function (isPrivate) {
      return base58check.encode(this.toBuffer(isPrivate, true))
    }
    
    // FIXME: remove in 2.x.y
    HDNode.prototype.toBuffer = function (isPrivate, __ignoreDeprecation) {
      if (isPrivate === undefined) {
        isPrivate = !!this.privKey
    
      // FIXME: remove in 2.x.y
      } else {
        console.warn('isPrivate flag is deprecated, please use the .neutered() method instead')
      }
    
      if (!__ignoreDeprecation) {
        console.warn('HDNode.toBuffer() is deprecated for removal in 2.x.y, use toBase58 instead')
      }
    
      // Version
      var version = isPrivate ? this.network.bip32.private : this.network.bip32.public
      var buffer = new Buffer(HDNode.LENGTH)
    
      // 4 bytes: version bytes
      buffer.writeUInt32BE(version, 0)
    
      // Depth
      // 1 byte: depth: 0x00 for master nodes, 0x01 for level-1 descendants, ....
      buffer.writeUInt8(this.depth, 4)
    
      // 4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
      buffer.writeUInt32BE(this.parentFingerprint, 5)
    
      // 4 bytes: child number. This is the number i in xi = xpar/i, with xi the key being serialized.
      // This is encoded in Big endian. (0x00000000 if master key)
      buffer.writeUInt32BE(this.index, 9)
    
      // 32 bytes: the chain code
      this.chainCode.copy(buffer, 13)
    
      // 33 bytes: the public key or private key data
      if (isPrivate) {
        // FIXME: remove in 2.x.y
        assert(this.privKey, 'Missing private key')
    
        // 0x00 + k for private keys
        buffer.writeUInt8(0, 45)
        this.privKey.d.toBuffer(32).copy(buffer, 46)
      } else {
        // X9.62 encoding for public keys
        this.pubKey.toBuffer().copy(buffer, 45)
      }
    
      return buffer
    }
    
    // FIXME: remove in 2.x.y
    HDNode.prototype.toHex = function (isPrivate) {
      return this.toBuffer(isPrivate).toString('hex')
    }
    
    // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#child-key-derivation-ckd-functions
    HDNode.prototype.derive = function (index) {
      var isHardened = index >= HDNode.HIGHEST_BIT
      var indexBuffer = new Buffer(4)
      indexBuffer.writeUInt32BE(index, 0)
    
      var data
    
      // Hardened child
      if (isHardened) {
        assert(this.privKey, 'Could not derive hardened child key')
    
        // data = 0x00 || ser256(kpar) || ser32(index)
        data = Buffer.concat([
          this.privKey.d.toBuffer(33),
          indexBuffer
        ])
    
      // Normal child
      } else {
        // data = serP(point(kpar)) || ser32(index)
        //      = serP(Kpar) || ser32(index)
        data = Buffer.concat([
          this.pubKey.toBuffer(),
          indexBuffer
        ])
      }
    
      var I = createHmac('sha512', this.chainCode).update(data).digest()
      var IL = I.slice(0, 32)
      var IR = I.slice(32)
    
      var pIL = BigInteger.fromBuffer(IL)
    
      // In case parse256(IL) >= n, proceed with the next value for i
      if (pIL.compareTo(curve.n) >= 0) {
        return this.derive(index + 1)
      }
    
      // Private parent key -> private child key
      var hd
      if (this.privKey) {
        // ki = parse256(IL) + kpar (mod n)
        var ki = pIL.add(this.privKey.d).mod(curve.n)
    
        // In case ki == 0, proceed with the next value for i
        if (ki.signum() === 0) {
          return this.derive(index + 1)
        }
    
        hd = new HDNode(ki, IR, this.network)
    
      // Public parent key -> public child key
      } else {
        // Ki = point(parse256(IL)) + Kpar
        //    = G*IL + Kpar
        var Ki = curve.G.multiply(pIL).add(this.pubKey.Q)
    
        // In case Ki is the point at infinity, proceed with the next value for i
        if (curve.isInfinity(Ki)) {
          return this.derive(index + 1)
        }
    
        hd = new HDNode(Ki, IR, this.network)
      }
    
      hd.depth = this.depth + 1
      hd.index = index
      hd.parentFingerprint = this.getFingerprint().readUInt32BE(0)
    
      return hd
    }
    
    HDNode.prototype.deriveHardened = function (index) {
      // Only derives hardened private keys by default
      return this.derive(index + HDNode.HIGHEST_BIT)
    }
    
    HDNode.prototype.toString = HDNode.prototype.toBase58
    
    module.exports = HDNode
    
  provide("potcoinjs-lib/src/hdnode", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/transaction_builder
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var ops =  require('potcoinjs-lib/src/opcodes')
    var scripts =  require('potcoinjs-lib/src/scripts')
    
    var ECPubKey =  require('potcoinjs-lib/src/ecpubkey')
    var ECSignature =  require('potcoinjs-lib/src/ecsignature')
    var Script =  require('potcoinjs-lib/src/script')
    var Transaction =  require('potcoinjs-lib/src/transaction')
    
    function extractInput (txIn) {
      var redeemScript
      var scriptSig = txIn.script
      var prevOutScript
      var prevOutType = scripts.classifyInput(scriptSig, true)
      var scriptType
    
      // Re-classify if scriptHash
      if (prevOutType === 'scripthash') {
        redeemScript = Script.fromBuffer(scriptSig.chunks.slice(-1)[0])
        prevOutScript = scripts.scriptHashOutput(redeemScript.getHash())
    
        scriptSig = Script.fromChunks(scriptSig.chunks.slice(0, -1))
        scriptType = scripts.classifyInput(scriptSig, true)
      } else {
        scriptType = prevOutType
      }
    
      // Extract hashType, pubKeys and signatures
      var hashType, parsed, pubKeys, signatures
    
      switch (scriptType) {
        case 'pubkeyhash': {
          parsed = ECSignature.parseScriptSignature(scriptSig.chunks[0])
          hashType = parsed.hashType
          pubKeys = [ECPubKey.fromBuffer(scriptSig.chunks[1])]
          signatures = [parsed.signature]
          prevOutScript = pubKeys[0].getAddress().toOutputScript()
    
          break
        }
    
        case 'pubkey': {
          parsed = ECSignature.parseScriptSignature(scriptSig.chunks[0])
          hashType = parsed.hashType
          signatures = [parsed.signature]
    
          if (redeemScript) {
            pubKeys = [ECPubKey.fromBuffer(redeemScript.chunks[0])]
          }
    
          break
        }
    
        case 'multisig': {
          signatures = scriptSig.chunks.slice(1).map(function (chunk) {
            if (chunk === ops.OP_0) return chunk
    
            var parsed = ECSignature.parseScriptSignature(chunk)
            hashType = parsed.hashType
    
            return parsed.signature
          })
    
          if (redeemScript) {
            pubKeys = redeemScript.chunks.slice(1, -2).map(ECPubKey.fromBuffer)
          }
    
          break
        }
      }
    
      return {
        hashType: hashType,
        prevOutScript: prevOutScript,
        prevOutType: prevOutType,
        pubKeys: pubKeys,
        redeemScript: redeemScript,
        scriptType: scriptType,
        signatures: signatures
      }
    }
    
    function TransactionBuilder () {
      this.prevTxMap = {}
      this.prevOutScripts = {}
      this.prevOutTypes = {}
    
      this.inputs = []
      this.tx = new Transaction()
    }
    
    TransactionBuilder.fromTransaction = function (transaction) {
      var txb = new TransactionBuilder()
    
      // Copy other transaction fields
      txb.tx.version = transaction.version
      txb.tx.locktime = transaction.locktime
    
      // Extract/add inputs
      transaction.ins.forEach(function (txIn) {
        txb.addInput(txIn.hash, txIn.index, txIn.sequence)
      })
    
      // Extract/add outputs
      transaction.outs.forEach(function (txOut) {
        txb.addOutput(txOut.script, txOut.value)
      })
    
      // Extract/add signatures
      txb.inputs = transaction.ins.map(function (txIn) {
        // TODO: remove me after testcase added
        assert(!Transaction.isCoinbaseHash(txIn.hash), 'coinbase inputs not supported')
    
        // Ignore empty scripts
        if (txIn.script.buffer.length === 0) return {}
    
        return extractInput(txIn)
      })
    
      return txb
    }
    
    TransactionBuilder.prototype.addInput = function (prevTx, index, sequence, prevOutScript) {
      var prevOutHash
    
      // txId
      if (typeof prevTx === 'string') {
        prevOutHash = new Buffer(prevTx, 'hex')
    
        // TxId hex is big-endian, we want little-endian hash
        Array.prototype.reverse.call(prevOutHash)
    
      // Transaction
      } else if (prevTx instanceof Transaction) {
        prevOutHash = prevTx.getHash()
        prevOutScript = prevTx.outs[index].script
    
      // txHash
      } else {
        prevOutHash = prevTx
      }
    
      var input = {}
      if (prevOutScript) {
        var prevOutType = scripts.classifyOutput(prevOutScript)
    
        // if we can, extract pubKey information
        switch (prevOutType) {
          case 'multisig': {
            input.pubKeys = prevOutScript.chunks.slice(1, -2).map(ECPubKey.fromBuffer)
            break
          }
    
          case 'pubkey': {
            input.pubKeys = prevOutScript.chunks.slice(0, 1).map(ECPubKey.fromBuffer)
            break
          }
        }
    
        if (prevOutType !== 'scripthash') {
          input.scriptType = prevOutType
        }
    
        input.prevOutScript = prevOutScript
        input.prevOutType = prevOutType
      }
    
      assert(this.inputs.every(function (input2) {
        if (input2.hashType === undefined) return true
    
        return input2.hashType & Transaction.SIGHASH_ANYONECANPAY
      }), 'No, this would invalidate signatures')
    
      var prevOut = prevOutHash.toString('hex') + ':' + index
      assert(!(prevOut in this.prevTxMap), 'Transaction is already an input')
    
      var vin = this.tx.addInput(prevOutHash, index, sequence)
      this.inputs[vin] = input
      this.prevTxMap[prevOut] = vin
    
      return vin
    }
    
    TransactionBuilder.prototype.addOutput = function (scriptPubKey, value) {
      assert(this.inputs.every(function (input) {
        if (input.hashType === undefined) return true
    
        return (input.hashType & 0x1f) === Transaction.SIGHASH_SINGLE
      }), 'No, this would invalidate signatures')
    
      return this.tx.addOutput(scriptPubKey, value)
    }
    
    TransactionBuilder.prototype.build = function () {
      return this.__build(false)
    }
    TransactionBuilder.prototype.buildIncomplete = function () {
      return this.__build(true)
    }
    
    var canSignTypes = {
      'pubkeyhash': true,
      'multisig': true,
      'pubkey': true
    }
    
    TransactionBuilder.prototype.__build = function (allowIncomplete) {
      if (!allowIncomplete) {
        assert(this.tx.ins.length > 0, 'Transaction has no inputs')
        assert(this.tx.outs.length > 0, 'Transaction has no outputs')
      }
    
      var tx = this.tx.clone()
    
      // Create script signatures from signature meta-data
      this.inputs.forEach(function (input, index) {
        var scriptType = input.scriptType
        var scriptSig
    
        if (!allowIncomplete) {
          assert(!!scriptType, 'Transaction is not complete')
          assert(scriptType in canSignTypes, scriptType + ' not supported')
          assert(input.signatures, 'Transaction is missing signatures')
        }
    
        if (input.signatures) {
          switch (scriptType) {
            case 'pubkeyhash': {
              var pkhSignature = input.signatures[0].toScriptSignature(input.hashType)
              scriptSig = scripts.pubKeyHashInput(pkhSignature, input.pubKeys[0])
              break
            }
    
            case 'multisig': {
              // Array.prototype.map is sparse-compatible
              var msSignatures = input.signatures.map(function (signature) {
                return signature && signature.toScriptSignature(input.hashType)
              })
    
              // fill in blanks with OP_0
              if (allowIncomplete) {
                for (var i = 0; i < msSignatures.length; ++i) {
                  if (msSignatures[i]) continue
    
                  msSignatures[i] = ops.OP_0
                }
              } else {
                // Array.prototype.filter returns non-sparse array
                msSignatures = msSignatures.filter(function (x) { return x })
              }
    
              var redeemScript = allowIncomplete ? undefined : input.redeemScript
              scriptSig = scripts.multisigInput(msSignatures, redeemScript)
              break
            }
    
            case 'pubkey': {
              var pkSignature = input.signatures[0].toScriptSignature(input.hashType)
              scriptSig = scripts.pubKeyInput(pkSignature)
              break
            }
          }
        }
    
        // did we build a scriptSig?
        if (scriptSig) {
          // wrap as scriptHash if necessary
          if (input.prevOutType === 'scripthash') {
            scriptSig = scripts.scriptHashInput(scriptSig, input.redeemScript)
          }
    
          tx.setInputScript(index, scriptSig)
        }
      })
    
      return tx
    }
    
    TransactionBuilder.prototype.sign = function (index, privKey, redeemScript, hashType) {
      assert(index in this.inputs, 'No input at index: ' + index)
      hashType = hashType || Transaction.SIGHASH_ALL
    
      var input = this.inputs[index]
      var canSign = input.hashType &&
        input.prevOutScript &&
        input.prevOutType &&
        input.pubKeys &&
        input.scriptType &&
        input.signatures
    
      // are we almost ready to sign?
      if (canSign) {
        // if redeemScript was provided, enforce consistency
        if (redeemScript) {
          assert.deepEqual(input.redeemScript, redeemScript, 'Inconsistent redeemScript')
        }
    
        assert.equal(input.hashType, hashType, 'Inconsistent hashType')
    
      // no? prepare
      } else {
        // must be pay-to-scriptHash?
        if (redeemScript) {
          // if we have a prevOutScript, enforce scriptHash equality to the redeemScript
          if (input.prevOutScript) {
            assert.equal(input.prevOutType, 'scripthash', 'PrevOutScript must be P2SH')
    
            var scriptHash = input.prevOutScript.chunks[1]
            assert.deepEqual(scriptHash, redeemScript.getHash(), 'RedeemScript does not match ' + scriptHash.toString('hex'))
          }
    
          var scriptType = scripts.classifyOutput(redeemScript)
          assert(scriptType in canSignTypes, 'RedeemScript not supported (' + scriptType + ')')
    
          var pubKeys = []
          switch (scriptType) {
            case 'multisig': {
              pubKeys = redeemScript.chunks.slice(1, -2).map(ECPubKey.fromBuffer)
              break
            }
    
            case 'pubkeyhash': {
              var pkh1 = redeemScript.chunks[2]
              var pkh2 = privKey.pub.getAddress().hash
    
              assert.deepEqual(pkh1, pkh2, 'privateKey cannot sign for this input')
              pubKeys = [privKey.pub]
              break
            }
    
            case 'pubkey': {
              pubKeys = redeemScript.chunks.slice(0, 1).map(ECPubKey.fromBuffer)
              break
            }
          }
    
          if (!input.prevOutScript) {
            input.prevOutScript = scripts.scriptHashOutput(redeemScript.getHash())
            input.prevOutType = 'scripthash'
          }
    
          input.pubKeys = pubKeys
          input.redeemScript = redeemScript
          input.scriptType = scriptType
    
        // cannot be pay-to-scriptHash
        } else {
          assert.notEqual(input.prevOutType, 'scripthash', 'PrevOutScript is P2SH, missing redeemScript')
    
          // can we otherwise sign this?
          if (input.scriptType) {
            assert(input.pubKeys, input.scriptType + ' not supported')
    
          // we know nothin' Jon Snow, assume pubKeyHash
          } else {
            input.prevOutScript = privKey.pub.getAddress().toOutputScript()
            input.prevOutType = 'pubkeyhash'
            input.pubKeys = [privKey.pub]
            input.scriptType = input.prevOutType
          }
        }
    
        input.hashType = hashType
        input.signatures = input.signatures || []
      }
    
      var signatureScript = input.redeemScript || input.prevOutScript
      var signatureHash = this.tx.hashForSignature(index, signatureScript, hashType)
    
      // enforce signature order matches public keys
      if (input.scriptType === 'multisig' && input.redeemScript && input.signatures.length !== input.pubKeys.length) {
        // maintain a local copy of unmatched signatures
        var unmatched = input.signatures.slice()
    
        input.signatures = input.pubKeys.map(function (pubKey) {
          var match
    
          // check for any matching signatures
          unmatched.some(function (signature, i) {
            if (!pubKey.verify(signatureHash, signature)) return false
            match = signature
    
            // remove matched signature from unmatched
            unmatched.splice(i, 1)
    
            return true
          })
    
          return match || undefined
        })
      }
    
      // enforce in order signing of public keys
      assert(input.pubKeys.some(function (pubKey, i) {
        if (!privKey.pub.Q.equals(pubKey.Q)) return false
    
        assert(!input.signatures[i], 'Signature already exists')
        var signature = privKey.sign(signatureHash)
        input.signatures[i] = signature
    
        return true
      }, this), 'privateKey cannot sign for this input')
    }
    
    module.exports = TransactionBuilder
    
  provide("potcoinjs-lib/src/transaction_builder", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/base58check
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var bs58check = require('bs58check')
    
    function decode () {
      console.warn('bs58check will be removed in 2.0.0. require("bs58check") instead.')
    
      return bs58check.decode.apply(undefined, arguments)
    }
    
    function encode () {
      console.warn('bs58check will be removed in 2.0.0. require("bs58check") instead.')
    
      return bs58check.encode.apply(undefined, arguments)
    }
    
    module.exports = {
      decode: decode,
      encode: encode
    }
    
  provide("potcoinjs-lib/src/base58check", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/block
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var bufferutils =  require('potcoinjs-lib/src/bufferutils')
    var crypto =  require('potcoinjs-lib/src/crypto')
    
    var Transaction =  require('potcoinjs-lib/src/transaction')
    
    function Block () {
      this.version = 1
      this.prevHash = null
      this.merkleRoot = null
      this.timestamp = 0
      this.bits = 0
      this.nonce = 0
    }
    
    Block.fromBuffer = function (buffer) {
      assert(buffer.length >= 80, 'Buffer too small (< 80 bytes)')
    
      var offset = 0
      function readSlice (n) {
        offset += n
        return buffer.slice(offset - n, offset)
      }
    
      function readUInt32 () {
        var i = buffer.readUInt32LE(offset)
        offset += 4
        return i
      }
    
      var block = new Block()
      block.version = readUInt32()
      block.prevHash = readSlice(32)
      block.merkleRoot = readSlice(32)
      block.timestamp = readUInt32()
      block.bits = readUInt32()
      block.nonce = readUInt32()
    
      if (buffer.length === 80) return block
    
      function readVarInt () {
        var vi = bufferutils.readVarInt(buffer, offset)
        offset += vi.size
        return vi.number
      }
    
      // FIXME: poor performance
      function readTransaction () {
        var tx = Transaction.fromBuffer(buffer.slice(offset), true)
    
        offset += tx.toBuffer().length
        return tx
      }
    
      var nTransactions = readVarInt()
      block.transactions = []
    
      for (var i = 0; i < nTransactions; ++i) {
        var tx = readTransaction()
        block.transactions.push(tx)
      }
    
      return block
    }
    
    Block.fromHex = function (hex) {
      return Block.fromBuffer(new Buffer(hex, 'hex'))
    }
    
    Block.prototype.getHash = function () {
      return crypto.hash256(this.toBuffer(true))
    }
    
    Block.prototype.getId = function () {
      return bufferutils.reverse(this.getHash()).toString('hex')
    }
    
    Block.prototype.getUTCDate = function () {
      var date = new Date(0) // epoch
      date.setUTCSeconds(this.timestamp)
    
      return date
    }
    
    Block.prototype.toBuffer = function (headersOnly) {
      var buffer = new Buffer(80)
    
      var offset = 0
      function writeSlice (slice) {
        slice.copy(buffer, offset)
        offset += slice.length
      }
    
      function writeUInt32 (i) {
        buffer.writeUInt32LE(i, offset)
        offset += 4
      }
    
      writeUInt32(this.version)
      writeSlice(this.prevHash)
      writeSlice(this.merkleRoot)
      writeUInt32(this.timestamp)
      writeUInt32(this.bits)
      writeUInt32(this.nonce)
    
      if (headersOnly || !this.transactions) return buffer
    
      var txLenBuffer = bufferutils.varIntBuffer(this.transactions.length)
      var txBuffers = this.transactions.map(function (tx) {
        return tx.toBuffer()
      })
    
      return Buffer.concat([buffer, txLenBuffer].concat(txBuffers))
    }
    
    Block.prototype.toHex = function (headersOnly) {
      return this.toBuffer(headersOnly).toString('hex')
    }
    
    module.exports = Block
    
  provide("potcoinjs-lib/src/block", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/message
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var bufferutils =  require('potcoinjs-lib/src/bufferutils')
    var crypto =  require('potcoinjs-lib/src/crypto')
    var ecdsa =  require('potcoinjs-lib/src/ecdsa')
    var networks =  require('potcoinjs-lib/src/networks')
    
    var BigInteger = require('bigi')
    var ECPubKey =  require('potcoinjs-lib/src/ecpubkey')
    var ECSignature =  require('potcoinjs-lib/src/ecsignature')
    
    var ecurve = require('ecurve')
    var ecparams = ecurve.getCurveByName('secp256k1')
    
    function magicHash (message, network) {
      var magicPrefix = new Buffer(network.magicPrefix)
      var messageBuffer = new Buffer(message)
      var lengthBuffer = bufferutils.varIntBuffer(messageBuffer.length)
    
      var buffer = Buffer.concat([magicPrefix, lengthBuffer, messageBuffer])
      return crypto.hash256(buffer)
    }
    
    function sign (privKey, message, network) {
      network = network || networks.potcoin
    
      var hash = magicHash(message, network)
      var signature = privKey.sign(hash)
      var e = BigInteger.fromBuffer(hash)
      var i = ecdsa.calcPubKeyRecoveryParam(ecparams, e, signature, privKey.pub.Q)
    
      return signature.toCompact(i, privKey.pub.compressed)
    }
    
    // TODO: network could be implied from address
    function verify (address, signature, message, network) {
      if (!Buffer.isBuffer(signature)) {
        signature = new Buffer(signature, 'base64')
      }
    
      network = network || networks.potcoin
    
      var hash = magicHash(message, network)
      var parsed = ECSignature.parseCompact(signature)
      var e = BigInteger.fromBuffer(hash)
      var Q = ecdsa.recoverPubKey(ecparams, e, parsed.signature, parsed.i)
    
      var pubKey = new ECPubKey(Q, parsed.compressed)
      return pubKey.getAddress(network).toString() === address.toString()
    }
    
    module.exports = {
      magicHash: magicHash,
      sign: sign,
      verify: verify
    }
    
  provide("potcoinjs-lib/src/message", module.exports);
}(global));

// pakmanager:potcoinjs-lib/src/wallet
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    var bufferutils =  require('potcoinjs-lib/src/bufferutils')
    var typeForce = require('typeforce')
    var networks =  require('potcoinjs-lib/src/networks')
    var randomBytes = require('randombytes')
    
    var Address =  require('potcoinjs-lib/src/address')
    var HDNode =  require('potcoinjs-lib/src/hdnode')
    var TransactionBuilder =  require('potcoinjs-lib/src/transaction_builder')
    var Script =  require('potcoinjs-lib/src/script')
    
    function Wallet (seed, network) {
      console.warn('Wallet is deprecated and will be removed in 2.0.0, see #296')
    
      seed = seed || randomBytes(32)
      network = network || networks.potcoin
    
      // Stored in a closure to make accidental serialization less likely
      var masterKey = HDNode.fromSeedBuffer(seed, network)
    
      // HD first-level child derivation method should be hardened
      // See https://bitcointalk.org/index.php?topic=405179.msg4415254#msg4415254
      var accountZero = masterKey.deriveHardened(0)
      var externalAccount = accountZero.derive(0)
      var internalAccount = accountZero.derive(1)
    
      this.addresses = []
      this.changeAddresses = []
      this.network = network
      this.unspents = []
    
      // FIXME: remove in 2.0.0
      this.unspentMap = {}
    
      // FIXME: remove in 2.0.0
      var me = this
      this.newMasterKey = function (seed) {
        console.warn('newMasterKey is deprecated, please make a new Wallet instance instead')
    
        seed = seed || randomBytes(32)
        masterKey = HDNode.fromSeedBuffer(seed, network)
    
        accountZero = masterKey.deriveHardened(0)
        externalAccount = accountZero.derive(0)
        internalAccount = accountZero.derive(1)
    
        me.addresses = []
        me.changeAddresses = []
    
        me.unspents = []
        me.unspentMap = {}
      }
    
      this.getMasterKey = function () {
        return masterKey
      }
      this.getAccountZero = function () {
        return accountZero
      }
      this.getExternalAccount = function () {
        return externalAccount
      }
      this.getInternalAccount = function () {
        return internalAccount
      }
    }
    
    Wallet.prototype.createTransaction = function (to, value, options) {
      // FIXME: remove in 2.0.0
      if (typeof options !== 'object') {
        if (options !== undefined) {
          console.warn('Non options object parameters are deprecated, use options object instead')
    
          options = {
            fixedFee: arguments[2],
            changeAddress: arguments[3]
          }
        }
      }
    
      options = options || {}
    
      assert(value > this.network.dustThreshold, value + ' must be above dust threshold (' + this.network.dustThreshold + ' Satoshis)')
    
      var changeAddress = options.changeAddress
      var fixedFee = options.fixedFee
      var minConf = options.minConf === undefined ? 0 : options.minConf // FIXME: change minConf:1 by default in 2.0.0
    
      // filter by minConf, then pending and sort by descending value
      var unspents = this.unspents.filter(function (unspent) {
        return unspent.confirmations >= minConf
      }).filter(function (unspent) {
        return !unspent.pending
      }).sort(function (o1, o2) {
        return o2.value - o1.value
      })
    
      var accum = 0
      var addresses = []
      var subTotal = value
    
      var txb = new TransactionBuilder()
      txb.addOutput(to, value)
    
      for (var i = 0; i < unspents.length; ++i) {
        var unspent = unspents[i]
        addresses.push(unspent.address)
    
        txb.addInput(unspent.txHash, unspent.index)
    
        var fee = fixedFee === undefined ? estimatePaddedFee(txb.buildIncomplete(), this.network) : fixedFee
    
        accum += unspent.value
        subTotal = value + fee
    
        if (accum >= subTotal) {
          var change = accum - subTotal
    
          if (change > this.network.dustThreshold) {
            txb.addOutput(changeAddress || this.getChangeAddress(), change)
          }
    
          break
        }
      }
    
      assert(accum >= subTotal, 'Not enough funds (incl. fee): ' + accum + ' < ' + subTotal)
    
      return this.signWith(txb, addresses).build()
    }
    
    // FIXME: remove in 2.0.0
    Wallet.prototype.processPendingTx = function (tx) {
      this.__processTx(tx, true)
    }
    
    // FIXME: remove in 2.0.0
    Wallet.prototype.processConfirmedTx = function (tx) {
      this.__processTx(tx, false)
    }
    
    // FIXME: remove in 2.0.0
    Wallet.prototype.__processTx = function (tx, isPending) {
      console.warn('processTransaction is considered harmful, see issue #260 for more information')
    
      var txId = tx.getId()
      var txHash = tx.getHash()
    
      tx.outs.forEach(function (txOut, i) {
        var address
    
        try {
          address = Address.fromOutputScript(txOut.script, this.network).toString()
        } catch (e) {
          if (!(e.message.match(/has no matching Address/)))
            throw e
        }
    
        var myAddresses = this.addresses.concat(this.changeAddresses)
        if (myAddresses.indexOf(address) > -1) {
          var lookup = txId + ':' + i
          if (lookup in this.unspentMap) return
    
          // its unique, add it
          var unspent = {
            address: address,
            confirmations: 0, // no way to determine this without more information
            index: i,
            txHash: txHash,
            txId: txId,
            value: txOut.value,
            pending: isPending
          }
    
          this.unspentMap[lookup] = unspent
          this.unspents.push(unspent)
        }
      }, this)
    
      tx.ins.forEach(function (txIn) {
        // copy and convert to big-endian hex
        var txInId = bufferutils.reverse(txIn.hash).toString('hex')
    
        var lookup = txInId + ':' + txIn.index
        if (!(lookup in this.unspentMap)) return
    
        var unspent = this.unspentMap[lookup]
    
        if (isPending) {
          unspent.pending = true
          unspent.spent = true
        } else {
          delete this.unspentMap[lookup]
    
          this.unspents = this.unspents.filter(function (unspent2) {
            return unspent !== unspent2
          })
        }
      }, this)
    }
    
    Wallet.prototype.generateAddress = function () {
      var k = this.addresses.length
      var address = this.getExternalAccount().derive(k).getAddress()
    
      this.addresses.push(address.toString())
    
      return this.getReceiveAddress()
    }
    
    Wallet.prototype.generateChangeAddress = function () {
      var k = this.changeAddresses.length
      var address = this.getInternalAccount().derive(k).getAddress()
    
      this.changeAddresses.push(address.toString())
    
      return this.getChangeAddress()
    }
    
    Wallet.prototype.getAddress = function () {
      if (this.addresses.length === 0) {
        this.generateAddress()
      }
    
      return this.addresses[this.addresses.length - 1]
    }
    
    Wallet.prototype.getBalance = function (minConf) {
      minConf = minConf || 0
    
      return this.unspents.filter(function (unspent) {
        return unspent.confirmations >= minConf
    
          // FIXME: remove spent filter in 2.0.0
      }).filter(function (unspent) {
        return !unspent.spent
      }).reduce(function (accum, unspent) {
        return accum + unspent.value
      }, 0)
    }
    
    Wallet.prototype.getChangeAddress = function () {
      if (this.changeAddresses.length === 0) {
        this.generateChangeAddress()
      }
    
      return this.changeAddresses[this.changeAddresses.length - 1]
    }
    
    Wallet.prototype.getInternalPrivateKey = function (index) {
      return this.getInternalAccount().derive(index).privKey
    }
    
    Wallet.prototype.getPrivateKey = function (index) {
      return this.getExternalAccount().derive(index).privKey
    }
    
    Wallet.prototype.getPrivateKeyForAddress = function (address) {
      var index
    
      if ((index = this.addresses.indexOf(address)) > -1) {
        return this.getPrivateKey(index)
      }
    
      if ((index = this.changeAddresses.indexOf(address)) > -1) {
        return this.getInternalPrivateKey(index)
      }
    
      assert(false, 'Unknown address. Make sure the address is from the keychain and has been generated')
    }
    
    Wallet.prototype.getUnspentOutputs = function (minConf) {
      minConf = minConf || 0
    
      return this.unspents.filter(function (unspent) {
        return unspent.confirmations >= minConf
    
          // FIXME: remove spent filter in 2.0.0
      }).filter(function (unspent) {
        return !unspent.spent
      }).map(function (unspent) {
        return {
          address: unspent.address,
          confirmations: unspent.confirmations,
          index: unspent.index,
          txId: unspent.txId,
          value: unspent.value,
    
          // FIXME: remove in 2.0.0
          hash: unspent.txId,
          pending: unspent.pending
        }
      })
    }
    
    Wallet.prototype.setUnspentOutputs = function (unspents) {
      this.unspentMap = {}
      this.unspents = unspents.map(function (unspent) {
        // FIXME: remove unspent.hash in 2.0.0
        var txId = unspent.txId || unspent.hash
        var index = unspent.index
    
        // FIXME: remove in 2.0.0
        if (unspent.hash !== undefined) {
          console.warn('unspent.hash is deprecated, use unspent.txId instead')
        }
    
        // FIXME: remove in 2.0.0
        if (index === undefined) {
          console.warn('unspent.outputIndex is deprecated, use unspent.index instead')
          index = unspent.outputIndex
        }
    
        typeForce('String', txId)
        typeForce('Number', index)
        typeForce('Number', unspent.value)
    
        assert.equal(txId.length, 64, 'Expected valid txId, got ' + txId)
        assert.doesNotThrow(function () {
          Address.fromBase58Check(unspent.address)
        }, 'Expected Base58 Address, got ' + unspent.address)
        assert(isFinite(index), 'Expected finite index, got ' + index)
    
        // FIXME: remove branch in 2.0.0
        if (unspent.confirmations !== undefined) {
          typeForce('Number', unspent.confirmations)
        }
    
        var txHash = bufferutils.reverse(new Buffer(txId, 'hex'))
    
        unspent = {
          address: unspent.address,
          confirmations: unspent.confirmations || 0,
          index: index,
          txHash: txHash,
          txId: txId,
          value: unspent.value,
    
          // FIXME: remove in 2.0.0
          pending: unspent.pending || false
        }
    
        // FIXME: remove in 2.0.0
        this.unspentMap[txId + ':' + index] = unspent
    
        return unspent
      }, this)
    }
    
    Wallet.prototype.signWith = function (tx, addresses) {
      addresses.forEach(function (address, i) {
        var privKey = this.getPrivateKeyForAddress(address)
    
        tx.sign(i, privKey)
      }, this)
    
      return tx
    }
    
    function estimatePaddedFee (tx, network) {
      var tmpTx = tx.clone()
      tmpTx.addOutput(Script.EMPTY, network.dustSoftThreshold || 0)
    
      return network.estimateFee(tmpTx)
    }
    
    // FIXME: 1.0.0 shims, remove in 2.0.0
    Wallet.prototype.getReceiveAddress = Wallet.prototype.getAddress
    Wallet.prototype.createTx = Wallet.prototype.createTransaction
    
    module.exports = Wallet
    
  provide("potcoinjs-lib/src/wallet", module.exports);
}(global));

// pakmanager:potcoinjs-lib
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = {
      Address:  require('potcoinjs-lib/src/address'),
      base58check:  require('potcoinjs-lib/src/base58check'),
      Block:  require('potcoinjs-lib/src/block'),
      bufferutils:  require('potcoinjs-lib/src/bufferutils'),
      crypto:  require('potcoinjs-lib/src/crypto'),
      ecdsa:  require('potcoinjs-lib/src/ecdsa'),
      ECKey:  require('potcoinjs-lib/src/eckey'),
      ECPubKey:  require('potcoinjs-lib/src/ecpubkey'),
      ECSignature:  require('potcoinjs-lib/src/ecsignature'),
      Message:  require('potcoinjs-lib/src/message'),
      opcodes:  require('potcoinjs-lib/src/opcodes'),
      HDNode:  require('potcoinjs-lib/src/hdnode'),
      Script:  require('potcoinjs-lib/src/script'),
      scripts:  require('potcoinjs-lib/src/scripts'),
      Transaction:  require('potcoinjs-lib/src/transaction'),
      TransactionBuilder:  require('potcoinjs-lib/src/transaction_builder'),
      networks:  require('potcoinjs-lib/src/networks'),
      Wallet:  require('potcoinjs-lib/src/wallet')
    }
    
  provide("potcoinjs-lib", module.exports);
}(global));