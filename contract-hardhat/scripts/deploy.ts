import { ethers } from "hardhat";
import { ethers as mainEthers } from "ethers";
import assert from "assert";

const Web3 = require("web3");
let BN = Web3.utils.BN;

const {
  CHAIN_ID,
  OWNER_ADDRESS,
  PROVIDER_URL
} = process.env;

    const tokenInitBytes = {
        name: "initialize",
        type: "function",
        inputs: [
            {
                type: "address",
                name: "_getterDelegate"
            }
        ]
    };

    const functionSignatureProxy = {
        name: "initialize",
        type: "function",
        inputs: [
            {
                type: "address",
                name: "_polymathRegistry"
            },
            {
                type: "uint256",
                name: "_stLaunchFee"
            },
            {
                type: "uint256",
                name: "_tickerRegFee"
            },
            {
                type: "address",
                name: "_owner"
            },
            {
                type: 'address',
                name: '_getterContract'
            }
        ]
    };

    const functionSignatureProxyMR = {
        name: "initialize",
        type: "function",
        inputs: [
            {
                type: "address",
                name: "_polymathRegistry"
            },
            {
                type: "address",
                name: "_owner"
            }
        ]
    };

    const moduleRegistryABI = [
    {
      "constant": true,
      "inputs": [
        {
          "name": "_variable",
          "type": "bytes32"
        }
      ],
      "name": "getBytes32Value",
      "outputs": [
        {
          "name": "",
          "type": "bytes32"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_moduleType",
          "type": "uint8"
        },
        {
          "name": "_securityToken",
          "type": "address"
        }
      ],
      "name": "getTagsByTypeAndToken",
      "outputs": [
        {
          "name": "",
          "type": "bytes32[]"
        },
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_moduleFactory",
          "type": "address"
        },
        {
          "name": "_securityToken",
          "type": "address"
        }
      ],
      "name": "isCompatibleModule",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_moduleFactory",
          "type": "address"
        }
      ],
      "name": "verifyModule",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_moduleFactory",
          "type": "address"
        },
        {
          "name": "_isUpgrade",
          "type": "bool"
        }
      ],
      "name": "useModule",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "unpause",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_variable",
          "type": "bytes32"
        }
      ],
      "name": "getBytesValue",
      "outputs": [
        {
          "name": "",
          "type": "bytes"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_polymathRegistry",
          "type": "address"
        },
        {
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "initialize",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_moduleType",
          "type": "uint8"
        }
      ],
      "name": "getTagsByType",
      "outputs": [
        {
          "name": "",
          "type": "bytes32[]"
        },
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_variable",
          "type": "bytes32"
        }
      ],
      "name": "getAddressValue",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_factoryAddress",
          "type": "address"
        }
      ],
      "name": "getFactoryDetails",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        },
        {
          "name": "",
          "type": "address"
        },
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_key",
          "type": "bytes32"
        }
      ],
      "name": "getArrayAddress",
      "outputs": [
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "pause",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_tokenContract",
          "type": "address"
        }
      ],
      "name": "reclaimERC20",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_variable",
          "type": "bytes32"
        }
      ],
      "name": "getBoolValue",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_moduleFactory",
          "type": "address"
        }
      ],
      "name": "removeModule",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_moduleType",
          "type": "uint8"
        }
      ],
      "name": "getAllModulesByType",
      "outputs": [
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_variable",
          "type": "bytes32"
        }
      ],
      "name": "getStringValue",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_key",
          "type": "bytes32"
        }
      ],
      "name": "getArrayBytes32",
      "outputs": [
        {
          "name": "",
          "type": "bytes32[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_moduleType",
          "type": "uint8"
        }
      ],
      "name": "getModulesByType",
      "outputs": [
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_moduleFactory",
          "type": "address"
        }
      ],
      "name": "registerModule",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "isPaused",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_moduleFactory",
          "type": "address"
        }
      ],
      "name": "unverifyModule",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_moduleFactory",
          "type": "address"
        }
      ],
      "name": "useModule",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_variable",
          "type": "bytes32"
        }
      ],
      "name": "getUintValue",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_moduleType",
          "type": "uint8"
        },
        {
          "name": "_securityToken",
          "type": "address"
        }
      ],
      "name": "getModulesByTypeAndToken",
      "outputs": [
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "updateFromRegistry",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_key",
          "type": "bytes32"
        }
      ],
      "name": "getArrayUint",
      "outputs": [
        {
          "name": "",
          "type": "uint256[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Pause",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Unpause",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_moduleFactory",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_securityToken",
          "type": "address"
        }
      ],
      "name": "ModuleUsed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_moduleFactory",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "ModuleRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_moduleFactory",
          "type": "address"
        }
      ],
      "name": "ModuleVerified",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_moduleFactory",
          "type": "address"
        }
      ],
      "name": "ModuleUnverified",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_moduleFactory",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_decisionMaker",
          "type": "address"
        }
      ],
      "name": "ModuleRemoved",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    }
  ];

    const polymathRegistryABI = [
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "bytes32"
        }
      ],
      "name": "storedAddresses",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_tokenContract",
          "type": "address"
        }
      ],
      "name": "reclaimERC20",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "isOwner",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_nameKey",
          "type": "string"
        },
        {
          "name": "_newAddress",
          "type": "address"
        }
      ],
      "name": "changeAddress",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_nameKey",
          "type": "string"
        }
      ],
      "name": "getAddress",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "_nameKey",
          "type": "string"
        },
        {
          "indexed": true,
          "name": "_oldAddress",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_newAddress",
          "type": "address"
        }
      ],
      "name": "ChangeAddress",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    }
  ];

  const xxx = [
    {
      "constant": false,
      "inputs": [
        {
          "name": "_data",
          "type": "bytes"
        }
      ],
      "name": "deploy",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "name": "",
          "type": "bytes32"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_module",
          "type": "address"
        }
      ],
      "name": "upgrade",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_setupCost",
          "type": "uint256"
        }
      ],
      "name": "changeSetupCost",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_tagsData",
          "type": "bytes32[]"
        }
      ],
      "name": "changeTags",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "setupCostInPoly",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_title",
          "type": "string"
        }
      ],
      "name": "changeTitle",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_version",
          "type": "string"
        },
        {
          "name": "_logicContract",
          "type": "address"
        },
        {
          "name": "_upgradeData",
          "type": "bytes"
        }
      ],
      "name": "setLogicContract",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "isCostInPoly",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "title",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "version",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "latestUpgrade",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "logicContracts",
      "outputs": [
        {
          "name": "version",
          "type": "string"
        },
        {
          "name": "logicContract",
          "type": "address"
        },
        {
          "name": "upgradeData",
          "type": "bytes"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "description",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "polymathRegistry",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "setupCost",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getLowerSTVersionBounds",
      "outputs": [
        {
          "name": "",
          "type": "uint8[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_name",
          "type": "bytes32"
        }
      ],
      "name": "changeName",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "isOwner",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getTags",
      "outputs": [
        {
          "name": "",
          "type": "bytes32[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "address"
        },
        {
          "name": "",
          "type": "address"
        }
      ],
      "name": "modules",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "name": "moduleToSecurityToken",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getTypes",
      "outputs": [
        {
          "name": "",
          "type": "uint8[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_setupCost",
          "type": "uint256"
        },
        {
          "name": "_isCostInPoly",
          "type": "bool"
        }
      ],
      "name": "changeCostAndType",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_upgrade",
          "type": "uint256"
        },
        {
          "name": "_version",
          "type": "string"
        },
        {
          "name": "_logicContract",
          "type": "address"
        },
        {
          "name": "_upgradeData",
          "type": "bytes"
        }
      ],
      "name": "updateLogicContract",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_description",
          "type": "string"
        }
      ],
      "name": "changeDescription",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getUpperSTVersionBounds",
      "outputs": [
        {
          "name": "",
          "type": "uint8[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_boundType",
          "type": "string"
        },
        {
          "name": "_newVersion",
          "type": "uint8[]"
        }
      ],
      "name": "changeSTVersionBounds",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "_setupCost",
          "type": "uint256"
        },
        {
          "name": "_logicContract",
          "type": "address"
        },
        {
          "name": "_polymathRegistry",
          "type": "address"
        },
        {
          "name": "_isCostInPoly",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "_version",
          "type": "string"
        },
        {
          "indexed": false,
          "name": "_upgrade",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "_logicContract",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "_upgradeData",
          "type": "bytes"
        }
      ],
      "name": "LogicContractSet",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_module",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_securityToken",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_version",
          "type": "uint256"
        }
      ],
      "name": "ModuleUpgraded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "_oldSetupCost",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "_newSetupCost",
          "type": "uint256"
        }
      ],
      "name": "ChangeSetupCost",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "_isOldCostInPoly",
          "type": "bool"
        },
        {
          "indexed": false,
          "name": "_isNewCostInPoly",
          "type": "bool"
        }
      ],
      "name": "ChangeCostType",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "_module",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_moduleName",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "name": "_moduleFactory",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "_creator",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "_setupCost",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "_setupCostInPoly",
          "type": "uint256"
        }
      ],
      "name": "GenerateModuleFromFactory",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "_boundType",
          "type": "string"
        },
        {
          "indexed": false,
          "name": "_major",
          "type": "uint8"
        },
        {
          "indexed": false,
          "name": "_minor",
          "type": "uint8"
        },
        {
          "indexed": false,
          "name": "_patch",
          "type": "uint8"
        }
      ],
      "name": "ChangeSTVersionBound",
      "type": "event"
    }
  ]

