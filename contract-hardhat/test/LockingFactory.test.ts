import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, Contract } from "ethers";

describe("ProxyRegistry", function () {
  let proxyRegistry: Contract;
  let impl: Contract;
  let newImpl: Contract;
  let mockToken: Contract;
  let owner: Signer;
  let alice: Signer;
  let bob: Signer;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    // Deploy LockingFactoryImplementation
    const LockingFactoryImplementation = await ethers.getContractFactory("LockingFactoryImplementation");
    impl = await LockingFactoryImplementation.deploy();

    // Deploy ProxyRegistry with initial implementation
    const ProxyRegistry = await ethers.getContractFactory("ProxyRegistry");
    proxyRegistry = await ProxyRegistry.deploy(impl.address);

    // Deploy MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Test Token", "TST", ethers.utils.parseEther("1000000"));
  });

  describe("Deployment", function () {
    it("Should set the correct initial implementation", async function () {
      expect(await proxyRegistry.currentImplementation()).to.equal(impl.address);
    });

    it("Should revert if initial implementation is zero address", async function () {
      const ProxyRegistry = await ethers.getContractFactory("ProxyRegistry");
      await expect(ProxyRegistry.deploy(ethers.constants.AddressZero)).to.be.revertedWithCustomError(
        proxyRegistry,
        "ZeroAddressNotAllowed"
      );
    });
  });

  describe("createFactory", function () {
    it("Should deploy a new factory for a user and token pair", async function () {
      const tx = await proxyRegistry.connect(alice).createFactory(mockToken.address, await alice.getAddress());
      const receipt = await tx.wait();
      const event = receipt.events?.find((e: any) => e.event === "FactoryDeployed");
      const factoryAddress = event?.args?.factory;

      expect(factoryAddress).to.not.equal(ethers.constants.AddressZero);
      expect(await proxyRegistry.userToFactory(await alice.getAddress())).to.equal(factoryAddress);
      expect(await proxyRegistry.pairToFactory(ethers.utils.solidityKeccak256(
        ["address", "address"],
        [await alice.getAddress(), mockToken.address]
      ))).to.equal(factoryAddress);
    });

    it("Should return existing factory for the same user and token pair", async function () {
      await proxyRegistry.connect(alice).createFactory(mockToken.address, await alice.getAddress());
      const firstFactory = await proxyRegistry.userToFactory(await alice.getAddress());

      await proxyRegistry.connect(alice).createFactory(mockToken.address, await alice.getAddress());
      const secondFactory = await proxyRegistry.userToFactory(await alice.getAddress());

      expect(firstFactory).to.equal(secondFactory);
    });

    it("Should revert if stToken address is zero", async function () {
      await expect(
        proxyRegistry.connect(alice).createFactory(ethers.constants.AddressZero, await alice.getAddress())
      ).to.be.revertedWithCustomError(proxyRegistry, "ZeroAddressNotAllowed");
    });
  });

  describe("updateImplementation", function () {
    it("Should update implementation by owner", async function () {
      const NewImpl = await ethers.getContractFactory("LockingFactoryImplementation");
      newImpl = await NewImpl.deploy();
      await proxyRegistry.connect(owner).updateImplementation(newImpl.address);
      expect(await proxyRegistry.currentImplementation()).to.equal(newImpl.address);
    });

    it("Should revert if non-owner tries to update", async function () {
      const NewImpl = await ethers.getContractFactory("LockingFactoryImplementation");
      newImpl = await NewImpl.deploy();
      await expect(
        proxyRegistry.connect(alice).updateImplementation(newImpl.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert if new implementation is zero address", async function () {
      await expect(
        proxyRegistry.connect(owner).updateImplementation(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(proxyRegistry, "ZeroAddressNotAllowed");
    });
  });

  describe("upgradeFactory", function () {
    it("Should revert upgrading factory if not owner of the factory", async function () {
      await proxyRegistry.connect(alice).createFactory(mockToken.address, await alice.getAddress());
      const factoryAddress = await proxyRegistry.userToFactory(await alice.getAddress());

      const NewImpl = await ethers.getContractFactory("LockingFactoryImplementation");
      newImpl = await NewImpl.deploy();
      await proxyRegistry.connect(owner).updateImplementation(newImpl.address);

      await expect(
        proxyRegistry.connect(owner).upgradeFactory(factoryAddress)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

describe("LockingFactoryImplementation", function () {
  let proxyRegistry: Contract;
  let impl: Contract;
  let factory: Contract;
  let mockToken: Contract;
  let rental721: Contract;
  let rental1155: Contract;
  let owner: Signer;
  let alice: Signer;

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();

    // Deploy LockingFactoryImplementation
    const LockingFactoryImplementation = await ethers.getContractFactory("LockingFactoryImplementation");
    impl = await LockingFactoryImplementation.deploy();

    // Deploy ProxyRegistry with initial implementation
    const ProxyRegistry = await ethers.getContractFactory("ProxyRegistry");
    proxyRegistry = await ProxyRegistry.deploy(impl.address);

    // Deploy MockERC20 and create factory
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Test Token", "TST", ethers.utils.parseEther("1000000"));
    await proxyRegistry.connect(alice).createFactory(mockToken.address, await alice.getAddress());
    const factoryAddress = await proxyRegistry.userToFactory(await alice.getAddress());
    factory = await ethers.getContractAt("LockingFactoryImplementation", factoryAddress);

    // Deployer mints tokens to Alice and approves the factory
    await mockToken.connect(owner).mint(await alice.getAddress(), ethers.utils.parseEther("1000"));
    await mockToken.connect(alice).approve(factory.address, ethers.constants.MaxUint256);

    // Get Rental contracts
    rental721 = await ethers.getContractAt("Rental721", await factory.rentalNFT());
    rental1155 = await ethers.getContractAt("Rental1155", await factory.rentalFT());
  });

  describe("lockTokens", function () {
    const amount = ethers.utils.parseEther("100");

    it("Should lock tokens and mint NFTs", async function () {
      await factory.connect(alice).lockTokens(amount);

      // Check ERC721
      expect(await rental721.balanceOf(await alice.getAddress())).to.equal(1);
      expect(await factory.hasMintedERC721(await alice.getAddress())).to.be.true;

      // Check ERC1155
      expect(await rental1155.balanceOf(await alice.getAddress(), ethers.BigNumber.from(mockToken.address))).to.equal(amount);

      // Check token balance in factory
      expect(await mockToken.balanceOf(factory.address)).to.equal(amount);
    });

    it("Should mint ERC721 only once per user", async function () {
      await factory.connect(alice).lockTokens(amount);
      await factory.connect(alice).lockTokens(amount);

      expect(await rental721.balanceOf(await alice.getAddress())).to.equal(1);
    });

    it("Should revert for zero amount", async function () {
      await expect(factory.connect(alice).lockTokens(0)).to.be.revertedWithCustomError(factory, "InvalidAmount");
    });

    it("Should revert if transferFrom fails", async function () {
      await mockToken.connect(alice).approve(factory.address, 0);
      await expect(factory.connect(alice).lockTokens(amount)).to.be.revertedWithCustomError(factory, "TransferFailed");
    });
  });

  describe("redeemEPTokens", function () {
    const amount = ethers.utils.parseEther("100");

    beforeEach(async function () {
      await factory.connect(alice).lockTokens(amount);
    });

    it("Should redeem tokens and burn ERC1155", async function () {
      const aliceAddress = await alice.getAddress();
      const initialBalance = await mockToken.balanceOf(aliceAddress);

      await factory.connect(alice).redeemEPTokens(amount);

      expect(await rental1155.balanceOf(aliceAddress, ethers.BigNumber.from(mockToken.address))).to.equal(0);
      expect(await mockToken.balanceOf(aliceAddress)).to.equal(initialBalance.add(amount));
      expect(await mockToken.balanceOf(factory.address)).to.equal(0);
    });

    it("Should revert for zero amount", async function () {
      await expect(factory.connect(alice).redeemEPTokens(0)).to.be.revertedWithCustomError(factory, "InvalidAmount");
    });

    it("Should revert if insufficient ERC1155 balance", async function () {
      await expect(factory.connect(alice).redeemEPTokens(amount.mul(2))).to.be.revertedWith("ERC1155: burn amount exceeds balance");
    });
  });

  describe("Upgrades", function () {
    it("Should upgrade implementation by factory owner", async function () {
      const NewImpl = await ethers.getContractFactory("LockingFactoryImplementation");
      const newImpl = await NewImpl.deploy();

      await factory.connect(alice).upgradeTo(newImpl.address);
      const implSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
      const implAddress = await ethers.provider.getStorageAt(factory.address, implSlot);
      expect(ethers.utils.getAddress(implAddress.slice(26))).to.equal(newImpl.address.toLowerCase());
    });
  });
});