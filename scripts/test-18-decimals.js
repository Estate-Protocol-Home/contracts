/**
 * Test purchasing with 18-decimal amounts (like CLI does)
 */

const Web3 = require("web3");
const BN = Web3.utils.BN;
const ONE_ETHER = new BN(10).pow(new BN(18));

const SECURITY_TOKEN_ADDRESS = "0xc320d7c30a96B68500586DFF4113b280bcf32a71";
const USD_TIERED_STO_ADDRESS = "0xE7DC7f529Ba0fCcD4699D0BfC1BAee78f988e008";
const USD_TOKEN_ADDRESS      = "0xF4CDA7Aa0f5BA533292135E5439B0b3E768FD3bb";

module.exports = async function (callback) {
    try {
        const ISecurityToken = artifacts.require("ISecurityToken");
        const USDTieredSTO   = artifacts.require("USDTieredSTO");
        const PolyTokenFaucet = artifacts.require("PolyTokenFaucet");

        const accounts = await web3.eth.getAccounts();
        const buyer = accounts[0];

        console.log("\n=== Testing with 18-decimal amounts (CLI approach) ===\n");
        console.log(`Buyer: ${buyer}`);

        const secToken = await ISecurityToken.at(SECURITY_TOKEN_ADDRESS);
        const sto = await USDTieredSTO.at(USD_TIERED_STO_ADDRESS);
        const usdToken = await PolyTokenFaucet.at(USD_TOKEN_ADDRESS);

        // Check configuration
        const d = await sto.getSTODetails();
        const ratePerToken = new BN(d[4][0]);
        console.log(`Rate per token: ${ratePerToken.div(ONE_ETHER)} USD`);

        // Calculate 100 USD in 18 decimals (like CLI)
        const INVESTMENT_USD_18_DECIMALS = new BN(100).mul(ONE_ETHER);
        console.log(`Investment amount: ${INVESTMENT_USD_18_DECIMALS.div(ONE_ETHER)} USD (${INVESTMENT_USD_18_DECIMALS.toString()} raw)`);

        // Approve in 18 decimals
        console.log("\nApproving STO to spend 100 * 10^18...");
        await usdToken.approve(sto.address, INVESTMENT_USD_18_DECIMALS.toString(), { from: buyer });
        console.log("✓ Approved");

        // Try to buy
        console.log("\nCalling buyWithUSD with 18-decimal amount...");
        try {
            const buyTx = await sto.buyWithUSD(
                buyer,
                INVESTMENT_USD_18_DECIMALS.toString(),  // 100 * 10^18
                usdToken.address,
                { from: buyer }
            );
            console.log(`✓ SUCCESS! Transaction: ${buyTx.tx}`);

            // Check result
            const tokensReceived = new BN(await secToken.balanceOf(buyer));
            console.log(`Tokens received: ${tokensReceived.div(ONE_ETHER)}`);
        } catch (e) {
            console.log(`✗ FAILED: ${e.message}`);
            if (e.receipt) {
                console.log(`Transaction hash: ${e.receipt.transactionHash}`);
            }
        }

        callback();
    } catch (e) {
        console.error(e);
        callback(e);
    }
};
