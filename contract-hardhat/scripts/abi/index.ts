import ModuleRegistryProxy from '../../artifacts/contracts/proxy/ModuleRegistryProxy.sol/ModuleRegistryProxy.json'
import ModuleRegistry from '../../artifacts/contracts/ModuleRegistry.sol/ModuleRegistry.json'
import SecurityTokenRegistryProxy  from '../../artifacts/contracts/proxy/SecurityTokenRegistryProxy.sol/SecurityTokenRegistryProxy.json'
import SecurityTokenRegistry from '../../artifacts/contracts/SecurityTokenRegistry.sol/SecurityTokenRegistry.json'
import PolymathRegistry from '../../artifacts/contracts/PolymathRegistry.sol/PolymathRegistry.json'

const moduleRegistryProxyABI = ModuleRegistryProxy.abi
const securityTokenRegistryABI = SecurityTokenRegistry.abi
const securityTokenRegistryProxyABI =  SecurityTokenRegistryProxy.abi
const polymathRegistryABI = PolymathRegistry.abi
const moduleRegistryABI = ModuleRegistry.abi

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



export {tokenInitBytes, functionSignatureProxy, moduleRegistryABI, polymathRegistryABI, functionSignatureProxyMR, moduleRegistryProxyABI, securityTokenRegistryABI, securityTokenRegistryProxyABI}