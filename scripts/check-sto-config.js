/**
 * Check actual STO configuration on Arbitrum Sepolia
 */

const Web3 = require("web3");
const BN = Web3.utils.BN;
const ONE_ETHER = new BN(10).pow(new BN(18));

// Addresses from your smoke test
const USD_TIERED_STO_ADDRESS = "0x593252DD51E59Fa30CBCAfD93a39E68323A4431f";  // From error
const USD_TOKEN_ADDRESS      = "0x659428dD348A4E38D0eA7F0cc1A95DaABbdeE567";  // From your log

module.exports = async function (callback) {
    try {
        const USDTieredSTO   = artifacts.require("USDTieredSTO");
        const PolyTokenFaucet = artifacts.require("PolyTokenFaucet");

        console.log("\n══════════════════════════════════════════════════════");
        console.log("  Checking Arbitrum Sepolia STO Configuration");
        console.log("══════════════════════════════════════════════════════\n");

        const sto = await USDTieredSTO.at(USD_TIERED_STO_ADDRESS);
        const usdToken = await PolyTokenFaucet.at(USD_TOKEN_ADDRESS);

        // Check USD token decimals
        const decimals = await usdToken.decimals();
        const symbol = await usdToken.symbol();
        console.log(`USD Token: ${USD_TOKEN_ADDRESS}`);
        console.log(`  Symbol: ${symbol}`);
        console.log(`  Decimals: ${decimals}`);
        console.log();

        // Check STO configuration
        const minimumInvestmentUSD = await sto.minimumInvestmentUSD();
        const nonAccreditedLimitUSD = await sto.nonAccreditedLimitUSD();

        console.log("STO Configuration:");
        console.log(`  minimumInvestmentUSD (raw): ${minimumInvestmentUSD.toString()}`);
        console.log(`  minimumInvestmentUSD (÷ 10^18): ${new BN(minimumInvestmentUSD).div(ONE_ETHER).toString()}`);
        console.log(`  minimumInvestmentUSD (÷ 10^6): ${new BN(minimumInvestmentUSD).div(new BN(10).pow(new BN(6))).toString()}`);
        console.log();
        console.log(`  nonAccreditedLimitUSD (raw): ${nonAccreditedLimitUSD.toString()}`);
        console.log(`  nonAccreditedLimitUSD (÷ 10^18): ${new BN(nonAccreditedLimitUSD).div(ONE_ETHER).toString()}`);
        console.log(`  nonAccreditedLimitUSD (÷ 10^6): ${new BN(nonAccreditedLimitUSD).div(new BN(10).pow(new BN(6))).toString()}`);
        console.log();

        // Get tier info
        const d = await sto.getSTODetails();
        console.log("STO Tier Info:");
        console.log(`  Rate per token (raw): ${d[4][0].toString()}`);
        console.log(`  Rate per token (÷ 10^18): ${new BN(d[4][0]).div(ONE_ETHER).toString()} USD`);
        console.log(`  Rate per token (÷ 10^6): ${new BN(d[4][0]).div(new BN(10).pow(new BN(6))).toString()}`);
        console.log();
        console.log(`  Is Open: ${await sto.isOpen()}`);
        console.log();

        console.log("══════════════════════════════════════════════════════");
        console.log("Analysis:");
        console.log("══════════════════════════════════════════════════════");

        if (decimals.toString() === "6") {
            console.log("✓ USD Token has 6 decimals (like real USDC)");
            console.log();
            console.log("Expected behavior:");
            console.log(`  - To buy tokens worth 100 USD, you need to pass: 100 * 10^18 = ${new BN(100).mul(ONE_ETHER).toString()}`);
            console.log(`  - Contract will try to transferFrom: 100 * 10^18 tokens`);
            console.log(`  - But USDC only has 100 * 10^6 = ${new BN(100).mul(new BN(10).pow(new BN(6))).toString()} tokens for 100 USDC`);
            console.log(`  - This will FAIL with insufficient balance!`);
            console.log();
            console.log("For it to work with 6 decimals:");
            console.log(`  - You must pass: 100 * 10^6 = ${new BN(100).mul(new BN(10).pow(new BN(6))).toString()}`);
            console.log(`  - But minimumInvestmentUSD must ALSO be in 6 decimals: ${new BN(minimumInvestmentUSD).div(new BN(10).pow(new BN(12))).toString()}`);
        } else if (decimals.toString() === "18") {
            console.log("✓ USD Token has 18 decimals (NOT like real USDC)");
            console.log("  This explains why 18-decimal amounts work!");
        }

        callback();
    } catch (e) {
        console.error("Error:", e);
        callback(e);
    }
};
