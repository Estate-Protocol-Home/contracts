/**
 * Estate Protocol — USD Purchase Test (Standalone)
 *
 * Tests token purchase with USD stablecoin on an existing deployed STO.
 * This script assumes:
 *   • SecurityToken already deployed
 *   • USDTieredSTO already attached and configured
 *   • Buyer already whitelisted
 *
 * Usage:
 *   npx truffle exec scripts/purchase-test-usd.js --network arbitrumSepolia
 *
 * Before running, update these addresses:
 */

const Web3 = require("web3");
const BN = Web3.utils.BN;
const ONE_ETHER = new BN(10).pow(new BN(18)); // 1e18

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE THESE ADDRESSES AFTER DEPLOYMENT
// ═══════════════════════════════════════════════════════════════════════════
const SECURITY_TOKEN_ADDRESS = "0xc320d7c30a96B68500586DFF4113b280bcf32a71";
const USD_TIERED_STO_ADDRESS = "0xE7DC7f529Ba0fCcD4699D0BfC1BAee78f988e008";
const USD_TOKEN_ADDRESS      = "0xF4CDA7Aa0f5BA533292135E5439B0b3E768FD3bb";

module.exports = async function (callback) {
    try {
        // ── artifacts ────────────────────────────────────────────────────────
        const ISecurityToken = artifacts.require("ISecurityToken");
        const USDTieredSTO   = artifacts.require("USDTieredSTO");
        const PolyTokenFaucet = artifacts.require("PolyTokenFaucet"); // For USD token interface

        const accounts = await web3.eth.getAccounts();
        const buyer = accounts[0]; // Buyer must be whitelisted

        console.log("\n── Estate Protocol USD Purchase Test ──────────────────────");
        console.log(`Buyer: ${buyer}`);
        console.log(`Security Token: ${SECURITY_TOKEN_ADDRESS}`);
        console.log(`STO: ${USD_TIERED_STO_ADDRESS}`);
        console.log(`USD Token: ${USD_TOKEN_ADDRESS}`);

        // ── Load contracts ───────────────────────────────────────────────────
        const secToken = await ISecurityToken.at(SECURITY_TOKEN_ADDRESS);
        const sto = await USDTieredSTO.at(USD_TIERED_STO_ADDRESS);
        const usdToken = await PolyTokenFaucet.at(USD_TOKEN_ADDRESS);

        // ── USD token decimals ───────────────────────────────────────────────
        const USD_DECIMALS = new BN(6); // USDC has 6 decimals
        const USD_UNIT = new BN(10).pow(USD_DECIMALS);

        // ── Check balances ───────────────────────────────────────────────────
        console.log("\n[1/4] Checking balances ...");
        const buyerUsdBalance = new BN(await usdToken.balanceOf(buyer));
        console.log(`      Buyer USD balance: ${buyerUsdBalance.div(USD_UNIT)} USDC`);

        const buyerTokenBalanceBefore = new BN(await secToken.balanceOf(buyer));
        console.log(`      Buyer token balance (before): ${buyerTokenBalanceBefore.div(ONE_ETHER)} tokens`);

        // ── Check STO configuration ──────────────────────────────────────────
        console.log("\n[2/4] Checking STO configuration ...");
        const d = await sto.getSTODetails();
        const ratePerToken = new BN(d[4][0]); // USD per token (18 decimals)
        const minimumInvestmentUSD = new BN(await sto.minimumInvestmentUSD()); // Direct getter (18 decimals)

        console.log(`      Rate: ${ratePerToken.div(ONE_ETHER)} USD per token`);
        console.log(`      Minimum investment: ${minimumInvestmentUSD.div(ONE_ETHER)} USD`);
        console.log(`      Is open: ${await sto.isOpen()}`);

        // ── Calculate purchase amount ────────────────────────────────────────
        console.log("\n[3/4] Calculating purchase amount ...");
        const TOKENS_TO_BUY = new BN(10).mul(ONE_ETHER); // 10 tokens (18 decimals)

        // Cost in USD (18 decimals) - this is what buyWithUSD() expects!
        const USD_COST_18_DECIMALS = TOKENS_TO_BUY.mul(ratePerToken).div(ONE_ETHER);
        console.log(`      Cost in USD (18 decimals): ${USD_COST_18_DECIMALS.toString()} = ${USD_COST_18_DECIMALS.div(ONE_ETHER)} USD`);

        // Verify minimum (compare in 18 decimals)
        if (USD_COST_18_DECIMALS.lt(minimumInvestmentUSD)) {
            throw new Error(`Investment ${USD_COST_18_DECIMALS.div(ONE_ETHER)} USD is below minimum ${minimumInvestmentUSD.div(ONE_ETHER)} USD`);
        }

        // ── Purchase tokens ──────────────────────────────────────────────────
        console.log("\n[4/4] Purchasing tokens ...");
        console.log(`      Buying ${TOKENS_TO_BUY.div(ONE_ETHER)} tokens for ${USD_COST_18_DECIMALS.div(ONE_ETHER)} USD`);

        // Approve STO to spend USD (in 18 decimals) - contract handles decimal conversion internally
        console.log(`      Approving ${USD_COST_18_DECIMALS.div(ONE_ETHER)} USD to STO...`);
        await usdToken.approve(sto.address, USD_COST_18_DECIMALS.toString(), { from: buyer });

        // Pass 18-decimal amount (contract converts to token's native decimals internally)
        console.log(`      Calling buyWithUSD with 18-decimal amount: ${USD_COST_18_DECIMALS.toString()}`);
        const buyTx = await sto.buyWithUSD(
            buyer,                                // beneficiary
            USD_COST_18_DECIMALS.toString(),      // invested USD amount in 18 decimals
            usdToken.address,                     // USD token address
            { from: buyer }
        );

        console.log(`      ✓ Purchase successful! Tx: ${buyTx.tx}`);

        // ── Verify results ───────────────────────────────────────────────────
        console.log("\n[Verification]");
        const buyerTokenBalanceAfter = new BN(await secToken.balanceOf(buyer));
        console.log(`      Buyer token balance (after): ${buyerTokenBalanceAfter.div(ONE_ETHER)} tokens`);

        const tokensReceived = buyerTokenBalanceAfter.sub(buyerTokenBalanceBefore);
        console.log(`      Tokens received: ${tokensReceived.div(ONE_ETHER)} tokens`);

        if (!tokensReceived.eq(TOKENS_TO_BUY)) {
            throw new Error(`Expected ${TOKENS_TO_BUY.div(ONE_ETHER)} tokens, got ${tokensReceived.div(ONE_ETHER)}`);
        }

        const buyerUsdBalanceAfter = new BN(await usdToken.balanceOf(buyer));
        const usdSpent = buyerUsdBalance.sub(buyerUsdBalanceAfter);
        console.log(`      USD spent: ${usdSpent.div(USD_UNIT)} USDC`);

        console.log("\n  ✓ Purchase test successful!\n");
        callback();

    } catch (e) {
        console.error("\n[FATAL]", e.message);
        console.error(e);
        callback(e);
    }
};
