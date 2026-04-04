/**
 * Deploy MockUSDToken (6 decimals) for testing
 */

const MockUSDToken = artifacts.require("MockUSDToken");

module.exports = async function (deployer, network, accounts) {
    console.log(`\n[Migration 3] Deploying MockUSDToken (6 decimals)...`);
    console.log(`Network: ${network}`);
    console.log(`Deployer: ${accounts[0]}`);

    await deployer.deploy(MockUSDToken);
    const mockUSDC = await MockUSDToken.deployed();

    console.log(`✓ MockUSDToken deployed at: ${mockUSDC.address}`);

    const decimals = await mockUSDC.decimals();
    const symbol = await mockUSDC.symbol();
    const balance = await mockUSDC.balanceOf(accounts[0]);

    console.log(`  Symbol: ${symbol}`);
    console.log(`  Decimals: ${decimals}`);
    console.log(`  Initial supply to deployer: ${balance.toString()} (${web3.utils.fromWei(balance, 'mwei')} USDC)`);
};
