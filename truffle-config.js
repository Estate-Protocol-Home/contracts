require('babel-register');
require('babel-polyfill');
require('dotenv').config();
const fs = require('fs');
const NonceTrackerSubprovider = require("web3-provider-engine/subproviders/nonce-tracker")

const HDWalletProvider = require("@truffle/hdwallet-provider");

// Truffle re-invokes the provider factory for every operation when it is
// a function, so wallet + throttle state must live at module scope.
let _arbitrumSepoliaWallet = null;
const RATE_LIMIT_MS = 1000;
let nextAvailableAt = 0;

let ver;
if (process.env.POLYMATH_NATIVE_SOLC) {
  ver = "native";
} else {
  ver = "0.5.8";
}

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '1337', // Match any network id
      gas: 8000000,
    },
    mainnet: {
      host: 'localhost',
      port: 8545,
      network_id: '1', // Match any network id
      gas: 7900000,
      gasPrice: 10000000000
    },
    ropsten: {
      // provider: new HDWalletProvider(privKey, "http://localhost:8545"),
      host: 'localhost',
      port: 8545,
      network_id: '3', // Match any network id
      gas: 4500000,
      gasPrice: 150000000000
    },
    rinkeby: {
      // provider: new HDWalletProvider(privKey, "http://localhost:8545"),
      host: 'localhost',
      port: 8545,
      network_id: '4', // Match any network id
      gas: 7500000,
      gasPrice: 10000000000
    },
    kovan: {
      provider: () => {
        const key = fs.readFileSync('./privKey').toString();
        let wallet = new HDWalletProvider(key, "https://kovan.infura.io/")
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      network_id: '42', // Match any network id
      gas: 7900000,
      gasPrice: 5000000000
    },
    arbitrumSepolia: {
      // from: "your_ethereum_address", // Replace with your Ethereum address corresponding to the private key
      // provider: () => {
      //   const key = fs.readFileSync('./privKey').toString();
      //   return new Web3.providers.HttpProvider('https://goerli-rollup.arbitrum.io/rpc', { privateKeys: [key] });
      // },
      provider: () => {
        // Return cached instance — Truffle re-calls this factory per
        // operation, so we must not recreate the wallet each time.
        if (_arbitrumSepoliaWallet) return _arbitrumSepoliaWallet;

        let key = process.env.PRIVATE_KEY;

        if (!key) {
          throw new Error('PRIVATE_KEY not set in .env file or privKey file not found');
        }

        key = key.trim()
              .replace('0x', '')
              .replace(/['"]/g, '');

        const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc/";

        let wallet = new HDWalletProvider(key, rpcUrl)
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)

        // Uncomment this block to throttle transactions if you encounter rate limiting while full deployment.  Adjust RATE_LIMIT_MS as needed.

        // Throttle at engine.sendAsync — the single funnel point that
        // both wallet.send() and wallet.sendAsync() delegate to after
        // initialization.  Uses module-scope nextAvailableAt so state
        // survives across calls even if caching is bypassed.
        // const originalEngineSendAsync = wallet.engine.sendAsync.bind(wallet.engine);
        // wallet.engine.sendAsync = function(payload, callback) {
        //   const now = Date.now();
        //   const waitTime = Math.max(0, nextAvailableAt - now);
        //   nextAvailableAt = Math.max(now, nextAvailableAt) + RATE_LIMIT_MS;
        //   if (waitTime > 0) {
        //     setTimeout(() => originalEngineSendAsync(payload, callback), waitTime);
        //   } else {
        //     originalEngineSendAsync(payload, callback);
        //   }
        // };

        _arbitrumSepoliaWallet = wallet;
        return wallet
      },
      network_id: '421614', // Match any network id
      gas: 7900000,
      gasPrice: 100000000
    },
    arbitrumMainnet: {
      provider: () => {
        const key = "";
        let wallet = new HDWalletProvider(key, "https://arb1.arbitrum.io/rpc")
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      }, 
      network_id: '42161', // Match any network id
      gas: 11000000,
      gasPrice: 10000000000 // 10 Gwei
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8545,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffff  , // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    }
  },
  compilers: {
    solc: {
      version: ver,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  mocha: {
    enableTimeouts: false
  }
};