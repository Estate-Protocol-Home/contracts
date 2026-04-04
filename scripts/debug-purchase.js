/**
 * Debug script to understand the decimal issue
 */

const Web3 = require("web3");
const BN = Web3.utils.BN;
const ONE_ETHER = new BN(10).pow(new BN(18));

const SECURITY_TOKEN_ADDRESS = "0xc320d7c30a96B68500586DFF4113b280bcf32a71";
const USD_TIERED_STO_ADDRESS = "0xE7DC7f529Ba0fCcD4699D0BfC1BAee78f988e008";
const USD_TOKEN_ADDRESS      = "0xF4CDA7Aa0f5BA533292135E5439B0b3E768FD3bb";

module.exports = async function (callback) {
    try {
        const USDTieredSTO = artifacts.require("USDTieredSTO");
        const PolyTokenFaucet = artifacts.require("PolyTokenFaucet");

        const sto = await USDTieredSTO.at(USD_TIERED_STO_ADDRESS);
        const usdToken = await PolyTokenFaucet.at(USD_TOKEN_ADDRESS);

        console.log("\n=== Debug: USDTieredSTO Decimal Handling ===\n");

        // Check USD token decimals
        const decimals = await usdToken.decimals();
        console.log(`USD Token decimals: ${decimals}`);

        // Check STO configuration
        const minimumInvestmentUSD = await sto.minimumInvestmentUSD();
        console.log(`Minimum investment (from STO): ${new BN(minimumInvestmentUSD).div(ONE_ETHER)} USD`);
        console.log(`Minimum investment (raw): ${minimumInvestmentUSD}`);

        // Check rate for SC (calling with .call() to get return value instead of tx)
        const rate = await sto.getRate.call(2); // FundRaiseType.SC = 2
        console.log(`\nRate for SC (stablecoin): ${new BN(rate).div(ONE_ETHER)} (${rate})`);

        // Calculate what happens with 100 USD investment
        console.log("\n--- Calculation for 100 USD investment ---");
        const investmentUSD_18_decimals = new BN(100).mul(ONE_ETHER);
        console.log(`Investment amount (18 decimals): ${investmentUSD_18_decimals.toString()} = ${investmentUSD_18_decimals.div(ONE_ETHER)} USD`);

        // What the STO will try to transfer (spentValue calculation)
        // spentValue = DecimalMath.div(spentUSD, rate) = (spentUSD * 10^18) / rate
        const spentValue = investmentUSD_18_decimals.mul(ONE_ETHER).div(new BN(rate));
        console.log(`spentValue (what STO will transferFrom): ${spentValue.toString()}`);
        console.log(`  In 18 decimals: ${spentValue.div(ONE_ETHER)}`);
        console.log(`  In 6 decimals: ${spentValue.div(new BN(10).pow(new BN(12)))}`);

        // What we actually need for 6-decimal USDC
        const needed_6_decimals = new BN(100).mul(new BN(10).pow(new BN(6)));
        console.log(`\nWhat we actually need (6 decimals): ${needed_6_decimals.toString()} = 100 USDC`);

        console.log("\n=== ISSUE ===");
        console.log(`STO will try to transfer: ${spentValue.toString()} (100 * 10^18)`);
        console.log(`But USDC only has balance in: 10^6 scale`);
        console.log(`This will fail because the amount is 10^12 times too large!`);

        // Test convertFromUSD - this might do the decimal conversion
        console.log("\n=== Testing convertFromUSD ===");
        const convertedAmount = await sto.convertFromUSD.call(2, investmentUSD_18_decimals.toString());
        console.log(`convertFromUSD(SC, 100 * 10^18): ${convertedAmount.toString()}`);
        console.log(`  In 18 decimals: ${new BN(convertedAmount).div(ONE_ETHER)}`);
        console.log(`  In 6 decimals: ${new BN(convertedAmount).div(new BN(10).pow(new BN(6)))}`);

        console.log("\n=== CONCLUSION ===");
        if (new BN(convertedAmount).toString() === needed_6_decimals.toString()) {
            console.log("✓ The STO DOES correctly convert to 6 decimals!");
            console.log("The issue might be elsewhere (approval, balance, etc.)");
        } else if (new BN(spentValue).toString() === needed_6_decimals.toString()) {
            console.log("✓ The spentValue calculation is correct!");
        } else {
            console.log("✗ Decimal conversion mismatch found");
        }

        callback();
    } catch (e) {
        console.error(e);
        callback(e);
    }
};
