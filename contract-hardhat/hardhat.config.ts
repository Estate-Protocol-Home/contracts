import { HardhatUserConfig } from "hardhat/config";
import dotenv from 'dotenv';
import "@nomicfoundation/hardhat-toolbox";

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  throw dotenvResult.error;
}

const {
  PROVIDER_URL,
  OWNER_PRIVATE_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

const accounts = [...(OWNER_PRIVATE_KEY ? [OWNER_PRIVATE_KEY] : [])];

const config: HardhatUserConfig = {
  networks: {
    local: {
      url: PROVIDER_URL,
      chainId: 31337,
    },
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
  // paths: {
  //   sources: "../contracts",
  // },
};

export default config;
