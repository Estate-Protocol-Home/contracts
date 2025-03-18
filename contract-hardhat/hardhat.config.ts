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
  SOURCIFY_API_URL,
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
    arbitrumSepolia: {
      url: PROVIDER_URL,
      accounts,
      chainId: 421614,
      timeout: 60 * 60 * 1000 // 1 hour
    },
    arbitrumMainnet: {
      url: PROVIDER_URL,
      accounts,
      chainId: 42161,
      timeout: 60 * 60 * 1000 // 1 hour
    },
  },
  solidity: {
    compilers:[
    {
      version: '0.5.8',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
    {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
    {
      version: "0.8.22",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  ],
  },
  sourcify: { 
    enabled: true, 
    apiUrl: SOURCIFY_API_URL, 
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  // paths: {
  //   sources: "../contracts",
  // },
};

export default config;