async function main() {
  assert(CHAIN_ID, 'Error: CHAIN_ID');
  assert(OWNER_ADDRESS, 'Error: OWNER_ADDRESS');

  const nullAddress = "0x0000000000000000000000000000000000000000";

  const web3 = new Web3(new Web3.providers.HttpProvider(PROVIDER_URL));

  const { chainId } = await ethers.provider.getNetwork();
  assert(BigInt(CHAIN_ID) === chainId, `${CHAIN_ID} !== ${chainId}; wrong .env config?`);

  const deployer = await ethers.getSigner(OWNER_ADDRESS);

  // const polymathRegistryAddress = "0xF4b5bD2a07f477D0EC3b1D4260d665CF214ADB8b"
  // const moduleRegistryAddress = "0xd2D7527A7EE2Af4d6a2b1e09E8064c3aD67E280A"

  // const PolyTokenFaucet = await ethers.deployContract("PolyTokenFaucet", deployer);
  // await PolyTokenFaucet.waitForDeployment();
  // const PolyTokenFaucetContractAddress = await PolyTokenFaucet.getAddress();

  // console.log({PolyTokenFaucetContractAddress})

  const paddedPOLY = ethers.zeroPadValue(web3.utils.fromAscii("POLY"), 32)
  const paddedUSD = ethers.zeroPadValue(web3.utils.fromAscii("USD"), 32)
  const paddedETH = ethers.zeroPadValue(web3.utils.fromAscii("ETH"), 32)

  console.log({
    paddedPOLY,
    paddedUSD,
    paddedETH
  })

  // const PolyMockOracle = await ethers.deployContract("MockOracle", ["0xEA6c4E0785BAE641C83Db7739f47D84971b6F036", paddedPOLY, paddedUSD, "50000000000000000000"], deployer);
  // await PolyMockOracle.waitForDeployment();
  // const PolyMockOracleContractAddress = await PolyMockOracle.getAddress();

  // console.log({PolyMockOracleContractAddress})

  // const StableOracle = await ethers.deployContract("StableOracle",[PolyMockOracleContractAddress, "10000000000000000"], deployer);
  // await StableOracle.waitForDeployment();
  // const StableOracleContractAddress = await StableOracle.getAddress();

  // console.log({StableOracleContractAddress})

  // const ETHOracle = await ethers.deployContract("MockOracle",[nullAddress, paddedETH, paddedUSD, "500000000000000000000"], deployer);
  // await ETHOracle.waitForDeployment();
  // const ETHOracleContractAddress = await ETHOracle.getAddress();

  // console.log({ETHOracleContractAddress})


  const provider = new mainEthers.JsonRpcProvider(PROVIDER_URL);
  const PolyToken = "0xEA6c4E0785BAE641C83Db7739f47D84971b6F036"
  const PolymathAccount = OWNER_ADDRESS;

  // Connect to the deployed contract using its address and ABI
  // const polymathRegistry = new mainEthers.Contract(polymathRegistryAddress, polymathRegistryABI, deployer);
  // const moduleRegistry = new mainEthers.Contract(moduleRegistryAddress, moduleRegistryABI, deployer);

  // const PolymathRegistry = await ethers.deployContract("PolymathRegistry", deployer);
  // await PolymathRegistry.waitForDeployment();
  // const PolymathRegistryContractAddress = await PolymathRegistry.getAddress();

  // console.log({ PolymathRegistryContractAddress })
  
  // await PolymathRegistry.changeAddress("PolyToken", PolyToken)

  // const TokenLib = await ethers.deployContract("TokenLib", deployer);
  // await TokenLib.waitForDeployment();
  // const TokenLibContractAddress = await TokenLib.getAddress();

  // console.log({ TokenLibContractAddress })

  // const VolumeRestrictionLib = await ethers.deployContract("VolumeRestrictionLib", deployer);
  // await VolumeRestrictionLib.waitForDeployment();
  // const VolumeRestrictionLibContractAddress = await VolumeRestrictionLib.getAddress();

  // console.log({ VolumeRestrictionLibContractAddress })

  // const ModuleRegistry = await ethers.deployContract("ModuleRegistry", deployer);
  // await ModuleRegistry.waitForDeployment();
  // const ModuleRegistryContractAddress = await ModuleRegistry.getAddress();

  // console.log({ ModuleRegistryContractAddress })

  // const ModuleRegistryProxy = await ethers.deployContract("ModuleRegistryProxy", deployer);
  // await ModuleRegistryProxy.waitForDeployment();
  // const ModuleRegistryProxyContractAddress = await ModuleRegistryProxy.getAddress();

  // console.log({ ModuleRegistryProxyContractAddress })

  // let bytesProxyMR = web3.eth.abi.encodeFunctionCall(functionSignatureProxyMR, [PolymathRegistryContractAddress, PolymathAccount]);
  // await ModuleRegistryProxy.upgradeToAndCall("1.0.0", ModuleRegistryContractAddress, bytesProxyMR, { from: PolymathAccount });
  
  // await PolymathRegistry.changeAddress("ModuleRegistry", ModuleRegistryProxyContractAddress, { from: PolymathAccount });
  
  // const GeneralTransferManagerLogic = await ethers.deployContract("GeneralTransferManager", [nullAddress, nullAddress,], deployer);
  // await GeneralTransferManagerLogic.waitForDeployment();
  // const GeneralTransferManagerLogicContractAddress = await GeneralTransferManagerLogic.getAddress();
  // console.log({ GeneralTransferManagerLogicContractAddress })

  // const GeneralPermissionManagerLogic = await ethers.deployContract("GeneralPermissionManager", [nullAddress, nullAddress,], deployer);
  // await GeneralPermissionManagerLogic.waitForDeployment();
  // const GeneralPermissionManagerLogicContractAddress = await GeneralPermissionManagerLogic.getAddress();
  // console.log({ GeneralPermissionManagerLogicContractAddress })
  
  // const CountTransferManagerLogic = await ethers.deployContract("CountTransferManager", [nullAddress, nullAddress,], deployer);
  // await CountTransferManagerLogic.waitForDeployment();
  // const CountTransferManagerLogicContractAddress = await CountTransferManagerLogic.getAddress();
  // console.log({ CountTransferManagerLogicContractAddress })

  // const ManualApprovalTransferManagerLogic = await ethers.deployContract("ManualApprovalTransferManager", [nullAddress, nullAddress,], deployer);
  // await ManualApprovalTransferManagerLogic.waitForDeployment();
  // const ManualApprovalTransferManagerLogicContractAddress = await ManualApprovalTransferManagerLogic.getAddress();
  // console.log({ ManualApprovalTransferManagerLogicContractAddress })

  // const PercentageTransferManagerLogic = await ethers.deployContract("PercentageTransferManager", [nullAddress, nullAddress,], deployer);
  // await PercentageTransferManagerLogic.waitForDeployment();
  // const PercentageTransferManagerLogicContractAddress = await PercentageTransferManagerLogic.getAddress();
  // console.log({ PercentageTransferManagerLogicContractAddress })
  
  // const ERC20DividendCheckpointLogic = await ethers.deployContract("ERC20DividendCheckpoint", [nullAddress, nullAddress,], deployer);
  // await ERC20DividendCheckpointLogic.waitForDeployment();
  // const ERC20DividendCheckpointLogicContractAddress = await ERC20DividendCheckpointLogic.getAddress();
  // console.log({ ERC20DividendCheckpointLogicContractAddress })

  // const EtherDividendCheckpointLogic = await ethers.deployContract("EtherDividendCheckpoint", [nullAddress, nullAddress,], deployer);
  // await EtherDividendCheckpointLogic.waitForDeployment();
  // const EtherDividendCheckpointLogicContractAddress = await EtherDividendCheckpointLogic.getAddress();
  // console.log({ EtherDividendCheckpointLogicContractAddress })

  const USDTieredSTOLogic = await ethers.deployContract("USDTieredSTO", [nullAddress, nullAddress,], deployer);
  await USDTieredSTOLogic.waitForDeployment();
  const USDTieredSTOLogicContractAddress = await USDTieredSTOLogic.getAddress();
  // const USDTieredSTOLogicContractAddress = "0x652C3b99FB9980AE3729BD8b9bBA61EFb73C14eC";
  console.log({ USDTieredSTOLogicContractAddress })
  
  // const USDTieredSTOFactoryContractAddress = "0x4e2f7a1307Ac696082740bC5043A70A77D713C2f";

  // const USDTieredSTOFactory = new mainEthers.Contract(USDTieredSTOFactoryContractAddress, xxx, deployer);

  // const hello = await USDTieredSTOFactory.latestUpgrade();

  // console.log({hello: hello.toString()})

  // const tx = await USDTieredSTOFactory.updateLogicContract(
  //   0, "4.0.0", USDTieredSTOLogicContractAddress, mainEthers.ZeroHash
  // );
  // console.log({tx})

  const USDTieredSTOFactory = await ethers.deployContract("USDTieredSTOFactory", [0, USDTieredSTOLogicContractAddress, "0xA22a52b63A14eef0CDFeF4C2E72718B17fFE4c8f"], deployer);
  await USDTieredSTOFactory.waitForDeployment();
  const USDTieredSTOFactoryContractAddress = await USDTieredSTOFactory.getAddress();
  console.log({USDTieredSTOFactoryContractAddress})

  // const polymathRegistry = new mainEthers.Contract("0xe33129eca5951e4b915b2EdeaB09aD7D01B0296E", polymathRegistryABI, deployer);

  // const hh = await polymathRegistry["getAddress(string)"]("ModuleRegistry")

  // const registryAddress = await polymathRegistry.getAddress("ModuleRegistry");
  // console.log({hh, registryAddress})
//  const tx = await USDTieredSTOFactory.updateLogicContract(
//     0, "4.0.0", USDTieredSTOLogicContractAddress, mainEthers.ZeroHash
//   );
//   console.log({tx})
  const moduleRegistry = new mainEthers.Contract("0x4d6585268eF16c14AeCd2A74bdEaF8B5beFa77B5", moduleRegistryABI, deployer);

  // const x = await moduleRegistry.removeModule("0x4e2f7a1307Ac696082740bC5043A70A77D713C2f")

  // console.log({x})

  const y = await moduleRegistry.registerModule(USDTieredSTOFactoryContractAddress)

  console.log({y})
  const z = await moduleRegistry.verifyModule(USDTieredSTOFactoryContractAddress)
  console.log({z})


  // const VolumeRestrictionTMLogic= await ethers.getContractFactory("VolumeRestrictionTM",  { 
  //   signer: deployer, 
  //   libraries: { 
  //     VolumeRestrictionLib: VolumeRestrictionLibContractAddress
  //   } 
  // });
  // const volumeRestrictionTMLogic = await VolumeRestrictionTMLogic.deploy(nullAddress, nullAddress);
  // const volumeRestrictionTMLogicContractAddress = await volumeRestrictionTMLogic.getAddress();

  // console.log({volumeRestrictionTMLogicContractAddress})
  
  // const CappedSTOLogic = await ethers.deployContract("CappedSTO", [nullAddress, nullAddress], deployer);
  // await CappedSTOLogic.waitForDeployment();
  // const CappedSTOLogicContractAddress = await CappedSTOLogic.getAddress();
  
  // console.log({CappedSTOLogicContractAddress})
  
  // const VestingEscrowWalletLogic = await ethers.deployContract("VestingEscrowWallet", [nullAddress, nullAddress], deployer);
  // await VestingEscrowWalletLogic.waitForDeployment();
  // const VestingEscrowWalletLogicContractAddress = await VestingEscrowWalletLogic.getAddress();
  // console.log({VestingEscrowWalletLogicContractAddress})
  
  // const DataStoreLogic = await ethers.deployContract("DataStore", deployer);
  // await DataStoreLogic.waitForDeployment();
  // const DataStoreLogicContractAddress = await DataStoreLogic.getAddress();
  // console.log({DataStoreLogicContractAddress})

  // const SecurityTokenLogic= await ethers.getContractFactory("SecurityToken",  { 
  //   signer: deployer, 
  //   libraries: { 
  //     TokenLib: TokenLibContractAddress
  //   } 
  // });
  // const securityTokenLogic = await SecurityTokenLogic.deploy();
  // const SecurityTokenLogicContractAddress = await securityTokenLogic.getAddress();
  // console.log({SecurityTokenLogicContractAddress})

  // const DataStoreFactory = await ethers.deployContract("DataStoreFactory", [DataStoreLogicContractAddress], deployer);
  // await DataStoreFactory.waitForDeployment();
  // const DataStoreFactoryContractAddress = await DataStoreFactory.getAddress();
  // console.log({DataStoreFactoryContractAddress})

  // const GeneralTransferManagerFactory = await ethers.deployContract("GeneralTransferManagerFactory", [0, GeneralTransferManagerLogicContractAddress, PolymathRegistryContractAddress], deployer);
  // await GeneralTransferManagerFactory.waitForDeployment();
  // const GeneralTransferManagerFactoryContractAddress = await GeneralTransferManagerFactory.getAddress();
  // console.log({GeneralTransferManagerFactoryContractAddress})

  // const GeneralPermissionManagerFactory = await ethers.deployContract("GeneralPermissionManagerFactory", [0, GeneralPermissionManagerLogicContractAddress, PolymathRegistryContractAddress], deployer);
  // await GeneralPermissionManagerFactory.waitForDeployment();
  // const GeneralPermissionManagerFactoryContractAddress = await GeneralPermissionManagerFactory.getAddress();
  // console.log({GeneralPermissionManagerFactoryContractAddress})

  // const CountTransferManagerFactory = await ethers.deployContract("CountTransferManagerFactory", [0, CountTransferManagerLogicContractAddress, PolymathRegistryContractAddress], deployer);
  // await CountTransferManagerFactory.waitForDeployment();
  // const CountTransferManagerFactoryContractAddress = await CountTransferManagerFactory.getAddress();
  // console.log({CountTransferManagerFactoryContractAddress})

  // const PercentageTransferManagerFactory = await ethers.deployContract("PercentageTransferManagerFactory", [0, PercentageTransferManagerLogicContractAddress, PolymathRegistryContractAddress], deployer);
  // await PercentageTransferManagerFactory.waitForDeployment();
  // const PercentageTransferManagerFactoryContractAddress = await PercentageTransferManagerFactory.getAddress();
  // console.log({PercentageTransferManagerFactoryContractAddress})

  // const EtherDividendCheckpointFactory = await ethers.deployContract("EtherDividendCheckpointFactory", [0, EtherDividendCheckpointLogicContractAddress, PolymathRegistryContractAddress], deployer);
  // await EtherDividendCheckpointFactory.waitForDeployment();
  // const EtherDividendCheckpointFactoryContractAddress = await EtherDividendCheckpointFactory.getAddress();
  // console.log({EtherDividendCheckpointFactoryContractAddress})

  // const ERC20DividendCheckpointFactory = await ethers.deployContract("ERC20DividendCheckpointFactory", [0, ERC20DividendCheckpointLogicContractAddress, PolymathRegistryContractAddress], deployer);
  // await ERC20DividendCheckpointFactory.waitForDeployment();
  // const ERC20DividendCheckpointFactoryContractAddress = await ERC20DividendCheckpointFactory.getAddress();
  // console.log({ERC20DividendCheckpointFactoryContractAddress})

  // const VolumeRestrictionTMFactory = await ethers.deployContract("VolumeRestrictionTMFactory", [0, volumeRestrictionTMLogicContractAddress, PolymathRegistryContractAddress], deployer);
  // await VolumeRestrictionTMFactory.waitForDeployment();
  // const VolumeRestrictionTMFactoryContractAddress = await VolumeRestrictionTMFactory.getAddress();
  // console.log({VolumeRestrictionTMFactoryContractAddress})

  // const ManualApprovalTransferManagerFactory = await ethers.deployContract("ManualApprovalTransferManagerFactory", [0, ManualApprovalTransferManagerLogicContractAddress, PolymathRegistryContractAddress], deployer);
  // await ManualApprovalTransferManagerFactory.waitForDeployment();
  // const ManualApprovalTransferManagerFactoryContractAddress = await ManualApprovalTransferManagerFactory.getAddress();
  // console.log({ManualApprovalTransferManagerFactoryContractAddress})

  // const VestingEscrowWalletFactory = await ethers.deployContract("VestingEscrowWalletFactory", [0, VestingEscrowWalletLogicContractAddress, PolymathRegistryContractAddress], deployer);
  // await VestingEscrowWalletFactory.waitForDeployment();
  // const VestingEscrowWalletFactoryContractAddress = await VestingEscrowWalletFactory.getAddress();
  // console.log({VestingEscrowWalletFactoryContractAddress})

  // const STGetter = await ethers.getContractFactory("STGetter",  { 
  //   signer: deployer, 
  //   libraries: { 
  //     TokenLib: TokenLibContractAddress
  //   } 
  // });
  // const sTGetter = await STGetter.deploy();
  // const STGetterContractAddress = await sTGetter.getAddress();
  // console.log({STGetterContractAddress})


  // let tokenInitBytesCall = web3.eth.abi.encodeFunctionCall(tokenInitBytes, ["0xA211d507b24A8E0C750D7343Dc5e3E1de2e2f490"]);
  // console.log({tokenInitBytesCall})
  


  // const STFactory = await ethers.deployContract("STFactory", [PolymathRegistryContractAddress, GeneralTransferManagerFactoryContractAddress, DataStoreFactoryContractAddress, "3.0.0", SecurityTokenLogicContractAddress, tokenInitBytesCall], deployer);
  // await STFactory.waitForDeployment();
  // const STFactoryContractAddress = await STFactory.getAddress();
  // console.log({STFactoryContractAddress})

  // const FeatureRegistry = await ethers.deployContract("FeatureRegistry", deployer);
  // await FeatureRegistry.waitForDeployment();
  // const FeatureRegistryContractAddress = await FeatureRegistry.getAddress();
  // console.log({FeatureRegistryContractAddress})

  // await PolymathRegistry.changeAddress("FeatureRegistry", FeatureRegistryContractAddress);

  // const SecurityTokenRegistry = await ethers.deployContract("SecurityTokenRegistry", deployer);
  // await SecurityTokenRegistry.waitForDeployment();
  // const SecurityTokenRegistryContractAddress = await SecurityTokenRegistry.getAddress();
  // console.log({SecurityTokenRegistryContractAddress})

  // const SecurityTokenRegistryProxy = await ethers.deployContract("SecurityTokenRegistryProxy", deployer);
  // await SecurityTokenRegistryProxy.waitForDeployment();
  // const SecurityTokenRegistryProxyContractAddress = await SecurityTokenRegistryProxy.getAddress();
  // console.log({SecurityTokenRegistryProxyContractAddress})

  // const STRGetter = await ethers.deployContract("STRGetter", deployer);
  // await STRGetter.waitForDeployment();
  // const STRGetterContractAddress = await STRGetter.getAddress();
  // console.log({STRGetterContractAddress})

  // const initRegFee = 0;

  // let bytesProxy = web3.eth.abi.encodeFunctionCall(functionSignatureProxy, [
  //     PolymathRegistryContractAddress,
  //     initRegFee.toString(),
  //     initRegFee.toString(),
  //     OWNER_ADDRESS,
  //     STRGetterContractAddress
  // ]);
  // await SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", SecurityTokenRegistryContractAddress, bytesProxy);

  // const xSecurityTokenRegistry  = await ethers.getContractAt("SecurityTokenRegistry", SecurityTokenRegistryProxyContractAddress, deployer);
  // await xSecurityTokenRegistry.setProtocolFactory(STFactoryContractAddress, 3, 0, 0)
  // await xSecurityTokenRegistry.setLatestVersion(3, 0, 0);

  // await PolymathRegistry.changeAddress("SecurityTokenRegistry", SecurityTokenRegistryProxyContractAddress);

  // const moduleRegistry = new mainEthers.Contract("0x4d6585268eF16c14AeCd2A74bdEaF8B5beFa77B5", moduleRegistryABI, deployer);


  // await moduleRegistry.updateFromRegistry()
  
  // await moduleRegistry.registerModule("0xE5d03bcc75643c70726dDf6b212eA83Eba767679")
  // await moduleRegistry.registerModule("0xf74cdC2a5ECBaFC19Ba1615eA8C6f5Aa5e8dcB5c")
  // await moduleRegistry.registerModule("0xceB06a6E59D76D3722e1AF30f2d6c290831AecF5")
  // await moduleRegistry.registerModule("0xEb9c206017e9E880F9EE844742C6e98eF786D0A1")
  // await moduleRegistry.registerModule("0x63680570081594BD2738814A8730C38550eEC027")
  // await moduleRegistry.registerModule("0x6862aDdf4af5f852982D5d2ea2Dc195D2574a13A")
  // await moduleRegistry.registerModule("0x177e1AC23D2bA8eF983FADDC8C5BAAd01Aa6b3B9")
  // await moduleRegistry.registerModule("0xc2423aAa4f9f342456BE4718a17A0DC973F39eEE")
  // await moduleRegistry.registerModule("0xAd0dC9ee0877AF2870114aDB3E74756e5fa2aAdE")
  
  // await moduleRegistry.verifyModule("0xE5d03bcc75643c70726dDf6b212eA83Eba767679")
  // await moduleRegistry.verifyModule("0xf74cdC2a5ECBaFC19Ba1615eA8C6f5Aa5e8dcB5c")
  // await moduleRegistry.verifyModule("0xceB06a6E59D76D3722e1AF30f2d6c290831AecF5")
  // await moduleRegistry.verifyModule("0xEb9c206017e9E880F9EE844742C6e98eF786D0A1")
  // await moduleRegistry.verifyModule("0x63680570081594BD2738814A8730C38550eEC027")
  // await moduleRegistry.verifyModule("0x6862aDdf4af5f852982D5d2ea2Dc195D2574a13A")
  // await moduleRegistry.verifyModule("0x177e1AC23D2bA8eF983FADDC8C5BAAd01Aa6b3B9")
  // await moduleRegistry.verifyModule("0xc2423aAa4f9f342456BE4718a17A0DC973F39eEE")
  // await moduleRegistry.verifyModule("0xAd0dC9ee0877AF2870114aDB3E74756e5fa2aAdE")
  
  // await polymathRegistry.changeAddress("PolyToken", "0xEA6c4E0785BAE641C83Db7739f47D84971b6F036");
  // await polymathRegistry.changeAddress("PolyUsdOracle", "0x61bE7271E5cbc8659bd82aCcF7Dd35baCCD57F0E");
  // await polymathRegistry.changeAddress("EthUsdOracle", "0x77E8c402c91779b818382e36a1122E11061538e7");
  // await polymathRegistry.changeAddress("StablePolyUsdOracle", "0x9ca476a91Eb04206Beab39AdcB63B0282A89A900");

  // const PolymathRegistryContractAddress = "0xA22a52b63A14eef0CDFeF4C2E72718B17fFE4c8f"


  // const CappedSTOFactory = await ethers.deployContract("CappedSTOFactory", [0, "0xe96C43370DA2A89Bb457B5e8d7C1c84bCf72967a", PolymathRegistryContractAddress], deployer);
  // await CappedSTOFactory.waitForDeployment();
  // const CappedSTOFactoryContractAddress = await CappedSTOFactory.getAddress();
  // console.log({CappedSTOFactoryContractAddress})

  // await moduleRegistry.registerModule(CappedSTOFactoryContractAddress)
  // await moduleRegistry.verifyModule(CappedSTOFactoryContractAddress)

  // const USDTieredSTOFactory = await ethers.deployContract("USDTieredSTOFactory", [0, "0xB5d7e10cA7d57D7B93DB288C1231b18d443660DF", PolymathRegistryContractAddress], deployer);
  // await USDTieredSTOFactory.waitForDeployment();
  // const USDTieredSTOFactoryContractAddress = await USDTieredSTOFactory.getAddress();
  // console.log({USDTieredSTOFactoryContractAddress})

  // await moduleRegistry.registerModule(USDTieredSTOFactoryContractAddress)
  // await moduleRegistry.verifyModule(USDTieredSTOFactoryContractAddress)


  // const polymathRegistry = new mainEthers.Contract(PolymathRegistryContractAddress, polymathRegistryABI, deployer);


  // await polymathRegistry.changeAddress("PolyToken", "0xEA6c4E0785BAE641C83Db7739f47D84971b6F036");
  // await polymathRegistry.changeAddress("PolyUsdOracle", "0x61bE7271E5cbc8659bd82aCcF7Dd35baCCD57F0E");
  // await polymathRegistry.changeAddress("EthUsdOracle", "0x77E8c402c91779b818382e36a1122E11061538e7");
  // await polymathRegistry.changeAddress("StablePolyUsdOracle", "0x9ca476a91Eb04206Beab39AdcB63B0282A89A900");


  // const PolyToken = "0xe12f29704f635f4a6e7ae154838d21f9b33809e9"; // Mainnet PolyToken Address
  // const POLYOracle = "0xCa05e0621Bb1052c96eA08739ad235B4219f13b0"; // Poly Oracle Mainnet Address
  // const ETHOracle = "0x00d99D06168d95f52852849008812B569D3cB37c"; // ETH Oracle Mainnet Address
  // const StablePOLYOracle = ""; // TODO


  // await polymathRegistry.changeAddress("PolyUsdOracle", POLYOracle);
  // await polymathRegistry.changeAddress("EthUsdOracle", ETHOracle);
  // await polymathRegistry.changeAddress("StablePolyUsdOracle", StablePOLYOracle);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
