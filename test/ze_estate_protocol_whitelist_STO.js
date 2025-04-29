const { expect } = require("chai");
const { ethers } = require("hardhat");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

describe("EstateProtocolWhitelistSTO", function () {
  let contract, admin, operator, investor1, investor2, token;
  let merkleTree, merkleRoot, proof1, expiry, isAccredited1, isAccredited2;

  beforeEach(async function () {
    [admin, operator, investor1, investor2, token] = await ethers.getSigners();

    // Deploy contract
    const Factory = await ethers.getContractFactory("EstateProtocolWhitelistSTO", admin);
    contract = await Factory.deploy();

    // Grant operator role to operator
    await contract.connect(admin).grantOperatorRole(operator.address);

    // Prepare Merkle tree
    expiry = Math.floor(Date.now() / 1000) + 3600 * 24 * 100; // 100 days from now
    isAccredited1 = false;
    isAccredited2 = true;
    const values = [
      [investor1.address, expiry, isAccredited1],
      [investor2.address, expiry, isAccredited2]
    ];
    merkleTree = StandardMerkleTree.of(values, ["address", "uint64", "bool"]);
    merkleRoot = merkleTree.root;

    // Get proof for investor1
    for (const [i, v] of merkleTree.entries()) {
      if (v[0] === investor1.address) {
        proof1 = merkleTree.getProof(i);
        break;
      }
    }
  });

  it("should allow operator to set merkle root", async function () {
    const tx = await contract.connect(operator).modifyKYCData(merkleRoot);
    await expect(tx).to.emit(contract, "MerkleRootUpdated").withArgs(merkleRoot);
  });

  it("should reject non-operator trying to set merkle root", async function () {
    await expect(
      contract.connect(investor1).modifyKYCData(merkleRoot)
    ).to.be.revertedWith("Not a operator");
  });

  it("should verify investor with valid proof", async function () {
    await contract.connect(operator).modifyKYCData(merkleRoot);

    const tx = await contract.connect(investor1).verifyInvestor(
      proof1,
      investor1.address,
      expiry,
      isAccredited1
    );
    await expect(tx).to.emit(contract, "InvestorKYCDataUpdate")
      .withArgs(investor1.address, expiry, isAccredited1);

    // Check isExistingInvestor
    expect(await contract.isExistingInvestor(investor1.address)).to.equal(true);
  });

  it("should reject expired proof", async function () {
    await contract.connect(operator).modifyKYCData(merkleRoot);

    const expiredExpiry = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    await expect(
      contract.connect(investor1).verifyInvestor(
        proof1,
        investor1.address,
        expiredExpiry,
        isAccredited1
      )
    ).to.be.revertedWith("Investor Proof has expired");
  });

  it("should reject invalid proof", async function () {
    await contract.connect(operator).modifyKYCData(merkleRoot);

    const invalidProof = ["0x0000000000000000000000000000000000000000000000000000000000000000"];
    await expect(
      contract.connect(investor1).verifyInvestor(
        invalidProof,
        investor1.address,
        expiry,
        isAccredited1
      )
    ).to.be.revertedWith("Invalid proof");
  });

  it("should return correct KYC data for existing investor", async function () {
    await contract.connect(operator).modifyKYCData(merkleRoot);
    await contract.connect(investor1).verifyInvestor(
      proof1,
      investor1.address,
      expiry,
      isAccredited1
    );

    // Set token lock start time
    const now = Math.floor(Date.now() / 1000);
    await contract.connect(admin).addTokenLockStartTime(token.address, now);

    const result = await contract.getInvestorKYCData(investor1.address, token.address);
    expect(result.added).to.equal(1);
    expect(result.expiryTime).to.equal(expiry);
  });

  it("should handle token transfer status", async function () {
    await contract.connect(operator).modifyKYCData(merkleRoot);
    await contract.connect(investor1).verifyInvestor(
      proof1,
      investor1.address,
      expiry,
      isAccredited1
    );

    // Disable transfers for token
    await contract.connect(admin).modifyTokenTransferStatus(token.address, false);

    const result = await contract.getInvestorKYCData(investor1.address, token.address);
    // The canSendAfter value should be greater than now + MAX_LOCK_PERIOD
    expect(result.canSendAfter).to.be.gt(Math.floor(Date.now() / 1000) + 365 * 24 * 3600);
  });

  it("should allow admin to grant and revoke operator role", async function () {
    await contract.connect(admin).grantOperatorRole(investor2.address);
    expect(await contract.isOperator(investor2.address)).to.equal(true);

    await contract.connect(admin).revokeOperatorRole(investor2.address);
    expect(await contract.isOperator(investor2.address)).to.equal(false);
  });

  it("should allow admin to grant and revoke admin role", async function () {
    await contract.connect(admin).grantAdminRole(investor2.address);
    expect(await contract.isAdmin(investor2.address)).to.equal(true);

    await contract.connect(admin).revokeAdminRole(investor2.address);
    expect(await contract.isAdmin(investor2.address)).to.equal(false);
  });

  it("should return token transfer status", async function () {
    await contract.connect(admin).modifyTokenTransferStatus(token.address, true);
    expect(await contract.getTokenTransferStatus(token.address)).to.equal(true);
  });

  it("should return default values for non-existing investor in getInvestorKYCData", async function () {
    // investor2 has not been verified, so is not an existing investor
    const result = await contract.getInvestorKYCData(investor2.address, token.address);

    const now = Math.floor(Date.now() / 1000);
    const MAX_LOCK_PERIOD = 365 * 24 * 3600;
    expect(result.canSendAfter).to.be.closeTo(now + MAX_LOCK_PERIOD, 100);
    expect(result.canReceiveAfter).to.be.closeTo(now + MAX_LOCK_PERIOD, 100);
    expect(result.expiryTime).to.be.closeTo(now - 1, 100);
    expect(result.added).to.equal(1);
  });

  it("should return default values for non-existing investor in getInvestorKYCData (else path)", async function () {
    // investor2 has not been verified, so is not an existing investor
    const result = await contract.getInvestorKYCData(investor2.address, token.address);

    const now = Math.floor(Date.now() / 1000);
    const MAX_LOCK_PERIOD = 365 * 24 * 3600;
    // The returned values should match the else branch
    expect(result.canSendAfter).to.be.closeTo(now + MAX_LOCK_PERIOD, 100);
    expect(result.canReceiveAfter).to.be.closeTo(now + MAX_LOCK_PERIOD, 100);
    expect(result.expiryTime).to.be.closeTo(now - 1, 100);
    expect(result.added).to.equal(1);
  });

  it("should revert when granting admin role to an existing admin", async function () {
    await contract.connect(admin).grantAdminRole(investor2.address);
    await expect(
      contract.connect(admin).grantAdminRole(investor2.address)
    ).to.be.revertedWith("Account is already an admin");
  });

  it("should revert when revoking admin role from a non-admin", async function () {
    await expect(
      contract.connect(admin).revokeAdminRole(investor2.address)
    ).to.be.revertedWith("Account is not an admin");
  });

  it("should revert when granting operator role to an existing operator", async function () {
    await contract.connect(admin).grantOperatorRole(investor2.address);
    await expect(
      contract.connect(admin).grantOperatorRole(investor2.address)
    ).to.be.revertedWith("Account is already a operator");
  });

  it("should revert when revoking operator role from a non-operator", async function () {
    await expect(
      contract.connect(admin).revokeOperatorRole(investor2.address)
    ).to.be.revertedWith("Account is not a operator");
  });

  it("should revert when non-admin tries to addTokenLockStartTime", async function () {
    await expect(
      contract.connect(investor1).addTokenLockStartTime(token.address, 1234567890)
    ).to.be.revertedWith("Not an admin");
  });

  it("should revert when non-admin tries to modifyTokenTransferStatus", async function () {
    await expect(
      contract.connect(investor1).modifyTokenTransferStatus(token.address, true)
    ).to.be.revertedWith("Not an admin");
  });

  it("should revert when non-admin tries to grantAdminRole", async function () {
    await expect(
      contract.connect(investor1).grantAdminRole(investor2.address)
    ).to.be.revertedWith("Not an admin");
  });

  it("should revert when non-admin tries to revokeAdminRole", async function () {
    await expect(
      contract.connect(investor1).revokeAdminRole(investor2.address)
    ).to.be.revertedWith("Not an admin");
  });

  it("should revert when non-admin tries to grantOperatorRole", async function () {
    await expect(
      contract.connect(investor1).grantOperatorRole(investor2.address)
    ).to.be.revertedWith("Not an admin");
  });

  it("should revert when non-admin tries to revokeOperatorRole", async function () {
    await expect(
      contract.connect(investor1).revokeOperatorRole(investor2.address)
    ).to.be.revertedWith("Not an admin");
  });

  it("should set _existingInvestors for a new investor in verifyInvestor", async function () {
    await contract.connect(operator).modifyKYCData(merkleRoot);

    // Use a new address (not investor1 or investor2)
    const [,, , , newInvestor] = await ethers.getSigners();

    // Add newInvestor to the Merkle tree for this test
    const newExpiry = Math.floor(Date.now() / 1000) + 3600 * 24 * 100;
    const newIsAccredited = false;
    const newValues = [
      [newInvestor.address, newExpiry, newIsAccredited]
    ];
    const newTree = StandardMerkleTree.of(newValues, ["address", "uint64", "bool"]);
    const newRoot = newTree.root;
    let newProof;
    for (const [i, v] of newTree.entries()) {
      if (v[0] === newInvestor.address) {
        newProof = newTree.getProof(i);
        break;
      }
    }
    await contract.connect(operator).modifyKYCData(newRoot);

    // Call verifyInvestor for the first time for newInvestor
    await contract.connect(newInvestor).verifyInvestor(
      newProof,
      newInvestor.address,
      newExpiry,
      newIsAccredited
    );

    // Now _existingInvestors[newInvestor] should be true
    expect(await contract.isExistingInvestor(newInvestor.address)).to.equal(true);
  });

  it("should take the else path when investor is already existing in verifyInvestor", async function () {
    await contract.connect(operator).modifyKYCData(merkleRoot);

    // First verification: investor1 is not existing yet
    await contract.connect(investor1).verifyInvestor(
      proof1,
      investor1.address,
      expiry,
      isAccredited1
    );

    // Second verification: investor1 is now already existing
    // This will take the else path in the contract
    await contract.connect(investor1).verifyInvestor(
      proof1,
      investor1.address,
      expiry,
      isAccredited1
    );

    // Assert that investor1 is still marked as existing
    expect(await contract.isExistingInvestor(investor1.address)).to.equal(true);
  });

  it("should take else paths when investor is not accredited and transfer is allowed", async function () {
    await contract.connect(operator).modifyKYCData(merkleRoot);
    await contract.connect(investor1).verifyInvestor(
      proof1,
      investor1.address,
      expiry,
      false // isAccredited1 is false
    );

    // Set token lock start time
    const now = Math.floor(Date.now() / 1000);
    await contract.connect(admin).addTokenLockStartTime(token.address, now);

    // Ensure transfer is allowed
    await contract.connect(admin).modifyTokenTransferStatus(token.address, true);

    const result = await contract.getInvestorKYCData(investor1.address, token.address);

    // _canSendAfter should be pastBlockTimestamp (since isAccredited is false and transfer is allowed)
    const pastBlockTimestamp = now - 1;
    expect(result.canSendAfter).to.be.closeTo(pastBlockTimestamp, 100);
    expect(result.canReceiveAfter).to.be.closeTo(pastBlockTimestamp, 100);
    expect(result.expiryTime).to.equal(expiry);
    expect(result.added).to.equal(1);
  });

  it("should take else path when investor is accredited and transfer is allowed", async function () {
    // Get proof for investor2 (accredited)
    let proof2;
    for (const [i, v] of merkleTree.entries()) {
      if (v[0] === investor2.address) {
        proof2 = merkleTree.getProof(i);
        break;
      }
    }

    await contract.connect(operator).modifyKYCData(merkleRoot);
    await contract.connect(investor2).verifyInvestor(
      proof2,
      investor2.address,
      expiry,
      true // isAccredited2 is true
    );

    // Set token lock start time
    const now = Math.floor(Date.now() / 1000);
    await contract.connect(admin).addTokenLockStartTime(token.address, now);

    // Ensure transfer is allowed
    await contract.connect(admin).modifyTokenTransferStatus(token.address, true);

    const result = await contract.getInvestorKYCData(investor2.address, token.address);

    // _canSendAfter should be tokenLockStartTime[token] + MAX_LOCK_PERIOD
    expect(result.canSendAfter).to.equal(now + 365 * 24 * 3600);
    expect(result.canReceiveAfter).to.be.closeTo(now - 1, 100);
    expect(result.expiryTime).to.equal(expiry);
    expect(result.added).to.equal(1);
  });

  it("should take else path for isAccredited and if path for !isTransferAllowed", async function () {
    await contract.connect(operator).modifyKYCData(merkleRoot);
    await contract.connect(investor1).verifyInvestor(
      proof1,
      investor1.address,
      expiry,
      false // isAccredited1 is false
    );

    // Set token lock start time
    const now = Math.floor(Date.now() / 1000);
    await contract.connect(admin).addTokenLockStartTime(token.address, now);

    // Disable transfer
    await contract.connect(admin).modifyTokenTransferStatus(token.address, false);

    const result = await contract.getInvestorKYCData(investor1.address, token.address);

    // _canSendAfter should be pastBlockTimestamp + futureBlockTimestamp
    const pastBlockTimestamp = now - 1;
    const futureBlockTimestamp = now + 365 * 24 * 3600;
    expect(result.canSendAfter).to.be.closeTo(pastBlockTimestamp + futureBlockTimestamp, 200);
    expect(result.canReceiveAfter).to.be.closeTo(pastBlockTimestamp, 100);
    expect(result.expiryTime).to.equal(expiry);
    expect(result.added).to.equal(1);
  });
});