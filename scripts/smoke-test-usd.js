/**
 * Estate Protocol — USD Purchase Smoke Test (Fresh USDC)
 *
 * Tests complete USD stablecoin purchase flow with freshly deployed 6-decimal MockUSDToken:
 *   1. Register ticker
 *   2. Generate security token
 *   3. Configure GTM with EstateProtocolWhitelistSTO
 *   4. Whitelist buyer
 *   5. Attach USDTieredSTO (USD-only fundraise)
 *   6. Verify STO configuration
 *   7. Purchase tokens with USD stablecoin
 *   8. Verify token balances
 *   9. Verify STO accounting
 *
 * Prerequisites:
 *   • Migration 1 (PolyTokenFaucet) and Migration 2 (full protocol) have run.
 *   • Migration 3 (MockUSDToken) has run.
 *   • verify-bootstrap.js passes 49/49.
 */

const Web3       = require("web3");
const BN         = Web3.utils.BN;
const NULL       = "0x0000000000000000000000000000000000000000";
const ONE_ETHER  = new BN(10).pow(new BN(18));          // 1e18

// ── ABI stub for USDTieredSTO.configure() ─────────────────────────────────
const CONFIGURE_ABI = {
    name: "configure",
    type: "function",
    inputs: [
        { type: "uint256",  name: "_startTime"                  },
        { type: "uint256",  name: "_endTime"                    },
        { type: "uint256[]", name: "_ratePerTier"               },
        { type: "uint256[]", name: "_ratePerTierDiscountPoly"   },
        { type: "uint256[]", name: "_tokensPerTierTotal"        },
        { type: "uint256[]", name: "_tokensPerTierDiscountPoly" },
        { type: "uint256",  name: "_nonAccreditedLimitUSD"      },
        { type: "uint256",  name: "_minimumInvestmentUSD"       },
        { type: "uint8[]",  name: "_fundRaiseTypes"             },
        { type: "address",  name: "_wallet"                     },
        { type: "address",  name: "_treasuryWallet"             },
        { type: "address[]", name: "_usdTokens"                 },
    ]
};

