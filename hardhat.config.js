require('dotenv').config();

const {
  PROVIDER_URL,
  OWNER_PRIVATE_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

const accounts = OWNER_PRIVATE_KEY ? [OWNER_PRIVATE_KEY] : [];

const config = {
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      chainId: 1337,
      url: 'http://localhost:8545',
    },
    goerli: {
      url: PROVIDER_URL,
      accounts,
      chainId: 5,
    },
    arbitrumTest: {
      url: PROVIDER_URL,
      accounts,
      chainId: 137,
      timeout: 60 * 60 * 1000 // 1 hour
    },
    arbitrumMainnet: {
      url: PROVIDER_URL,
      accounts,
      chainId: 42161,
      timeout: 60 * 60 * 1000 // 1 hour
    }
  }, 
  solidity: {
    version: '0.5.8',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  customChains: [
      {
        network: "arbitrum-one",
        chainId: 42161,
        urls: {
          apiURL: "https://arbitrum.blockscout.com/api",
          browserURL: "https://arbitrum.blockscout.com"
        }
      }
    ]
};

module.exports = config;
