const EstateProtocolWhitelistSTO = artifacts.require("EstateProtocolWhitelistSTO");
const { expectRevert } = require("@openzeppelin/test-helpers");
const { keccak256 } = require("web3-utils");
const { MerkleTree } = require("merkletreejs");

contract("EstateProtocolWhitelistSTO - Merkle Root Verification", (accounts) => {
  const [admin, nonAdmin, investor1, investor2] = accounts;

  let contract;
  let merkleTree, leafData1, leafData2, proof1, root;

  before(async () => {
    // Deploy the contract
    contract = await EstateProtocolWhitelistSTO.new({ from: admin });

    // Create a Merkle Tree for testing
    leafData1 = keccak256(investor1);
    leafData2 = keccak256(investor2);
    merkleTree = new MerkleTree([leafData1, leafData2], keccak256, { sortPairs: true });
    root = merkleTree.getHexRoot();
    proof1 = merkleTree.getHexProof(leafData1);
  });

  describe("Updating Merkle Root", () => {
    it("should allow admin to update Merkle root", async () => {
      await contract.updateMerkleRoot(root, { from: admin });

      const storedRoot = await contract.merkleRoot();
      assert.equal(storedRoot, root, "Merkle root was not updated correctly");
    });

    it("should not allow non-admin to update Merkle root", async () => {
      await expectRevert(
        contract.updateMerkleRoot(root, { from: nonAdmin }),
        "Not an admin"
      );
    });
  });

  describe("Merkle Proof Verification", () => {
    before(async () => {
      // Ensure the root is set
      await contract.updateMerkleRoot(root, { from: admin });
    });

    it("should verify a valid Merkle proof", async () => {
      const isValid = await contract.verifyInvestor(proof1, leafData1);
      assert.isTrue(isValid, "Valid proof was not verified");
    });

    it("should reject an invalid Merkle proof", async () => {
      const invalidProof = proof1.slice(0, -1); // Remove one element from proof
      const isValid = await contract.verifyInvestor(invalidProof, leafData1);
      assert.isFalse(isValid, "Invalid proof was incorrectly verified");
    });

    it("should reject when leaf data does not match proof", async () => {
      const isValid = await contract.verifyInvestor(proof1, keccak256("random_data"));
      assert.isFalse(isValid, "Proof for incorrect leaf data was verified");
    });

    it("should reject proof if Merkle root is not set", async () => {
      // Deploy a new contract to test with no root
      const newContract = await EstateProtocolWhitelistSTO.new({ from: admin });
      const isValid = await newContract.verifyInvestor(proof1, leafData1);
      assert.isFalse(isValid, "Proof was verified even though root was not set");
    });

    it("should reject an empty proof", async () => {
      const emptyProof = [];
      const isValid = await contract.verifyInvestor(emptyProof, leafData1);
      assert.isFalse(isValid, "Empty proof was incorrectly verified");
    });

    it("should reject if Merkle root is updated but proof is stale", async () => {
      // Update Merkle root to a new root
      const newLeaf = keccak256("new_investor");
      const newTree = new MerkleTree([newLeaf], keccak256, { sortPairs: true });
      const newRoot = newTree.getHexRoot();

      await contract.updateMerkleRoot(newRoot, { from: admin });

      // Verify with stale proof
      const isValid = await contract.verifyInvestor(proof1, leafData1);
      assert.isFalse(isValid, "Stale proof was incorrectly verified");
    });
  });
});