module.exports = async function (callback) {
    try {
        // ── artifacts ────────────────────────────────────────────────────────
        const PolyTokenFaucet               = artifacts.require("PolyTokenFaucet");
        const SecurityTokenRegistryProxy    = artifacts.require("SecurityTokenRegistryProxy");
        const SecurityTokenRegistry         = artifacts.require("SecurityTokenRegistry");
        const STRGetter                     = artifacts.require("STRGetter");
        const ISecurityToken                = artifacts.require("ISecurityToken");
        const USDTieredSTOFactory           = artifacts.require("USDTieredSTOFactory");
        const USDTieredSTO                  = artifacts.require("USDTieredSTO");
        const GeneralTransferManager        = artifacts.require("GeneralTransferManager");
        const EstateProtocolWhitelistSTO    = artifacts.require("EstateProtocolWhitelistSTO");

        const accounts = await web3.eth.getAccounts();
        const deployer = accounts[0];
        const buyer    = accounts[1] || deployer; // Use separate account if available

        // ── deployed instances ───────────────────────────────────────────────
        const polyToken              = await PolyTokenFaucet.deployed();
        
        // Use provided USDC address
        const USD_TOKEN_ADDRESS = "0xF4CDA7Aa0f5BA533292135E5439B0b3E768FD3bb";
        
        // Create minimal ERC20 contract interface
        const ERC20_ABI = [
            {"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"},
            {"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"type":"function"},
            {"constant":true,"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"},
            {"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function"}
        ];
        const TruffleContract = require("@truffle/contract");
        const ERC20Contract = TruffleContract({abi: ERC20_ABI});
        ERC20Contract.setProvider(web3.currentProvider);
        const usdToken = await ERC20Contract.at(USD_TOKEN_ADDRESS);
        
        const strProxyInst           = await SecurityTokenRegistryProxy.deployed();
        const str                    = await SecurityTokenRegistry.at(strProxyInst.address);
        const strGetter              = await STRGetter.at(strProxyInst.address);
        const usdTieredSTOFactory    = await USDTieredSTOFactory.deployed();
        const whitelistSTO           = await EstateProtocolWhitelistSTO.deployed();

        console.log("\n── Estate Protocol USD Purchase Smoke Test (Fresh USDC) ──────");
        console.log(`Deployer: ${deployer}`);
        console.log(`Buyer:    ${buyer}`);
        console.log(`USDC: ${USD_TOKEN_ADDRESS}`);

        // Verify token decimals
        const usdDecimals = await usdToken.decimals();
        const usdSymbol = await usdToken.symbol();
        console.log(`USD Token: ${usdSymbol}, Decimals: ${usdDecimals}`);

        if (usdDecimals.toString() !== "6") {
            throw new Error(`Expected 6 decimals, got ${usdDecimals}`);
        }

        // Define USD decimals for later use
        const USD_DECIMALS = new BN(6); // USDC has 6 decimals
        const USD_UNIT = new BN(10).pow(USD_DECIMALS);

        // Check buyer's existing USDC balance (no faucet - using real token)
        const buyerUsdBalance = new BN(await usdToken.balanceOf(buyer));
        console.log(`\nBuyer USD balance: ${buyerUsdBalance.div(USD_UNIT)} USDC`);

        // ── 1. register ticker ───────────────────────────────────────────────
        const TICKER = "PROP" + Math.floor(Date.now() / 1000).toString(16).slice(-5).toUpperCase();
        console.log(`\n[1/9] Registering ticker "${TICKER}" ...`);
        await str.registerNewTicker(deployer, TICKER, { from: deployer });

        const tickerFree = await str.tickerAvailable(TICKER);
        if (tickerFree) throw new Error(`Ticker ${TICKER} still shows available after registration`);
        console.log(`      Ticker "${TICKER}" registered and locked.`);

        // ── 2. generate security token ───────────────────────────────────────
        console.log("[2/9] Generating security token ...");
        await str.generateNewSecurityToken(
            "Property Token",        // _name
            TICKER,                  // _ticker
            "Real Estate Security",  // _tokenDetails
            true,                    // _divisible
            deployer,                // _treasuryWallet
            0,                       // _protocolVersion (0 → latest = 3.0.0)
            { from: deployer }
        );

        const tokenAddress = await strGetter.getSecurityTokenAddress(TICKER);
        console.log(`      Security token created at ${tokenAddress}`);

        const secToken = await ISecurityToken.at(tokenAddress);
        const tokenOwner = await secToken.owner();

        if (tokenOwner.toLowerCase() !== deployer.toLowerCase()) {
            throw new Error(`Token owner is ${tokenOwner}, expected ${deployer}`);
        }

        const tmModules = await secToken.getModulesByType(2);
        if (tmModules.length === 0) throw new Error("GeneralTransferManager was not auto-attached");
        console.log(`      GTM auto-attached at ${tmModules[0]}`);

        // Get GTM instance and set whitelist STO
        const gtm = await GeneralTransferManager.at(tmModules[0]);

        // ── 3. configure GTM to use EstateProtocolWhitelistSTO ───────────────
        console.log("[3/9] Setting custom whitelist STO on GTM ...");
        await gtm.changeWhitelistSTO(whitelistSTO.address, { from: deployer });
        console.log(`      Whitelist STO set to: ${whitelistSTO.address}`);

        // ── 4. whitelist buyer via EstateProtocolWhitelistSTO ────────────────
        console.log("[4/9] Whitelisting buyer via EstateProtocolWhitelistSTO ...");
        const now = Math.floor(Date.now() / 1000);
        const expiryTime = now + (365 * 24 * 60 * 60); // 1 year from now

        await whitelistSTO.modifyKYCData(
            buyer,              // _investor
            expiryTime,         // _expiryTime (1 year validity)
            false,              // _isAccredited (non-accredited investor)
            { from: deployer }
        );
        console.log(`      Buyer ${buyer} whitelisted (KYC expires in 1 year)`);

        // ── Initialize token in EstateProtocolWhitelistSTO ──────────────────
        console.log("[4b/9] Initializing token in whitelist STO ...");
        console.log(`      Token address: ${tokenAddress}`);

        // Enable transfers for this token
        await whitelistSTO.modifyTokenTransferStatus(tokenAddress, true, { from: deployer });
        console.log(`      Token transfer status set to: true`);

        // Set lock start time (use current time)
        await whitelistSTO.addTokenLockStartTime(tokenAddress, Math.floor(Date.now() / 1000), { from: deployer });
        console.log(`      Token lock start time set`);

        // ── 5. attach USDTieredSTO (USD-only fundraise) ──────────────────────
        console.log("[5/9] Attaching USDTieredSTO (USD-only) ...");

        const nowSec     = Math.floor(Date.now() / 1000);
        const startTime  = nowSec + 30;         // Starts in 30 seconds (must be future)
        const endTime    = nowSec + 86400;      // Ends in 24 hours

        // Single tier: 250 USD per token, 1000 tokens available
        // IMPORTANT: Use USD token's native decimals (USD_UNIT) for rate/limits to match SDK behavior
        const USD_PER_TOKEN            = new BN(250).mul(USD_UNIT);  // 250 USD/token in USD token's decimals
        const ratePerTier              = [USD_PER_TOKEN.toString()];
        const ratePerTierDiscountPoly  = [USD_PER_TOKEN.toString()]; // No POLY discount (not used)
        const tokensPerTierTotal       = [new BN(1000).mul(ONE_ETHER).toString()];
        const tokensPerTierDiscountPoly= [new BN(0).toString()];     // No POLY discount pool
        const nonAccreditedLimitUSD    = new BN(50000).mul(USD_UNIT).toString(); // 50,000 USD in USD token's decimals
        const minimumInvestmentUSD     = new BN(250).mul(USD_UNIT).toString();   // 250 USD minimum in USD token's decimals
        const fundRaiseTypes           = [2];  // SC (stablecoin) only
        const wallet                   = "0xb1B560CD3929949B079d5f51A570891c69C7682D";  // Receives USD payments
        const treasuryWallet           = deployer;  // Receives any unsold tokens at end of STO
        const usdTokens                = [USD_TOKEN_ADDRESS];

        const configureData = web3.eth.abi.encodeFunctionCall(CONFIGURE_ABI, [
            startTime,
            endTime,
            ratePerTier,
            ratePerTierDiscountPoly,
            tokensPerTierTotal,
            tokensPerTierDiscountPoly,
            nonAccreditedLimitUSD,
            minimumInvestmentUSD,
            fundRaiseTypes,
            wallet,
            treasuryWallet,
            usdTokens,
        ]);

        console.log(`      Factory: ${usdTieredSTOFactory.address}`);
        console.log(`      Start time: ${startTime} (${new Date(startTime * 1000).toISOString()})`);
        console.log(`      End time: ${endTime} (${new Date(endTime * 1000).toISOString()})`);
        console.log(`      USD token: ${USD_TOKEN_ADDRESS}`);
        console.log(`      Fund raise types: [${fundRaiseTypes}]`);

        await secToken.addModule(
            usdTieredSTOFactory.address,
            configureData,
            0,                     // _maxCost (no setup fee)
            0,                     // _budget
            false,                 // _archived
            { from: deployer }
        );
        console.log(`      USDTieredSTO attached successfully`);

        // ── 6. verify STO configuration ──────────────────────────────────────
        console.log("[6/9] Verifying STO configuration ...");

        const stoModules = await secToken.getModulesByType(3);
        if (stoModules.length === 0) throw new Error("No STO module found after addModule");

        const stoAddress = stoModules[0];
        console.log(`      USDTieredSTO at ${stoAddress}`);

        const sto = await USDTieredSTO.at(stoAddress);

        const d = await sto.getSTODetails();
        console.log("\n  ── STO Configuration ──────────────────────────────");
        console.log(`  startTime        ${d[0]}  (${new Date(Number(d[0]) * 1000).toISOString()})`);
        console.log(`  endTime          ${d[1]}  (${new Date(Number(d[1]) * 1000).toISOString()})`);
        console.log(`  tier[0] cap      ${new BN(d[3][0]).div(ONE_ETHER)} tokens`);
        console.log(`  tier[0] rate     ${new BN(d[4][0]).div(ONE_ETHER)} USD`);
        console.log(`  fundRaiseTypes   ETH=${d[8][0]}  POLY=${d[8][1]}  SC=${d[8][2]}`);
        console.log(`  isOpen           ${await sto.isOpen()}`);

        if (!d[8][2]) throw new Error("Stablecoin fund-raise type not enabled");
        if (d[8][0] || d[8][1]) throw new Error("ETH/POLY should be disabled");

        let isOpen = await sto.isOpen();
        console.log(`      isOpen (before start): ${isOpen}`);

        if (!isOpen) {
            const waitTime = startTime - Math.floor(Date.now() / 1000) + 2; // Wait until start + 2 sec buffer
            if (waitTime > 0) {
                console.log(`      Waiting ${waitTime} seconds for STO to start...`);
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                isOpen = await sto.isOpen();
                console.log(`      isOpen (after wait): ${isOpen}`);
            }
        }

        if (!isOpen) throw new Error("STO is still not open after waiting");

        console.log("\n  ✓ STO configured correctly and now open for investment");

        // ── 7. purchase tokens with USD ──────────────────────────────────────
        console.log("\n[7/9] Buying property tokens with USD stablecoin ...");

        const TOKENS_TO_BUY = new BN(10).mul(ONE_ETHER);  // 10 tokens (18 decimals)

        // Calculate USD cost: (10 tokens * 10 USD/token) = 100 USD
        // USD_PER_TOKEN is already in token's native decimals (10 * 10^6 for 6-decimal USDC)
        const USD_COST_PER_TOKEN_HUMAN = new BN(250); // 250 USD per token (human-readable)
        const USD_REQUIRED_NATIVE = TOKENS_TO_BUY.div(ONE_ETHER).mul(USD_COST_PER_TOKEN_HUMAN).mul(USD_UNIT); // 10 tokens * 250 USD * 10^6

        console.log(`      Purchasing ${TOKENS_TO_BUY.div(ONE_ETHER)} tokens for ${USD_REQUIRED_NATIVE.div(USD_UNIT)} USD`);
        console.log(`      Amount in token's native decimals: ${USD_REQUIRED_NATIVE.toString()} (${usdDecimals} decimals)`);

        // Approve and buy with NATIVE decimals
        await usdToken.approve(sto.address, USD_REQUIRED_NATIVE.toString(), { from: buyer });
        console.log(`      Approved ${USD_REQUIRED_NATIVE.div(USD_UNIT)} USD to STO`);

        console.log(`      Calling buyWithUSD with ${usdDecimals}-decimal amount...`);
        const buyTx = await sto.buyWithUSD(
            buyer,                           // beneficiary
            USD_REQUIRED_NATIVE.toString(),  // invested USD amount in token's native decimals (6)
            USD_TOKEN_ADDRESS,               // USD token address
            { from: buyer }
        );

        console.log(`      Purchase transaction: ${buyTx.tx}`);

        // ── 8. verify token balance ──────────────────────────────────────────
        console.log("[8/9] Verifying token balances ...");

        const buyerTokenBalance = new BN(await secToken.balanceOf(buyer));
        console.log(`      Buyer token balance: ${buyerTokenBalance.div(ONE_ETHER)} tokens`);

        if (!buyerTokenBalance.eq(TOKENS_TO_BUY)) {
            throw new Error(
                `Token balance mismatch: got ${buyerTokenBalance.toString()}, expected ${TOKENS_TO_BUY.toString()}`
            );
        }

        // ── 9. verify STO accounting ─────────────────────────────────────────
        console.log("[9/9] Verifying STO accounting ...");

        const d2 = await sto.getSTODetails();
        const tokensSold = new BN(d2[7]);
        const fundsRaisedUSD = new BN(d2[5]);

        console.log(`      Tokens sold:      ${tokensSold.div(ONE_ETHER)} tokens`);
        console.log(`      Funds raised:     ${fundsRaisedUSD.div(USD_UNIT)} USD (in ${usdDecimals}-decimal scale)`);
        console.log(`      Investor count:   ${d2[6]}`);

        if (!tokensSold.eq(TOKENS_TO_BUY)) {
            throw new Error(`tokensSold mismatch: got ${tokensSold.toString()}, expected ${TOKENS_TO_BUY.toString()}`);
        }

        // fundsRaisedUSD is stored in the USD token's native decimal scale
        if (!fundsRaisedUSD.eq(USD_REQUIRED_NATIVE)) {
            throw new Error(`fundsRaisedUSD mismatch: got ${fundsRaisedUSD.toString()}, expected ${USD_REQUIRED_NATIVE.toString()}`);
        }

        // Verify wallet received the USD (in 6 decimals)
        const walletBalance = new BN(await usdToken.balanceOf(wallet));
        console.log(`      Wallet USD balance: ${walletBalance.div(USD_UNIT)} USDC`);

        console.log("\n  ✓ All checks passed — USD purchase successful!\n");
        console.log("  Summary:");
        console.log(`    • Token: ${TICKER}`);
        console.log(`    • STO: ${stoAddress}`);
        console.log(`    • USD Token: ${USD_TOKEN_ADDRESS} (${usdSymbol}, ${usdDecimals} decimals)`);
        console.log(`    • Tokens purchased: ${TOKENS_TO_BUY.div(ONE_ETHER)}`);
        console.log(`    • USD spent: ${USD_REQUIRED_NATIVE.div(USD_UNIT)}`);
        console.log(`    • Wallet received: ${walletBalance.div(USD_UNIT)} USDC`);

        callback();

    } catch (e) {
        console.error("\n[FATAL]", e.message);
        console.error(e);
        callback(e);
    }
};
