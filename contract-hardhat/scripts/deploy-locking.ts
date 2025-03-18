import { ethers } from "hardhat";

async function main() {
  // Deploy the LockingFactoryImplementation
  console.log("Deploying LockingFactoryV1...");
  const LockingFactoryV1 = await ethers.getContractFactory("LockingFactoryV1");
  const lockingFactory = await LockingFactoryV1.deploy();
  await lockingFactory.waitForDeployment();
  
  const lockingFactoryImplementationAddress = await lockingFactory.getAddress();
  console.log(`LockingFactoryImplementation deployed to: ${lockingFactoryImplementationAddress}`);

  // Deploy the ProxyRegistry with the implementation address
  console.log("Deploying ProxyRegistry with implementation address...");
  const ProxyRegistryFactory = await ethers.getContractFactory("ProxyRegistry");
  const proxyRegistry = await ProxyRegistryFactory.deploy(lockingFactoryImplementationAddress);
  await proxyRegistry.waitForDeployment();
  
  const proxyRegistryAddress = await proxyRegistry.getAddress();
  console.log(`ProxyRegistry deployed to: ${proxyRegistryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });