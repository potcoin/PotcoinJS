// https://en.bitcoin.it/wiki/List_of_address_prefixes

var networks = {
  potcoin: {
    magicPrefix: '\x18Potcoin Signed Message:\n',
    bip32: {
      public: 0x213045C1, // Ppub
      private: 0x213045C0 // Pprv
    },
    pubKeyHash: 0x37, //0xfd, // https://github.com/potcoin/potcoin/blob/master/src/script.h#L206
    scriptHash: 0x05,
    wif: 0xBD,
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
