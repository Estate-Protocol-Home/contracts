const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");
const { duration } = require("./helpers/utils");
const { latestTime } = require("./helpers/time");
const { catchRevert } = require("./helpers/exceptions");

contract("EstateProtocolWhitelistSTO", async (accounts) => {
    let whitelistSTO;
    let merkleTree;
    let merkleRoot;
    let defaultProof;
    let defaultExpiry;
    let currentTime;
    
    const [ADMIN, OPERATOR, INVESTOR1, INVESTOR2] = accounts;
    const TOKEN_ADDRESS = "0x1234567890123456789012345678901234567890";
 

    before(async () => {
        // Deploy contract
        const WhitelistSTO = artifacts.require("EstateProtocolWhitelistSTO");
        whitelistSTO = await WhitelistSTO.new({ from: ADMIN });
        currentTime = await latestTime();
        
        // Grant operator role
        await whitelistSTO.grantOperatorRole(OPERATOR, { from: ADMIN });

        // Setup merkle tree
        
        const values = [
            [INVESTOR1, currentTime + duration.days(100), false],
            [INVESTOR2, currentTime + duration.days(100), true]
        ];
        
        merkleTree = StandardMerkleTree.of(values, ["address", "uint64", "bool"]);
        merkleRoot = merkleTree.root;
        defaultExpiry = currentTime + duration.days(100);

        // Get proof for INVESTOR1
        for (const [i, v] of merkleTree.entries()) {
            if (v[0] === INVESTOR1) {
                defaultProof = merkleTree.getProof(i);
                break;
            }
        }
    });

    describe("modifyKYCData", () => {
        it("should allow operator to set merkle root", async () => {
            const tx = await whitelistSTO.modifyKYCData(merkleRoot, { from: OPERATOR });
            assert.ok(tx.receipt.status, "Transaction failed");
             
            // Verify modification
            const event = tx.logs.find(log => log.event === "MerkleRootUpdated");
            assert.ok(event, "MerkleRootUpdated event not emitted");
            assert.equal(event.args.root, merkleRoot, "Merkle root in event does not match");
        });

        it("should reject non-operator trying to set merkle root", async () => {
            await catchRevert(
                whitelistSTO.modifyKYCData(merkleRoot, { from: INVESTOR1 }),
                "Not a operator"
            );
        });
    });

    describe("verifyInvestor", () => {
        before(async () => {
            // Set merkle root for verification tests
            await whitelistSTO.modifyKYCData(merkleRoot, { from: OPERATOR });
        });

        it("should verify investor with valid proof", async () => {
            const tx = await whitelistSTO.verifyInvestor(
                defaultProof,
                INVESTOR1,
                defaultExpiry,
                false,
                { from: INVESTOR1 }
            );
            
            assert.ok(tx.receipt.status, "Transaction failed");
            
            // Verify event
            const event = tx.logs.find(log => log.event === "InvestorKYCDataUpdate");
            assert.ok(event, "InvestorKYCDataUpdate event not emitted");
            assert.equal(event.args.investor, INVESTOR1);
            assert.equal(event.args.expiryTime.toString(), defaultExpiry.toString());
            assert.equal(event.args.isAccredited, false);
        });

        it("should reject expired proof", async () => {
            const expiredExpiry = currentTime - duration.days(1);
            await catchRevert(
                whitelistSTO.verifyInvestor(
                    defaultProof,
                    INVESTOR1,
                    expiredExpiry,
                    false,
                    { from: INVESTOR1 }
                ),
                "Investor Proof has expired"
            );
        });

        it("should reject invalid proof", async () => {
            const invalidProof = ["0x0000000000000000000000000000000000000000000000000000000000000000"];
            await catchRevert(
                whitelistSTO.verifyInvestor(
                    invalidProof,
                    INVESTOR1,
                    defaultExpiry,
                    false,
                    { from: INVESTOR1 }
                ),
                "Invalid proof"
            );
        });
    });

    describe("getInvestorKYCData", () => {
        before(async () => {
            // Setup token lock time
            await whitelistSTO.addTokenLockStartTime(
                TOKEN_ADDRESS,
                currentTime,
                { from: ADMIN }
            );
        });

        it("should return correct data for existing investor", async () => {
            const result = await whitelistSTO.getInvestorKYCData(INVESTOR1, TOKEN_ADDRESS);
            
            assert.ok(result.added.toNumber() === 1, "Should be marked as added");
            assert.ok(result.expiryTime.toString() === defaultExpiry.toString(), "Wrong expiry time");
        });


        it("should handle token transfer status", async () => {
            // Disable transfers for token
            await whitelistSTO.modifyTokenTransferStatus(TOKEN_ADDRESS, false, { from: ADMIN });
            
            const result = await whitelistSTO.getInvestorKYCData(INVESTOR1, TOKEN_ADDRESS);
            const expectedLockTime = currentTime + duration.days(365); // MAX_LOCK_PERIOD
            
            assert.ok(result.canSendAfter.gt(expectedLockTime), "Should have extended lock period");
        });
    });
});

