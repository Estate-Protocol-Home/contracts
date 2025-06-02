import { ethers } from "hardhat";
import { ethers as mainEthers } from "ethers";
import assert from "assert";
import { functionSignatureProxy, functionSignatureProxyMR, moduleRegistryABI, moduleRegistryProxyABI, polymathRegistryABI, securityTokenRegistryABI, securityTokenRegistryProxyABI, tokenInitBytes } from "./abi";

const Web3 = require("web3");
let BN = Web3.utils.BN;

const {
  CHAIN_ID,
  OWNER_ADDRESS,
  PROVIDER_URL
} = process.env;


async function main() {
  assert(CHAIN_ID, 'Error: CHAIN_ID');
  assert(OWNER_ADDRESS, 'Error: OWNER_ADDRESS');

  const nullAddress = "0x0000000000000000000000000000000000000000";

  const web3 = new Web3(new Web3.providers.HttpProvider(PROVIDER_URL));

  const { chainId } = await ethers.provider.getNetwork();
  // assert(BigInt(CHAIN_ID!) === chainId, `${CHAIN_ID} !== ${chainId}; wrong .env config?`);

  const deployer = await ethers.getSigner(OWNER_ADDRESS);

  const PolymathRegistry = await ethers.deployContract("PolymathRegistry", deployer);
  await PolymathRegistry.waitForDeployment();
  // @ts-ignore
  const PolymathRegistryContractAddress = await PolymathRegistry.getAddress();

  console.log({ PolymathRegistryContractAddress })

  const ModuleRegistry = await ethers.deployContract("ModuleRegistry", deployer);
  await ModuleRegistry.waitForDeployment();
  const ModuleRegistryContractAddress = await ModuleRegistry.getAddress();

  console.log({ ModuleRegistryContractAddress })

  const PolyTokenFaucet = await ethers.deployContract("PolyTokenFaucet", deployer);
  await PolyTokenFaucet.waitForDeployment();
  const PolyTokenFaucetContractAddress = await PolyTokenFaucet.getAddress();

  console.log({PolyTokenFaucetContractAddress})

  const paddedPOLY = ethers.zeroPadValue(web3.utils.fromAscii("POLY"), 32)
  const paddedUSD = ethers.zeroPadValue(web3.utils.fromAscii("USD"), 32)
  const paddedETH = ethers.zeroPadValue(web3.utils.fromAscii("ETH"), 32)

  console.log({
    paddedPOLY,
    paddedUSD,
    paddedETH
  })

  const PolyMockOracle = await ethers.deployContract("MockOracle", [PolyTokenFaucetContractAddress, paddedPOLY, paddedUSD, "50000000000000000000"], deployer);
  await PolyMockOracle.waitForDeployment();
  const PolyMockOracleContractAddress = await PolyMockOracle.getAddress();

  console.log({PolyMockOracleContractAddress})

  const StableOracle = await ethers.deployContract("StableOracle",[PolyMockOracleContractAddress, "10000000000000000"], deployer);
  await StableOracle.waitForDeployment();
  const StableOracleContractAddress = await StableOracle.getAddress();

  console.log({StableOracleContractAddress})

  const ETHOracle = await ethers.deployContract("MockOracle",[nullAddress, paddedETH, paddedUSD, "500000000000000000000"], deployer);
  await ETHOracle.waitForDeployment();
  const ETHOracleContractAddress = await ETHOracle.getAddress();

  console.log({ETHOracleContractAddress})


  const PolyToken = PolyTokenFaucetContractAddress
  const PolymathAccount = OWNER_ADDRESS;

  // Connect to the deployed contract using its address and ABI
  const polymathRegistry = new mainEthers.Contract(PolymathRegistryContractAddress, polymathRegistryABI, deployer);

  
  await polymathRegistry.changeAddress("PolyToken", PolyToken)

  const TokenLib = await ethers.deployContract("TokenLib", deployer);
  await TokenLib.waitForDeployment();
  const TokenLibContractAddress = await TokenLib.getAddress();

  console.log({ TokenLibContractAddress })

  const VolumeRestrictionLib = await ethers.deployContract("VolumeRestrictionLib", deployer);
  await VolumeRestrictionLib.waitForDeployment();
  const VolumeRestrictionLibContractAddress = await VolumeRestrictionLib.getAddress();

  console.log({ VolumeRestrictionLibContractAddress })

  const ModuleRegistryProxy = await ethers.deployContract("ModuleRegistryProxy", deployer);
  await ModuleRegistryProxy.waitForDeployment();
  const ModuleRegistryProxyContractAddress = await ModuleRegistryProxy.getAddress();

  console.log({ ModuleRegistryProxyContractAddress })
  
  const moduleRegistryProxy = new mainEthers.Contract(ModuleRegistryProxyContractAddress, moduleRegistryProxyABI, deployer);

  let bytesProxyMR = web3.eth.abi.encodeFunctionCall(functionSignatureProxyMR, [PolymathRegistryContractAddress, PolymathAccount]);
  await moduleRegistryProxy.upgradeToAndCall("1.0.0", ModuleRegistryContractAddress, bytesProxyMR, { from: PolymathAccount });
  
  await polymathRegistry.changeAddress("ModuleRegistry", ModuleRegistryProxyContractAddress, { from: PolymathAccount });
  
  const GeneralTransferManagerLogic = await ethers.deployContract("GeneralTransferManager", [nullAddress, nullAddress,], deployer);
  await GeneralTransferManagerLogic.waitForDeployment();
  const GeneralTransferManagerLogicContractAddress = await GeneralTransferManagerLogic.getAddress();
  console.log({ GeneralTransferManagerLogicContractAddress })

  const GeneralPermissionManagerLogic = await ethers.deployContract("GeneralPermissionManager", [nullAddress, nullAddress,], deployer);
  await GeneralPermissionManagerLogic.waitForDeployment();
  const GeneralPermissionManagerLogicContractAddress = await GeneralPermissionManagerLogic.getAddress();
  console.log({ GeneralPermissionManagerLogicContractAddress })
  
  const CountTransferManagerLogic = await ethers.deployContract("CountTransferManager", [nullAddress, nullAddress,], deployer);
  await CountTransferManagerLogic.waitForDeployment();
  const CountTransferManagerLogicContractAddress = await CountTransferManagerLogic.getAddress();
  console.log({ CountTransferManagerLogicContractAddress })

  const ManualApprovalTransferManagerLogic = await ethers.deployContract("ManualApprovalTransferManager", [nullAddress, nullAddress,], deployer);
  await ManualApprovalTransferManagerLogic.waitForDeployment();
  const ManualApprovalTransferManagerLogicContractAddress = await ManualApprovalTransferManagerLogic.getAddress();
  console.log({ ManualApprovalTransferManagerLogicContractAddress })

  const PercentageTransferManagerLogic = await ethers.deployContract("PercentageTransferManager", [nullAddress, nullAddress,], deployer);
  await PercentageTransferManagerLogic.waitForDeployment();
  const PercentageTransferManagerLogicContractAddress = await PercentageTransferManagerLogic.getAddress();
  console.log({ PercentageTransferManagerLogicContractAddress })
  
  const ERC20DividendCheckpointLogic = await ethers.deployContract("ERC20DividendCheckpoint", [nullAddress, nullAddress,], deployer);
  await ERC20DividendCheckpointLogic.waitForDeployment();
  const ERC20DividendCheckpointLogicContractAddress = await ERC20DividendCheckpointLogic.getAddress();
  console.log({ ERC20DividendCheckpointLogicContractAddress })

  const EtherDividendCheckpointLogic = await ethers.deployContract("EtherDividendCheckpoint", [nullAddress, nullAddress,], deployer);
  await EtherDividendCheckpointLogic.waitForDeployment();
  const EtherDividendCheckpointLogicContractAddress = await EtherDividendCheckpointLogic.getAddress();
  console.log({ EtherDividendCheckpointLogicContractAddress })

  const EstateProtocolWhitelistSTOLogic = await ethers.deployContract("EstateProtocolWhitelistSTO", [], deployer);
  await EstateProtocolWhitelistSTOLogic.waitForDeployment();
  const EstateProtocolWhitelistSTOLogicContractAddress = await EstateProtocolWhitelistSTOLogic.getAddress();
  console.log({ EstateProtocolWhitelistSTOLogicContractAddress })


  const USDTieredSTOLogic = await ethers.deployContract("USDTieredSTO", [nullAddress, nullAddress,], deployer);
  await USDTieredSTOLogic.waitForDeployment();
  const USDTieredSTOLogicContractAddress = await USDTieredSTOLogic.getAddress();
  console.log({ USDTieredSTOLogicContractAddress })


  const VolumeRestrictionTMLogic= await ethers.getContractFactory("VolumeRestrictionTM",  { 
    signer: deployer, 
    libraries: { 
      VolumeRestrictionLib: VolumeRestrictionLibContractAddress
    } 
  });
  const volumeRestrictionTMLogic = await VolumeRestrictionTMLogic.deploy(nullAddress, nullAddress);
  const volumeRestrictionTMLogicContractAddress = await volumeRestrictionTMLogic.getAddress();

  console.log({volumeRestrictionTMLogicContractAddress})
  
  const CappedSTOLogic = await ethers.deployContract("CappedSTO", [nullAddress, nullAddress], deployer);
  await CappedSTOLogic.waitForDeployment();
  const CappedSTOLogicContractAddress = await CappedSTOLogic.getAddress();
  
  console.log({CappedSTOLogicContractAddress})
  
  const VestingEscrowWalletLogic = await ethers.deployContract("VestingEscrowWallet", [nullAddress, nullAddress], deployer);
  await VestingEscrowWalletLogic.waitForDeployment();
  const VestingEscrowWalletLogicContractAddress = await VestingEscrowWalletLogic.getAddress();
  console.log({VestingEscrowWalletLogicContractAddress})
  
  const DataStoreLogic = await ethers.deployContract("DataStore", deployer);
  await DataStoreLogic.waitForDeployment();

  // @ts-ignore
  const DataStoreLogicContractAddress = await DataStoreLogic.getAddress();
  console.log({DataStoreLogicContractAddress})

  const SecurityTokenLogic= await ethers.getContractFactory("SecurityToken",  { 
    signer: deployer, 
    libraries: { 
      TokenLib: TokenLibContractAddress
    } 
  });
  const securityTokenLogic = await SecurityTokenLogic.deploy();
  const SecurityTokenLogicContractAddress = await securityTokenLogic.getAddress();
  console.log({SecurityTokenLogicContractAddress})

  const DataStoreFactory = await ethers.deployContract("DataStoreFactory", [DataStoreLogicContractAddress], deployer);
  await DataStoreFactory.waitForDeployment();
  const DataStoreFactoryContractAddress = await DataStoreFactory.getAddress();
  console.log({DataStoreFactoryContractAddress})

  const GeneralTransferManagerFactory = await ethers.deployContract("GeneralTransferManagerFactory", [0, GeneralTransferManagerLogicContractAddress, PolymathRegistryContractAddress], deployer);
  await GeneralTransferManagerFactory.waitForDeployment();
  const GeneralTransferManagerFactoryContractAddress = await GeneralTransferManagerFactory.getAddress();
  console.log({GeneralTransferManagerFactoryContractAddress})

  const GeneralPermissionManagerFactory = await ethers.deployContract("GeneralPermissionManagerFactory", [0, GeneralPermissionManagerLogicContractAddress, PolymathRegistryContractAddress], deployer);
  await GeneralPermissionManagerFactory.waitForDeployment();
  const GeneralPermissionManagerFactoryContractAddress = await GeneralPermissionManagerFactory.getAddress();
  console.log({GeneralPermissionManagerFactoryContractAddress})

  const CountTransferManagerFactory = await ethers.deployContract("CountTransferManagerFactory", [0, CountTransferManagerLogicContractAddress, PolymathRegistryContractAddress], deployer);
  await CountTransferManagerFactory.waitForDeployment();
  const CountTransferManagerFactoryContractAddress = await CountTransferManagerFactory.getAddress();
  console.log({CountTransferManagerFactoryContractAddress})

  const PercentageTransferManagerFactory = await ethers.deployContract("PercentageTransferManagerFactory", [0, PercentageTransferManagerLogicContractAddress, PolymathRegistryContractAddress], deployer);
  await PercentageTransferManagerFactory.waitForDeployment();
  const PercentageTransferManagerFactoryContractAddress = await PercentageTransferManagerFactory.getAddress();
  console.log({PercentageTransferManagerFactoryContractAddress})

  const EtherDividendCheckpointFactory = await ethers.deployContract("EtherDividendCheckpointFactory", [0, EtherDividendCheckpointLogicContractAddress, PolymathRegistryContractAddress], deployer);
  await EtherDividendCheckpointFactory.waitForDeployment();
  const EtherDividendCheckpointFactoryContractAddress = await EtherDividendCheckpointFactory.getAddress();
  console.log({EtherDividendCheckpointFactoryContractAddress})

  const ERC20DividendCheckpointFactory = await ethers.deployContract("ERC20DividendCheckpointFactory", [0, ERC20DividendCheckpointLogicContractAddress, PolymathRegistryContractAddress], deployer);
  await ERC20DividendCheckpointFactory.waitForDeployment();
  const ERC20DividendCheckpointFactoryContractAddress = await ERC20DividendCheckpointFactory.getAddress();
  console.log({ERC20DividendCheckpointFactoryContractAddress})

  const VolumeRestrictionTMFactory = await ethers.deployContract("VolumeRestrictionTMFactory", [0, volumeRestrictionTMLogicContractAddress, PolymathRegistryContractAddress], deployer);
  await VolumeRestrictionTMFactory.waitForDeployment();
  const VolumeRestrictionTMFactoryContractAddress = await VolumeRestrictionTMFactory.getAddress();
  console.log({VolumeRestrictionTMFactoryContractAddress})

  const ManualApprovalTransferManagerFactory = await ethers.deployContract("ManualApprovalTransferManagerFactory", [0, ManualApprovalTransferManagerLogicContractAddress, PolymathRegistryContractAddress], deployer);
  await ManualApprovalTransferManagerFactory.waitForDeployment();
  const ManualApprovalTransferManagerFactoryContractAddress = await ManualApprovalTransferManagerFactory.getAddress();
  console.log({ManualApprovalTransferManagerFactoryContractAddress})

  const VestingEscrowWalletFactory = await ethers.deployContract("VestingEscrowWalletFactory", [0, VestingEscrowWalletLogicContractAddress, PolymathRegistryContractAddress], deployer);
  await VestingEscrowWalletFactory.waitForDeployment();
  const VestingEscrowWalletFactoryContractAddress = await VestingEscrowWalletFactory.getAddress();
  console.log({VestingEscrowWalletFactoryContractAddress})

  const STGetter = await ethers.getContractFactory("STGetter",  { 
    signer: deployer, 
    libraries: { 
      TokenLib: TokenLibContractAddress
    } 
  });
  const sTGetter = await STGetter.deploy();
  const STGetterContractAddress = await sTGetter.getAddress();
  console.log({STGetterContractAddress})


  let tokenInitBytesCall = web3.eth.abi.encodeFunctionCall(tokenInitBytes, [STGetterContractAddress]);
  console.log({tokenInitBytesCall})
  


  const STFactory = await ethers.deployContract("STFactory", [PolymathRegistryContractAddress, GeneralTransferManagerFactoryContractAddress, DataStoreFactoryContractAddress, "3.0.0", SecurityTokenLogicContractAddress, tokenInitBytesCall], deployer);
  await STFactory.waitForDeployment();
  const STFactoryContractAddress = await STFactory.getAddress();
  console.log({STFactoryContractAddress})

  const FeatureRegistry = await ethers.deployContract("FeatureRegistry", deployer);
  await FeatureRegistry.waitForDeployment();
  const FeatureRegistryContractAddress = await FeatureRegistry.getAddress();
  console.log({FeatureRegistryContractAddress})

  await polymathRegistry.changeAddress("FeatureRegistry", FeatureRegistryContractAddress);

  const SecurityTokenRegistry = await ethers.deployContract("SecurityTokenRegistry", deployer);
  await SecurityTokenRegistry.waitForDeployment();
  const SecurityTokenRegistryContractAddress = await SecurityTokenRegistry.getAddress();
  console.log({SecurityTokenRegistryContractAddress})

  const SecurityTokenRegistryProxy = await ethers.deployContract("SecurityTokenRegistryProxy", deployer);
  await SecurityTokenRegistryProxy.waitForDeployment();
  const SecurityTokenRegistryProxyContractAddress = await SecurityTokenRegistryProxy.getAddress();
  console.log({SecurityTokenRegistryProxyContractAddress})

  const STRGetter = await ethers.deployContract("STRGetter", deployer);
  await STRGetter.waitForDeployment();
  const STRGetterContractAddress = await STRGetter.getAddress();
  console.log({STRGetterContractAddress})



  const initRegFee = 0;

  let bytesProxy = web3.eth.abi.encodeFunctionCall(functionSignatureProxy, [
      PolymathRegistryContractAddress,
      initRegFee.toString(),
      initRegFee.toString(),
      OWNER_ADDRESS,
      STRGetterContractAddress
  ]);

  const securityTokenRegistryProxy = new mainEthers.Contract(SecurityTokenRegistryProxyContractAddress, securityTokenRegistryProxyABI, deployer);

  await securityTokenRegistryProxy.upgradeToAndCall("1.0.0", SecurityTokenRegistryContractAddress, bytesProxy, { from: PolymathAccount });

  const xSecurityTokenRegistry = new mainEthers.Contract(SecurityTokenRegistryProxyContractAddress, securityTokenRegistryABI, deployer);
  await xSecurityTokenRegistry.setProtocolFactory(STFactoryContractAddress, 3, 0, 0)
  await xSecurityTokenRegistry.setLatestVersion(3, 0, 0);

  
  await polymathRegistry.changeAddress("SecurityTokenRegistry", SecurityTokenRegistryProxyContractAddress);

  const moduleRegistry = new mainEthers.Contract(ModuleRegistryProxyContractAddress, moduleRegistryABI, deployer);
  
  
  await moduleRegistry.updateFromRegistry()
  
  await moduleRegistry.registerModule(PercentageTransferManagerFactoryContractAddress)
  await moduleRegistry.registerModule(CountTransferManagerFactoryContractAddress)
  await moduleRegistry.registerModule(GeneralTransferManagerFactoryContractAddress)
  await moduleRegistry.registerModule(GeneralPermissionManagerFactoryContractAddress)
  await moduleRegistry.registerModule(EtherDividendCheckpointFactoryContractAddress)
  await moduleRegistry.registerModule(VolumeRestrictionTMFactoryContractAddress)
  await moduleRegistry.registerModule(ManualApprovalTransferManagerFactoryContractAddress)
  await moduleRegistry.registerModule(ERC20DividendCheckpointFactoryContractAddress)
  await moduleRegistry.registerModule(VestingEscrowWalletFactoryContractAddress)

  
  await moduleRegistry.verifyModule(GeneralTransferManagerFactoryContractAddress)
  await moduleRegistry.verifyModule(CountTransferManagerFactoryContractAddress)
  await moduleRegistry.verifyModule(PercentageTransferManagerFactoryContractAddress)
  await moduleRegistry.verifyModule(GeneralPermissionManagerFactoryContractAddress)
  await moduleRegistry.verifyModule(EtherDividendCheckpointFactoryContractAddress)
  await moduleRegistry.verifyModule(ERC20DividendCheckpointFactoryContractAddress)
  await moduleRegistry.verifyModule(VolumeRestrictionTMFactoryContractAddress,)
  await moduleRegistry.verifyModule(ManualApprovalTransferManagerFactoryContractAddress)
  await moduleRegistry.verifyModule(VestingEscrowWalletFactoryContractAddress)

  const CappedSTOFactory = await ethers.deployContract("CappedSTOFactory", [0, CappedSTOLogicContractAddress, PolymathRegistryContractAddress], deployer);
  await CappedSTOFactory.waitForDeployment();
  const CappedSTOFactoryContractAddress = await CappedSTOFactory.getAddress();
  console.log({CappedSTOFactoryContractAddress})

  await moduleRegistry.registerModule(CappedSTOFactoryContractAddress)
  await moduleRegistry.verifyModule(CappedSTOFactoryContractAddress)

  const USDTieredSTOFactory = await ethers.deployContract("USDTieredSTOFactory", [0, USDTieredSTOLogicContractAddress, PolymathRegistryContractAddress], deployer);
  await USDTieredSTOFactory.waitForDeployment();
  const USDTieredSTOFactoryContractAddress = await USDTieredSTOFactory.getAddress();
  console.log({USDTieredSTOFactoryContractAddress})

  await moduleRegistry.registerModule(USDTieredSTOFactoryContractAddress)
  await moduleRegistry.verifyModule(USDTieredSTOFactoryContractAddress)

  await polymathRegistry.changeAddress("PolyToken", PolyTokenFaucetContractAddress);
  await polymathRegistry.changeAddress("PolyUsdOracle", PolyMockOracleContractAddress);
  await polymathRegistry.changeAddress("EthUsdOracle", ETHOracleContractAddress);
  await polymathRegistry.changeAddress("StablePolyUsdOracle", StableOracleContractAddress);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});